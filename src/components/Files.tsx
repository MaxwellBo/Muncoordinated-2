import * as React from 'react';
import * as firebase from 'firebase';
import * as FileSaver from 'file-saver';
import { CommitteeData, CommitteeID, recoverMemberOptions } from './Committee';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { Form, Button, Progress, List, DropdownProps, Flag, Container, Tab, TextArea, TextAreaProps } from 'semantic-ui-react';
import { parseFlagName } from './Member';
import Loading from './Loading';
import { MemberOption } from '../constants';

enum Type {
  Link = 'link',
  File = 'file'
}

export type PostID = string;

export interface Post {
  uploader: string;
  timestamp?: number; // we're just going to have to cop the undefined here
}

interface Link extends Post {
  type: Type.Link;
  url: string;
  name: string;
}

interface File extends Post {
  type: Type.File;
  filename: string;
}

export type PostData = Link | File;

interface FeedPostProps {
  committeeID: CommitteeID;
  post: PostData;
}

interface FeedPostState {
  metadata?: any;
}

class FeedEntry extends React.Component<FeedPostProps, FeedPostState> {
  constructor(props: FeedPostProps) {
    super(props);

    this.state = {
    };
  }

  recoverStorageRef = (): firebase.storage.Reference | null => {
    const { committeeID, post } = this.props;

    if (post.type === Type.File) {
      const storageRef = firebase.storage().ref();
      return storageRef.child('committees').child(committeeID).child(post.filename);
    } else {
      return null;
    }
  }

  componentDidMount() {
    const { post } = this.props;
    const { timestamp } = this.props.post;

    if (!timestamp && post.type === Type.File) {
      this.recoverStorageRef()!.getMetadata().then((metadata: any) => {
        this.setState({ metadata: metadata });
      });
    }
  }

  download = (filename: string) => () => {
    // We should never allow a download to be triggered for post types that 
    // don't permit downloads
    this.recoverStorageRef()!.getDownloadURL().then((url: any) => {
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

  renderDescription = () => {
    const { post } = this.props;

    let sinceText = 'Posted';

    if (post.timestamp) {
      const millis = new Date().getTime() - new Date(post.timestamp).getTime();

      const secondsSince = millis / 1000;

      if (secondsSince < 60) {
        sinceText = `Posted ${Math.round(secondsSince)} seconds ago`;
      } else if (secondsSince < 60 * 60) {
        sinceText = `Posted ${Math.round(secondsSince / 60 )} minutes ago`;
      } else if (secondsSince < 60 * 60 * 24) {
        sinceText = `Posted ${Math.round(secondsSince / (60 * 60))} hours ago`;
      } else {
        sinceText = `Posted ${Math.round(secondsSince / (60 * 60 * 24))} days ago`;
      }
    }

    return (
      <List.Description>
        {sinceText} by  <Flag name={parseFlagName(post.uploader)}/>{post.uploader}
      </List.Description>
    );
  }

  renderFile = (post: File) => {
    return (
      <List.Item>
        <List.Icon name="file outline" verticalAlign="middle"/>
        <List.Content>
          <List.Header as="a" onClick={this.download(post.filename)}>{post.filename}</List.Header>
          {this.renderDescription()}
          </List.Content>
      </List.Item>
    );
  }

  renderLink = (post: Link) => {
    return (
      <List.Item>
        <List.Icon name="linkify" verticalAlign="middle"/>
        <List.Content>
          <List.Header as="a" href={post.url}>{post.url}</List.Header>
          {post.name && <List.Description>
            {post.name}
          </List.Description>}
          {this.renderDescription()}
          </List.Content>
      </List.Item>
    );
  }

  render() {
    const { post } = this.props;

    if (post.type === Type.File) {
      return this.renderFile(post);
    } else if (post.type === Type.Link) {
      return this.renderLink(post);
    } else {
      return this.renderFile(post);
    }
  }
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
  progress?: number;
  file?: any;
  state?: firebase.storage.TaskState;
  link: string;
  body: string;
  errorCode?: string;
  uploader?: MemberOption;
}

interface Props extends RouteComponentProps<URLParameters> {
}

export default class Files extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      link: '',
      body: '',
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

    const file: File = {
      type: Type.File,
      timestamp: new Date().getTime(),
      filename: uploadTask.snapshot.ref.name,
      uploader: uploader ? uploader.text : 'Unknown'
    };

    this.state.committeeFref.child('files').push().set(file);

    this.setState({ state: uploadTask.snapshot.state });
  }

  onFileChange = (event: any) => {
    this.setState({ file: event.target.files[0] });
  }

  postFile = () => {
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
  
  postLink = () => {
    const { uploader, link, body } = this.state;

    const linkData: Link = {
      type: Type.Link,
      timestamp: new Date().getTime(),
      name: body,
      url: link,
      uploader: uploader ? uploader.text : 'Unknown'
    };

    this.state.committeeFref.child('files').push().set(linkData);
  }

  setMember = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    const memberOptions = recoverMemberOptions(this.state.committee);

    this.setState({ uploader: memberOptions.filter(c => c.value === data.value)[0] });
  }

  renderUploader = () => {
    const { progress, state, errorCode, committee, file, uploader } = this.state;

    const memberOptions = recoverMemberOptions(committee);

    return (
      <React.Fragment>
        <Progress 
          percent={Math.round(progress || 0 )} 
          progress 
          warning={state === firebase.storage.TaskState.PAUSED}
          success={state === firebase.storage.TaskState.SUCCESS}
          error={!!errorCode} 
          active={true} 
          label={errorCode} 
        />
        <Form onSubmit={this.postFile}>
          <input type="file" onChange={this.onFileChange} />
          <Form.Group widths="equal">
            <Form.Dropdown
              icon="search"
              key="uploader"
              value={uploader ? uploader.key : undefined}
              search
              fluid
              selection
              error={!uploader}
              onChange={this.setMember}
              options={memberOptions}
              label="Uploader"
              required
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
      </React.Fragment>
    );
  }

  setBody = (event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) => {
    this.setState({ body: data.value!.toString() });
  }

  setName = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({ body: e.currentTarget.value });
  }

  setLink = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({ link: e.currentTarget.value });
  }

  renderLinker = () => {
    const { committee, uploader, body, link } = this.state;

    const memberOptions = recoverMemberOptions(committee);

    return (
      <Form onSubmit={this.postLink}>
        <Form.Input
          value={body}
          onChange={this.setName}
          autoHeight
          label="Name"
          rows={1}
        />
        <Form.Input 
          label="Link"
          required
          error={!link}
          value={link}
          onChange={this.setLink}
          placeholder="https://docs.google.com/document/x"
        />
        <Form.Group widths="equal">
          <Form.Dropdown
            icon="search"
            key="uploader"
            required
            value={uploader ? uploader.key : undefined}
            search
            selection
            error={!uploader}
            onChange={this.setMember}
            options={memberOptions}
            label="Poster"
          />
          <Button 
            type="submit" 
            disabled={!link || !uploader}
          >
              Post
          </Button>
        </Form.Group>
      </Form>
    );
  }

  render() {
    const { committee } = this.state;
    const { committeeID } = this.props.match.params;
    // TODO: rename
    const files = committee ? (committee.files || {}) : {};

    const panes = [
      { 
        menuItem: 'Upload', 
        render: () => <Tab.Pane>{this.renderUploader()}</Tab.Pane> 
      },
      { 
        menuItem: 'Link', 
        render: () => <Tab.Pane>{this.renderLinker()}</Tab.Pane>
      }
    ];

    return (
      <Container text style={{ padding: '1em 0em' }}>
        <Tab panes={panes} />
        <List divided relaxed>
          {committee ? Object.keys(files).reverse().map(key => 
            <FeedEntry 
              key={key} 
              committeeID={committeeID}
              post={files[key]}
            />
          ) : <Loading />}
        </List>
      </Container>
    );
  }
}
