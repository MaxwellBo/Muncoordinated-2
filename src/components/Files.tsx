import * as React from 'react';
import * as firebase from 'firebase';
import * as FileSaver from 'file-saver';
import { CommitteeData } from './Committee';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { TextArea, Segment, Form, Button, Popup, InputOnChangeData, Progress, List } from 'semantic-ui-react';
import { textAreaHandler } from '../actions/handlers';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
  progress?: number;
  file?: any;
  state?: firebase.storage.TaskState;
  errorCode?: string
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
    this.state.committeeFref.child('files').push().set(uploadTask.snapshot.ref.name);
    this.setState({ state: uploadTask.snapshot.state });
  }

  onFileChange = (event: any) => {
    this.setState({ file: event.target.files[0] });
  }

  triggerUpload = () => {
    const { handleSnapshot, handleError, handleComplete } = this;
    const { file } = this.state;

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

  download = (fileName: string) => () => {
    const { committeeID } = this.props.match.params;

    const storageRef = firebase.storage().ref();
    const pathReference = storageRef.child('committees').child(committeeID).child(fileName);

    pathReference.getDownloadURL().then((url) => {
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = (event) => {
        const blob = xhr.response;
        FileSaver.saveAs(blob, fileName);
      };
      xhr.open('GET', url);
      xhr.send();
    });
  }

  renderFile = (dbId: string, fileName: string) => {
    const { download } = this;

    return (
      <List.Item key={dbId}>
        <List.Icon name="file outline" verticalAlign="middle"/>
        <List.Content>
          <List.Header as="a" onClick={download(fileName)}>{fileName}</List.Header>
          {/* <List.Description as="a">Updated 10 mins ago</List.Description> */}
        </List.Content>
      </List.Item>
    );
  }

  render() {
    const { renderFile } = this;
    const { progress, state, errorCode, committee } = this.state;

    const files = committee ? (committee.files || {}) : {};

    return (
      <div>
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
            <Button type="submit">Upload</Button>
          </Form.Group>
        </Form>
        <List divided relaxed>
          {Object.keys(files).reverse().map(key => renderFile(key, files[key]))}
        </List>
      </div>
    );
  }
}