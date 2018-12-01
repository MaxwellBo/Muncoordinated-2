import * as React from 'react';
import * as firebase from 'firebase';
import * as FileSaver from 'file-saver';
import { CommitteeData, CommitteeID, recoverMemberOptions } from './Committee';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { Form, Button, Progress, List, DropdownProps, Flag, Container } from 'semantic-ui-react';
import { parseFlagName } from './Member';
import Loading from './Loading';
import { MemberOption } from '../constants';

interface Props extends RouteComponentProps<URLParameters> {
}

export type FileID = string;

export interface FileData {
  filename: string;
  uploader: string;
}

interface FileEntryProps {
  committeeID: CommitteeID;
  file: FileData;
}

interface FileEntryState {
  metadata?: any;
}

class FileEntry extends React.Component<FileEntryProps, FileEntryState> {
  constructor(props: FileEntryProps) {
    super(props);

    this.state = {
    };
  }

  recoverRef = () => {
    const { committeeID, file } = this.props;

    const storageRef = firebase.storage().ref();
    return storageRef.child('committees').child(committeeID).child(file.filename);
  }

  componentDidMount() {
    this.recoverRef().getMetadata().then((metadata: any) => {
      this.setState({ metadata: metadata });
    });
  }

  download = (filename: string) => () => {

    this.recoverRef().getDownloadURL().then((url: any) => {
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = (event) => {
        const blob = xhr.response;
        FileSaver.saveAs(blob, filename);
      };
      xhr.open('GET', url);
      xhr.send();
    });
  }

  render() {
    const { download } = this;
    const { file } = this.props;
    const { metadata } = this.state;

    let description: undefined | JSX.Element;

    if (metadata) {
      const millis = new Date().getTime() - new Date(metadata.timeCreated).getTime();

      const secondsSince = millis / 1000;

      let sinceText: string;

      if (secondsSince < 60) {
        sinceText = `Uploaded ${Math.round(secondsSince)} seconds ago`;
      } else if (secondsSince < 60 * 60) {
        sinceText = `Uploaded ${Math.round(secondsSince / 60 )} minutes ago`;
      } else if (secondsSince < 60 * 60 * 24) {
        sinceText = `Uploaded ${Math.round(secondsSince / (60 * 60))} hours ago`;
      } else {
        sinceText = `Uploaded ${Math.round(secondsSince / (60 * 60 * 24))} days ago`;
      }

      description = <div>{sinceText}, by  <Flag name={parseFlagName(file.uploader)}/>{file.uploader}</div>;
    }

    return (
      <List.Item>
        <List.Icon name="file outline" verticalAlign="middle"/>
        <List.Content>
          <List.Header as="a" onClick={download(file.filename)}>{file.filename}</List.Header>
          {description ? 
            <List.Description as="a">{description}</List.Description>
          : <List.Description as="a"><Loading small /></List.Description>}
          </List.Content>
      </List.Item>
    );
  }
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
  progress?: number;
  file?: any;
  state?: firebase.storage.TaskState;
  errorCode?: string;
  uploader?: MemberOption;
}

export default class Files extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees')
        .child(match.params.committeeID)
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val() });
    }
  }

  componentDidMount() {
    this.state.committeeFref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    this.state.committeeFref.off('value', this.firebaseCallback);
  }

  handleError = (error: any) => {
    // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
    this.setState({ errorCode: error.code });
  }

  handleSnapshot = (snapshot: any) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    this.setState({progress: progress, state: snapshot.state});
  }

  handleComplete = (uploadTask: firebase.storage.UploadTask) => () => {
    const { uploader } = this.state;

    const fileData: FileData = {
      filename: uploadTask.snapshot.ref.name,
      uploader: uploader ? uploader.text : 'Unknown'
    };

    this.state.committeeFref.child('files').push().set(fileData);

    this.setState({ state: uploadTask.snapshot.state });
  }

  onFileChange = (event: any) => {
    this.setState({ file: event.target.files[0] });
  }

  triggerUpload = () => {
    const { handleSnapshot, handleError, handleComplete } = this;
    const { file, uploader } = this.state;

    const { committeeID } = this.props.match.params;

    const storageRef = firebase.storage().ref();

    const metadata = {
      contentType: file.type
    };

    var uploadTask = storageRef.child('committees').child(committeeID).child(file.name).put(file, metadata);

    uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED, 
      handleSnapshot, 
      handleError, 
      handleComplete(uploadTask)
    );
  }

  setMember = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    const memberOptions = recoverMemberOptions(this.state.committee);

    this.setState({ uploader: memberOptions.filter(c => c.value === data.value)[0] });
  }

  render() {
    const { progress, state, errorCode, committee, file, uploader } = this.state;

    const { committeeID } = this.props.match.params;

    const files = committee ? (committee.files || {}) : {};

    const memberOptions = recoverMemberOptions(committee);

    return (
      <Container text style={{ padding: '1em 0em' }}>
        <Progress 
          percent={Math.round(progress || 0 )} 
          progress 
          warning={state === firebase.storage.TaskState.PAUSED}
          success={state === firebase.storage.TaskState.SUCCESS}
          error={!!errorCode} 
          active={true} 
          label={errorCode} 
        />
        <Form onSubmit={this.triggerUpload}>
          <Form.Group>
            <input type="file" onChange={this.onFileChange} />
            <Form.Dropdown
              icon="search"
              key="uploader"
              value={uploader ? uploader.key : undefined}
              search
              selection
              error={!uploader}
              onChange={this.setMember}
              options={memberOptions}
              label="Uploader"
            />
            <Button 
              type="submit" 
              loading={state === firebase.storage.TaskState.RUNNING}
              disabled={!file || !uploader}
            >
                Upload
            </Button>
          </Form.Group>
        </Form>
        <List divided relaxed>
          {committee ? Object.keys(files).reverse().map(key => 
            <FileEntry 
              key={key} 
              committeeID={committeeID}
              file={files[key]}
            />
          ) : <Loading />}
        </List>
      </Container>
    );
  }
}
