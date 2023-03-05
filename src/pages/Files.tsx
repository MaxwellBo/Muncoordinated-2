import * as React from 'react';
import firebase from 'firebase/app';
import FileSaver from 'file-saver';
import {RouteComponentProps} from 'react-router';
import {URLParameters} from '../types';
import {
  Button,
  Container,
  DropdownProps,
  Feed,
  Flag,
  Form,
  Progress,
  SemanticICONS,
  Tab,
  TextAreaProps
} from 'semantic-ui-react';
import {Helmet} from 'react-helmet';
import {MemberOption, parseFlagName} from '../modules/member';
import Loading from '../components/Loading';
import {DEFAULT_AMENDMENT, putAmendment, ResolutionID} from '../models/resolution';
import {CommitteeData, CommitteeID, recoverMemberOptions} from "../models/committee";
import {File, Link, PostData, PostID, PostType, Text} from "../models/post";
import {COUNTRY_OPTIONS} from "../constants";

const TEXT_ICON: SemanticICONS = 'align left';
const FILE_ICON: SemanticICONS = 'file outline';
const LINK_ICON: SemanticICONS = 'linkify';

interface EntryProps {
  committeeID: CommitteeID;
  post: PostData;
  onDelete: () => void;
  onPromoteToAmendment: () => void;
}

interface EntryState {
  metadata?: any;
}

class Entry extends React.Component<EntryProps, EntryState> {
  constructor(props: EntryProps) {
    super(props);

    this.state = {
    };
  }

  recoverStorageRef = (): firebase.storage.Reference | null => {
    const { committeeID, post } = this.props;

    if (post.type === PostType.File) {
      const storageRef = firebase.storage().ref();
      return storageRef.child('committees').child(committeeID).child(post.filename);
    } else {
      return null;
    }
  }

  componentDidMount() {
    const { post } = this.props;
    const { timestamp } = this.props.post;

    if (!timestamp && post.type === PostType.File) {
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

  renderDate = (action: 'Posted' | 'Uploaded') => {
    const { post } = this.props;

    let sinceText: string = action;

    if (post.timestamp) {
      const millis = new Date().getTime() - new Date(post.timestamp).getTime();

      const secondsSince = millis / 1000;

      if (secondsSince < 60) {
        sinceText = `${action} ${Math.round(secondsSince)} seconds ago`;
      } else if (secondsSince < 60 * 60) {
        sinceText = `${action} ${Math.round(secondsSince / 60 )} minutes ago`;
      } else if (secondsSince < 60 * 60 * 24) {
        sinceText = `${action} ${Math.round(secondsSince / (60 * 60))} hours ago`;
      } else {
        sinceText = `${action} ${Math.round(secondsSince / (60 * 60 * 24))} days ago`;
      }
    }

    return sinceText;
  }

  renderText = (post: Text) => {
    return (
      <Feed.Event>
        <Feed.Label icon={TEXT_ICON} />
        <Feed.Content>
          <Feed.Summary>
            <Feed.User><Flag name={parseFlagName(post.uploader)}/> {post.uploader}</Feed.User>
            <Feed.Date>{this.renderDate('Posted')}</Feed.Date>
          </Feed.Summary>
          <Feed.Extra style={{'whiteSpace': 'pre-wrap'}} text>{post.body}</Feed.Extra>
          <Feed.Meta>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a onClick={this.props.onDelete}>Delete</a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            {post.forResolution && <a onClick={this.props.onPromoteToAmendment}>Create amendment</a>}
          </Feed.Meta>
        </Feed.Content>
      </Feed.Event>
    );
  }

  renderFile = (post: File) => {
    return (
      <Feed.Event>
        <Feed.Label icon={FILE_ICON} />
        <Feed.Content>
          <Feed.Summary>
            <Feed.User><Flag name={parseFlagName(post.uploader)}/> {post.uploader}</Feed.User> publicou um ato normativo
            <Feed.Date>{this.renderDate('Uploaded')}</Feed.Date>
          </Feed.Summary>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <Feed.Extra><a onClick={this.download(post.filename)}>{post.filename}</a></Feed.Extra>
          <Feed.Meta>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a onClick={this.props.onDelete}>Delete</a>
          </Feed.Meta>
        </Feed.Content>
      </Feed.Event>
    );
  }

  renderLink = (post: Link) => {
    return (
      <Feed.Event>
        <Feed.Label icon={LINK_ICON} />
        <Feed.Content>
          <Feed.Summary>
            <Feed.User><Flag name={parseFlagName(post.uploader)}/> {post.uploader}</Feed.User> postou um link
            <Feed.Date>{this.renderDate('Posted')}</Feed.Date>
          </Feed.Summary>
          <Feed.Extra><a href={post.url}>{post.name || post.url}</a></Feed.Extra>
          {/* Show the URL too if the link has name */}
          {post.name && <Feed.Meta><a href={post.url}>{post.url}</a></Feed.Meta>}
          <br />
          <Feed.Meta>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a onClick={this.props.onDelete}>Delete</a>
          </Feed.Meta>
        </Feed.Content>
      </Feed.Event>
    );
  }

  render() {
    const { post } = this.props;

    switch (post.type) {
      case PostType.File:
        return this.renderFile(post);
      case PostType.Link:
        return this.renderLink(post);
      case PostType.Text:
        return this.renderText(post);
      default:
        return this.renderFile(post); // for backwards compat
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
  filtered: MemberOption['key'][];
}

interface Props extends RouteComponentProps<URLParameters> {
  forResolution?: ResolutionID
}

export default class Files extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      link: '',
      body: '',
      committeeFref: firebase.database().ref('committees')
        .child(match.params.committeeID),
      filtered: []
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
    const { forResolution } = this.props;

    let file: File = {
      type: PostType.File,
      timestamp: new Date().getTime(),
      filename: uploadTask.snapshot.ref.name,
      uploader: uploader ? uploader.text : 'Unknown',
    };

    if (forResolution) {
      file = {
        ...file,
        forResolution
      };
    }

    this.state.committeeFref.child('files').push().set(file);

    this.setState({ state: uploadTask.snapshot.state });

    this.clear()
  }

  onFileChange = (event: any) => {
    this.setState({ file: event.target.files[0] });
  }

  clear = () => {
    this.setState({
      link: '',
      body: '',
      file: undefined
    });
  }

  postFile = () => {
    const { handleSnapshot, handleError, handleComplete } = this;
    const { file } = this.state;

    const { committeeID } = this.props.match.params;

    const storageRef = firebase.storage().ref();

    const metadata = {
      contentType: file.type
    };

    var uploadTask = storageRef
      .child('committees')
      .child(committeeID)
      .child(file.name)
      .put(file, metadata);

    uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED, 
      handleSnapshot, 
      handleError, 
      handleComplete(uploadTask)
    );
  }
  
  postLink = () => {
    const { uploader, link, body } = this.state;
    const { forResolution } = this.props;

    let linkData: Link = {
      type: PostType.Link,
      timestamp: new Date().getTime(),
      name: body,
      url: link,
      uploader: uploader ? uploader.text : 'Unknown',
    };

    if (forResolution) {
      linkData = {
        ...linkData,
        forResolution
      };
    }

    this.state.committeeFref.child('files').push().set(linkData);

    this.clear()
  }

  postText = () => {
    const { uploader, body } = this.state;
    const { forResolution } = this.props;

    let linkData: Text = {
      type: PostType.Text,
      timestamp: new Date().getTime(),
      body: body,
      uploader: uploader ? uploader.text : 'Unknown',
    };

    if (forResolution) {
      linkData = {
        ...linkData,
        forResolution
      };
    }

    this.state.committeeFref.child('files').push().set(linkData);
    
    this.clear()
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

  setFilter = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    // @ts-ignore
    this.setState({ filtered: data.value });
  }

  renderFilter = () => {
    const { committee } = this.state;

    const memberOptions = recoverMemberOptions(committee);

    return (
      <Form>
        <Form.Dropdown
          icon="search"
          value={this.state.filtered.map(x => x)}
          search
          multiple
          selection
          onChange={this.setFilter}
          options={memberOptions}
          label="Ver publicações somente de"
        />
      </Form>
    )
  }

  deletePost = (postID: PostID) => () => {
    this.state.committeeFref.child('files').child(postID).remove();
  }

  promoteToAmendment = (post: PostData) => () => {
    const { committeeID } = this.props.match.params;

    if (post.type !== PostType.Text) {
      return;
    }

    if (!post.forResolution) {
      return;
    }

    putAmendment(committeeID, post.forResolution, {
      ...DEFAULT_AMENDMENT,
      proposer: post.uploader,
      text: post.body,
    })

    this.props.history.push(`/committees/${committeeID}/resolutions/${post.forResolution}/amendments`);
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
          label="Nome"
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
            label="Publicante"
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

  renderPoster = () => {
    const { committee, uploader, body } = this.state;

    const memberOptions = recoverMemberOptions(committee);

    return (
      <Form onSubmit={this.postText}>
        <Form.TextArea
          value={body}
          onChange={this.setBody}
          autoHeight={true}
          label="Corpo"
          rows={3}
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
            label="Publicante"
          />
          <Button 
            type="submit" 
            disabled={!body || !uploader}
          >
              Post
          </Button>
        </Form.Group>
      </Form>
    );
  }
  
  isFiltered = (post: PostData) => {
    const { filtered } = this.state;

    if (filtered.length === 0) {
      return true;
    }

    // For custom members
    if (filtered.includes(post.uploader)) {
      return true;
    }
    
    // For default country members
    return COUNTRY_OPTIONS
      .filter(x => filtered.includes(x.key))
      .map(x => x.text)
      .includes(post.uploader)
  }

  isResolutionAssociated = (post: PostData) => {
    if (!this.props.forResolution && post.forResolution) {
      return false;
    }

    if (this.props.forResolution) {
      return this.props.forResolution === post.forResolution;
    }

    return true;
  }

  render() {
    const { committee } = this.state;
    const { committeeID } = this.props.match.params;
    // TODO: rename
    const files = committee ? (committee.files || {}) : {};

    const panes = [
      { 
        menuItem: { key: 'Text', icon: TEXT_ICON, content: 'Text' }, 
        render: () => <Tab.Pane>{this.renderPoster()}</Tab.Pane> 
      },
      { 
        menuItem: { key: 'Link', icon: LINK_ICON, content: 'Link' }, 
        render: () => <Tab.Pane>{this.renderLinker()}</Tab.Pane>
      },
      { 
        menuItem: { key: 'File', icon: FILE_ICON, content: 'File' }, 
        render: () => <Tab.Pane>{this.renderUploader()}</Tab.Pane> 
      },
    ];

    const inner = (
      <>
        <Tab 
          menu={{ attached: true, tabular: false }}
          panes={panes} 
        />
        <div>&nbsp;</div> {/* Whitespace */}
        {this.renderFilter()}
        <Feed size="large">
          {committee ? Object.keys(files).reverse()
            .filter(key => this.isFiltered(files[key]))
            .filter(key => this.isResolutionAssociated(files[key]))
            .map(key =>
              <Entry 
                key={key} 
                onDelete={this.deletePost(key)}
                onPromoteToAmendment={this.promoteToAmendment(files[key])}
                committeeID={committeeID}
                post={files[key]}
              />
          ) : <Loading />}
        </Feed>
      </>
    )

    return this.props.forResolution
      ? inner:
      (
        <Container text style={{ padding: '1em 0em' }}>
          <Helmet>
            <title>{`Posts - Muncoordinated`}</title>
          </Helmet>
          {inner}
        </Container>
      );
  }
}
