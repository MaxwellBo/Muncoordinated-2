import * as React from 'react';
import firebase from 'firebase/app';
import { Card, Button, Form, Message, Modal, Icon, List, Segment } from 'semantic-ui-react';
import { CommitteeID, CommitteeData } from './Committee';
import _ from 'lodash';
import Loading from './Loading';
import { logCreateAccount, logLogin } from '../analytics';

enum Mode {
  Login = 'Login',
  ForgotPassword = 'ForgotPassword'
}

interface State {
  user?: firebase.User | null;
  email: string;
  password: string;
  error?: Error;
  success?: { name?: string, message?: string }; // like Error
  loggingIn: boolean;
  creating: boolean;
  mode: Mode;
  resetting: boolean;
  unsubscribe?: () => void;
  committees?: Record<CommitteeID, CommitteeData>;
}

interface Props {
  allowSignup?: boolean; 
  allowNewCommittee?: boolean;
}

export class Login extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      email: '',
      password: '',
      mode: Mode.Login,
      loggingIn: false,
      creating: false,
      resetting: false
    };
  }

  authStateChangedCallback = (user: firebase.User | null) => {
    this.setState({ loggingIn: false, creating: false, user: user });

    if (user) {
      firebase.database()
        .ref('committees')
        .orderByChild('creatorUid')
        .equalTo(user.uid)
        .once('value').then(committees => {
          // we need to || {} because this returns undefined when it can't find anything
          this.setState({ committees: committees.val() || {} });
        });
    }
  }

  componentDidMount() {
    const unsubscribe = firebase.auth().onAuthStateChanged(
      this.authStateChangedCallback,
    );

    this.setState({ unsubscribe });
  }

  componentWillUnmount() {
    if (this.state.unsubscribe) {
      this.state.unsubscribe();
    }
  }

  handleLogout = () => {
    firebase.auth().signOut().catch(err => {
      this.setState({ error: err });
    });
  }

  handleLogin = () => {
    const { email, password } = this.state;

    this.setState({ loggingIn: true });

    firebase.auth().signInWithEmailAndPassword(email, password).then(credential => {
      this.setState({ loggingIn: false });
      logLogin(credential.user?.uid)
    }).catch(err => {
      this.setState({ loggingIn: false, error: err });
    });
  }

  handleCreate = () => {
    const { email, password } = this.state;
    this.setState({ creating: true });

    firebase.auth().createUserWithEmailAndPassword(email, password).then(credential => {

      const success = { 
        name: 'Account created',
        message: 'Your account was successfully created' 
      };

      this.setState({ creating: false, success });
      logCreateAccount(credential.user?.uid)
    }).catch(err => {
      this.setState({ creating: false, error: err });
    });
  }

  handlePasswordReset = () => {
    const { email } = this.state;
    this.setState({ resetting: true });

    firebase.auth().sendPasswordResetEmail(email).then(() => {
      const success = {
        name: 'Password reset',
        message: `Check your inbox at ${email} for further instructions`
      };

      this.setState({ resetting: false, success });
    }).catch(err => {
      this.setState({ resetting: false, error: err });
    });
  }

  handleDismissError = () => {
    this.setState({ error: undefined });
  }

  handleDismissSuccess = () => {
    this.setState({ success: undefined });
  }

  handleForgotPassword = () => {
    this.setState({ mode: Mode.ForgotPassword });
  }

  handleResetPasswordCancel = () => {
    this.setState( { mode: Mode.Login });
  }

  setEmail = (e: React.FormEvent<HTMLInputElement>) =>
    this.setState({ email: e.currentTarget.value })

  setPassword = (e: React.FormEvent<HTMLInputElement>) =>
    this.setState({ password: e.currentTarget.value })

  renderCommittee = (committeeID: CommitteeID, committee: CommitteeData) => {
    return (
      <List.Item key={committeeID}>
        <List.Content>
          <List.Header as="a" href={`/committees/${committeeID}`}>
            {committee.name}
          </List.Header>
          <List.Description>
            {committee.topic}
          </List.Description>
        </List.Content>
      </List.Item>
    );
  }

  renderNewCommitteeButton = () => {
    return (
      <List.Item key={'add'}>
        <List.Content>
          <List.Header as="a" href={'/onboard'}>
            <Icon name="plus" />Create new committee
          </List.Header>
        </List.Content>
      </List.Item>
    );
  }

  renderCommittees = () => {
    const { renderCommittee } = this;
    const { committees } = this.state;

    const defaulted = committees || {} as Record<CommitteeID, CommitteeData>;
    const owned = _.keys(defaulted);

    return (
      <List relaxed>
        {owned.map(k => renderCommittee(k, defaulted[k]))}
      </List>
    );
  }

  renderError = () => {
    const { handleDismissError } = this;

    const err = this.state.error;
    
    return (
      <Message
        key="error"
        error
        onDismiss={handleDismissError}
      >
        <Message.Header>{err ? err.name : ''}</Message.Header>
        <Message.Content>{err ? err.message : ''}</Message.Content>
      </Message>
    );
  }

  renderSuccess = () => {
    const { handleDismissSuccess } = this;

    const succ = this.state.success;

    return (
      <Message
        key="success"
        success
        onDismiss={handleDismissSuccess}
      >
        <Message.Header>{succ ? succ.name : ''}</Message.Header>
        <Message.Content>{succ ? succ.message : ''}</Message.Content>
      </Message>
    );
  }

  renderNotice = () => {
    const list = [
      'Login to create a new committee, or access your previously created committees',
      'Multiple directors may use the same account simultaneously - use a password you\'re willing to share'
    ];

    return (
      <Message attached="top" info list={list} />
    );
  }

  renderLoggedIn = (u: firebase.User) => {
    const { handleLogout, renderCommittees, renderNewCommitteeButton } = this;
    const { committees } = this.state;
    const { allowNewCommittee } = this.props;

    return (
      <Card centered fluid>
        <Card.Content key="main">
          <Card.Header>
            {u.email}
          </Card.Header>
          <Card.Meta>
            Logged in
          </Card.Meta>
        </Card.Content>
        <Card.Content key="committees">
          {committees ? renderCommittees() : <Loading />}
          {allowNewCommittee && renderNewCommitteeButton()}
        </Card.Content>
        <Card.Content extra key="extra">
          <Button basic color="red" fluid onClick={handleLogout}>Logout</Button>
        </Card.Content>
      </Card>
    );
  }

  renderLogin = () => {
    const { setEmail, setPassword, handleCreate, 
      handleLogin, handlePasswordReset, handleForgotPassword, handleResetPasswordCancel } = this;
    const { loggingIn, creating, user, resetting, email, password, mode } = this.state;
    const { allowSignup } = this.props;

    const renderSignupButton = () => (
      <Button onClick={handleCreate} loading={creating} >Create account</Button>
    );

    const renderCancelButton = () => (
      <Button onClick={handleResetPasswordCancel}>Cancel</Button>
    );

    const err = this.state.error;
    const succ = this.state.success;
    
    return (
      <Segment attached="bottom">
        <Form error={!!err} success={!!succ} loading={user === undefined}>
          <Form.Input
            key="email"
            label="Email"
            placeholder="joe@schmoe.com"
            value={email}
            onChange={setEmail}
          >
            <input autoComplete="email" />
          </Form.Input>
          {mode === Mode.Login && <Form.Input
            key="password"
            label="Password"
            type="password"
            placeholder="correct horse battery staple"
            value={password}
            onChange={setPassword}
          >
            <input autoComplete="current-password" />
          </Form.Input>}
          {this.renderSuccess()}
          {this.renderError()}
          <Button.Group fluid>
            {mode === Mode.Login && 
              <Button 
                primary 
                onClick={handleLogin} 
                loading={loggingIn} 
              >
                Login
              </Button>
            }
            {mode === Mode.ForgotPassword &&
              <Button 
                primary
                onClick={handlePasswordReset} 
                loading={resetting} 
                disabled={!email}
              >
                Reset Password
              </Button>
            }
          {allowSignup && mode === Mode.Login && <Button.Or />}
          {allowSignup && mode === Mode.Login && renderSignupButton()}
          {mode === Mode.ForgotPassword && renderCancelButton()}
          </Button.Group>
          {mode === Mode.Login && 
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a 
              onClick={handleForgotPassword} 
              style={{'cursor': 'pointer'}}
            >
              Forgot password?
            </a>}
        </Form>
      </Segment>
    );
  }

  render() {
    const { user, success } = this.state;

    return (
      <React.Fragment>
        {success && this.renderSuccess()}
        {!user && this.renderNotice()}
        {user ? this.renderLoggedIn(user) : this.renderLogin()}
      </React.Fragment>
    );
  }
}

export class LoginModal extends React.Component<{}, 
  { user?: firebase.User | null 
    unsubscribe?: () => void
  }> {
  constructor(props: {}) {
    super(props);
    this.state = {
    };
  }

  renderModalTrigger() {
    const { user } = this.state;

    const text = user ? user.email : 'Login';

    return (
      <Button loading={user === undefined} className="nav__auth-status">
        <Icon name="lock" />
        {text}
      </Button>
    );
  }

  authStateChangedCallback = (user: firebase.User | null) => {
    this.setState({ user: user });
  }

  componentDidMount() {
    const unsubscribe = firebase.auth().onAuthStateChanged(
      this.authStateChangedCallback,
    );

    this.setState({ unsubscribe });
  }

  componentWillUnmount() {
    if (this.state.unsubscribe) {
      this.state.unsubscribe();
    }
  }

  render() {
    return (
      <Modal 
        trigger={this.renderModalTrigger()}
        size="tiny"
        dimmer
        basic={true} // strip out the outer window
      >
        <Modal.Content>
          <Login allowSignup={false} allowNewCommittee={true}/>
        </Modal.Content>
      </Modal>
    );
  }
}