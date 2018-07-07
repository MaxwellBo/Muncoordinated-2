import * as React from 'react';
import * as firebase from 'firebase';
import { Card, Button, Form, Message, Modal, Header, Icon, List } from 'semantic-ui-react';
import { error } from 'util';
import { CommitteeID, CommitteeData } from './Committee';
import * as _ from 'lodash';
import Loading from './Loading';

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
  committees?: Map<CommitteeID, CommitteeData>;
}

interface Props {
  allowSignup: boolean | undefined;
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
  }

  componentDidMount() {
    const unsubscribe = firebase.auth().onAuthStateChanged(
      this.authStateChangedCallback,
    );

    this.setState({ unsubscribe });

    firebase.database().ref('committees').once('value').then(committees => {
      this.setState({ committees: committees.val() });
    });
  }

  componentWillUnmount() {
    if (this.state.unsubscribe) {
      this.state.unsubscribe();
    }
  }

  logOutHandler = () => {
    firebase.auth().signOut().then(() => {
      this.setState({ user: null });
    }).catch(err => {
      this.setState({ error: err });
    });
  }

  loginHandler = () => {
    const { email, password } = this.state;

    this.setState({ loggingIn: true });

    firebase.auth().signInWithEmailAndPassword(email, password).then(() => {
      this.setState({ loggingIn: false });
    }).catch(err => {
      this.setState({ loggingIn: false, error: err });
    });
  }

  createHandler = () => {
    const { email, password } = this.state;
    this.setState({ creating: true });

    firebase.auth().createUserWithEmailAndPassword(email, password).then(() => {
      const success = { 
        name: 'Account created',
        message: 'Your account was successfully created' 
      };

      this.setState({ creating: false, success });
    }).catch(err => {
      this.setState({ creating: false, error: err });
    });
  }

  passwordResetHandler = () => {
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

  emailHandler = (e: React.FormEvent<HTMLInputElement>) =>
    this.setState({ email: e.currentTarget.value })

  passwordHandler = (e: React.FormEvent<HTMLInputElement>) =>
    this.setState({ password: e.currentTarget.value })

  renderCommittees = (u: firebase.User) => {
    const { renderCommittee } = this;
    const { committees } = this.state;

    const defaulted = committees || {} as Map<CommitteeID, CommitteeData>;

    const owned = _.keys(defaulted).filter(k =>
      defaulted[k].creatorUid === u.uid);

    return (
      <List relaxed>
        {owned.map(k => renderCommittee(k, defaulted[k]))}
      </List>
    );
  }

  renderCommittee = (committeeID: CommitteeID, committee: CommitteeData) => {
    const target = `/committees/${committeeID}`;

    return (
      <List.Item key={committeeID}>
        <List.Content>
          <List.Header as="a" href={target}>{committee.name}</List.Header>
          <List.Description>{committee.topic}</List.Description>
        </List.Content>
      </List.Item>
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

  renderLoggedIn = (u: firebase.User) => {
    const { logOutHandler, renderCommittees, renderSuccess } = this;
    const { committees } = this.state;

    const succ = this.state.success;
    
    return (
      <div>
        {succ && renderSuccess()}
        <Card centered>
          <Card.Content key="main">
            <Card.Header>
              {u.email}
            </Card.Header>
            <Card.Meta>
              Logged in
            </Card.Meta>
          </Card.Content>
          <Card.Content key="committees">
            {committees ? renderCommittees(u) : <Loading />}
          </Card.Content>
          <Card.Content extra key="extra">
            <Button basic color="red" fluid onClick={logOutHandler}>Logout</Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  renderLogin = () => {
    const { emailHandler, passwordHandler, createHandler, 
      loginHandler, passwordResetHandler, handleForgotPassword, handleResetPasswordCancel } = this;
    const { loggingIn, creating, user, resetting, email, password, mode } = this.state;
    const { allowSignup } = this.props;

    const signupButton = <Button onClick={createHandler} loading={creating} >Create Account</Button>;

    const cancelButton = <Button onClick={handleResetPasswordCancel}>Cancel</Button>;

    const usernameInput = <input autoComplete="email" />;

    const passwordInput = <input autoComplete="current-password" />;

    const err = this.state.error;
    const succ = this.state.success;
    
    return (
      <Form error={!!err} success={!!succ} loading={user === undefined}>
        <Form.Input
          key="email"
          label="Email"
          placeholder="joe@schmoe.com"
          value={email}
          onChange={emailHandler}
        >
          {usernameInput}
        </Form.Input>
        {mode === Mode.Login && <Form.Input
          key="password"
          label="Password"
          type="password"
          placeholder="correct horse battery staple"
          value={password}
          onChange={passwordHandler}
        >
          {passwordInput}
        </Form.Input>}
        {this.renderSuccess()}
        {this.renderError()}
        <Button.Group fluid>
          {mode === Mode.Login && 
            <Button 
              primary 
              onClick={loginHandler} 
              loading={loggingIn} 
            >
              Login
            </Button>
          }
          {mode === Mode.ForgotPassword &&
            <Button 
              primary
              onClick={passwordResetHandler} 
              loading={resetting} 
              disabled={!email}
            >
              Reset Password
            </Button>
          }
        {allowSignup && mode === Mode.Login && <Button.Or />}
        {allowSignup && mode === Mode.Login && signupButton}
        {mode === Mode.ForgotPassword && cancelButton}
        </Button.Group>
        {mode === Mode.Login && 
          <a 
            onClick={handleForgotPassword} 
            style={{'cursor': 'pointer'}}
          >
            Forgot password?
          </a>}
      </Form>
    );
  }

  render() {
    const { user } = this.state;

    if (user) {
      return this.renderLoggedIn(user);
    } else {
      return this.renderLogin();
   }
  }
}

export class ModalLogin extends React.Component<{}, 
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
      <Button basic size="small" loading={user === undefined}>
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
    const { user } = this.state;

    return (
      <Modal 
        trigger={this.renderModalTrigger()}
        size="large"
        dimmer
        basic={!!user} // strip away the outer window when we know we have a card
      >
        <Modal.Content>
          <Login allowSignup={false}/>
        </Modal.Content>
      </Modal>
    );
  }
}