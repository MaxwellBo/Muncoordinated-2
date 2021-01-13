import * as React from 'react';
import firebase from 'firebase/app';
import { Card, Button, Form, Message, Modal, Icon, List, Segment, Header } from 'semantic-ui-react';
import { CommitteeID, CommitteeData } from './Committee';
import _ from 'lodash';
import Loading from './Loading';
import { logCreateAccount, logLogin } from '../analytics';

enum Mode {
  Login = 'Login',
  CreateAccount = 'CreateAccount',
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

  logout = () => {
    firebase.auth().signOut().catch(err => {
      this.setState({ error: err });
    });
  }

  login = () => {
    const { email, password } = this.state;

    this.setState({ loggingIn: true });

    firebase.auth().signInWithEmailAndPassword(email, password).then(credential => {
      this.setState({ 
        loggingIn: false,
        email: '',
        password: ''
      });
      logLogin(credential.user?.uid)
    }).catch(err => {
      this.setState({ loggingIn: false, error: err });
    });
  }

  createAccount = () => {
    const { email, password } = this.state;
    this.setState({ creating: true });

    firebase.auth().createUserWithEmailAndPassword(email, password).then(credential => {

      const success = { 
        name: 'Account created',
        message: 'Your account was successfully created' 
      };

      this.setState({ 
        creating: false,
        email: '',
        password: '',
        success 
      });
      logCreateAccount(credential.user?.uid)
    }).catch(err => {
      this.setState({ creating: false, error: err });
    });
  }

  resetPassword = () => {
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

  dismissError = () => {
    this.setState({ error: undefined });
  }

  dismissSuccess = () => {
    this.setState({ success: undefined });
  }

  toLoginMode = () => {
    this.setState( {
      password: '',
      mode: Mode.Login
    });
  }

  toCreateAccountMode = () => {
    this.setState({ 
      mode: Mode.CreateAccount 
    });
  }

  toForgotPasswordMode = () => {
    this.setState({ 
      password: '',
      mode: Mode.ForgotPassword 
    });
  }

  setEmail = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({ email: e.currentTarget.value })
  }

  setPassword = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({ password: e.currentTarget.value })
  }

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

    return (owned.length > 0) ? 
    (
      <List relaxed>
        {owned.map(k => renderCommittee(k, defaulted[k]))}
      </List>
    ) : (
      <Header as='h4'> No committees created
        <Header.Subheader>
          Create a new committee and it'll appear here!
        </Header.Subheader>
      </Header>
    );
  }

  renderError = () => {
    const { dismissError } = this;

    const err = this.state.error;
    
    return (
      <Message
        key="error"
        error
        onDismiss={dismissError}
      >
        <Message.Header>{err ? err.name : ''}</Message.Header>
        <Message.Content>{err ? err.message : ''}</Message.Content>
      </Message>
    );
  }

  renderSuccess = () => {
    const { dismissSuccess } = this;

    const succ = this.state.success;

    return (
      <Message
        key="success"
        success
        onDismiss={dismissSuccess}
      >
        <Message.Header>{succ ? succ.name : ''}</Message.Header>
        <Message.Content>{succ ? succ.message : ''}</Message.Content>
      </Message>
    );
  }

  renderLoggedIn = (u: firebase.User) => {
    const { logout, renderCommittees, renderNewCommitteeButton } = this;
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
        <Card.Content key="committees" style={{ 
          'maxHeight': '50vh',
          'overflow' : 'auto'
        }}>
          {committees ? renderCommittees() : <Loading />}
        </Card.Content>
        {allowNewCommittee && <Card.Content key="create">
          {renderNewCommitteeButton()}
        </Card.Content>}
        <Card.Content extra key="extra">
          <Button basic color="red" fluid onClick={logout}>Logout</Button>
        </Card.Content>
      </Card>
    );
  }

  renderLogin = () => {
    const { loggingIn, creating, user, resetting, email, password, mode } = this.state;

    const renderLogInButton = () => (
      <Button 
        primary 
        disabled={!email || !password}
        onClick={this.login} 
        loading={loggingIn}
        type="submit"
      >
        Log in
      </Button>
    );

    const renderCreateAccountButton = () => (
      <Button 
        positive
        onClick={this.toCreateAccountMode}
      >
        Create account <Icon name="arrow right" />
      </Button>
    );

    const renderSubmitCreateAccountButton = () => (
      <Button 
        positive
        fluid
        onClick={this.createAccount} 
        loading={creating} 
        disabled={!email || !password}
        type="submit"
      >
        Create account
      </Button>
    )

    const renderForgotPasswordButton = () => (
      // eslint-disable-next-line jsx-a11y/anchor-is-valid
      <a 
        onClick={this.toForgotPasswordMode} 
        style={{'cursor': 'pointer'}}
      >
        Forgot password?
      </a>
    );

    const renderToLoginButton = () => (
      <div style={{ marginBottom: '8px' }}>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a 
          onClick={this.toLoginMode} 
          style={{
            cursor: 'pointer',
          }}
        >
          <Icon name="arrow left" />
          Back to login
        </a>
      </div>
    );

    const renderSendResetEmailButton = () => (
      <Button 
        primary
        fluid
        onClick={this.resetPassword} 
        loading={resetting} 
        disabled={!email}
        type="submit"
      >
        Send reset email
      </Button>
    );

    const err = this.state.error;
    const succ = this.state.success;
    
    return (
      <React.Fragment>
        {mode === Mode.Login && 
          <Header as="h3" attached="top">
            Login
            <Header.Subheader>
              to create a new committee, or access an older committee.
            </Header.Subheader>
          </Header>}
        {mode === Mode.CreateAccount && 
          <Header as="h3" attached="top">
            Create account
            <Header.Subheader>
                Multiple directors may use the same account simultaneously. 
                Choose a password you're willing to share.
            </Header.Subheader>
          </Header>}
        {mode === Mode.ForgotPassword && 
          <Header as="h3" attached="top">
            Reset password
          </Header>}
        <Segment attached="bottom">
          {mode !== Mode.Login && renderToLoginButton()}
          <Form error={!!err} success={!!succ} loading={user === undefined}>
            <Form.Input
              key="email"
              label="Email"
              error={mode === Mode.CreateAccount && !email}
              required={mode === Mode.CreateAccount}
              placeholder="joe@schmoe.com"
              value={email}
              onChange={this.setEmail}
            >
              <input autoComplete="email" />
            </Form.Input>
            {mode === Mode.Login && <Form.Input
              key="current-password"
              label="Password"
              type="password"
              placeholder="correct horse battery staple"
              value={password}
              onChange={this.setPassword}
            >
              <input autoComplete="current-password" />
            </Form.Input>}
            {mode === Mode.CreateAccount && <Form.Input
              key="new-password"
              label="Password"
              type="password"
              error={!password}
              required
              placeholder="correct horse battery staple"
              value={password}
              onChange={this.setPassword}
            >
              <input autoComplete="new-password" />
            </Form.Input>}
            {this.renderSuccess()}
            {this.renderError()}
            {mode === Mode.Login && <Button.Group fluid widths='2'>
               {renderLogInButton()}
               <Button.Or />
               {renderCreateAccountButton()}
            </Button.Group>}
            {mode === Mode.ForgotPassword && renderSendResetEmailButton()}
            {mode === Mode.CreateAccount && renderSubmitCreateAccountButton()}
            {mode === Mode.Login && renderForgotPasswordButton()}
          </Form>
        </Segment>
      </React.Fragment>
    );
  }

  render() {
    const { user } = this.state;

    return user 
      ? this.renderLoggedIn(user)
      : this.renderLogin()
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
          <Login allowNewCommittee={true}/>
        </Modal.Content>
      </Modal>
    );
  }
}