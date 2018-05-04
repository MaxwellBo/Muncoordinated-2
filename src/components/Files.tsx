import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData } from './Committee';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { TextArea, Segment, Form, Button, Popup, InputOnChangeData, Progress } from 'semantic-ui-react';
import { textAreaHandler } from '../actions/handlers';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  progress?: number;
  file?: any;
  state?: firebase.storage.TaskState;
}

export default class Files extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
    };
  }

  handleUploadError = (error: any) => {
    // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
    switch (error.code) {
      case 'storage/unauthorized':
        // User doesn't have permission to access the object
        break;
      case 'storage/canceled':
        // User canceled the upload
        break;
      case 'storage/unknown':
        // Unknown error occurred, inspect error.serverResponse
        break;
      default:
        return
    }
  }

  handleSnapshot = (snapshot: any) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    this.setState({progress: progress, state: snapshot.state});
  }

  handleComplete = () => {
    // downloadURL = uploadTask.snapshot.downloadURL;
  }

  onFileChange = (event: any) => {
    this.setState({ file: event.target.files[0] });
  }

  triggerUpload = () => {
    const { handleSnapshot, handleUploadError, handleComplete } = this;
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
      handleUploadError, 
      handleComplete
    );
  }

  render() {
    const { progress, state } = this.state;

    return (
      <div>
        {state}
        <Progress percent={progress || 0} progress active={true} indicating={true} />
        <Form onSubmit={this.triggerUpload}>
          <input type="file" onChange={this.onFileChange} />
          <Button type="submit">Upload</Button>
        </Form>
      </div>
    );
  }
}