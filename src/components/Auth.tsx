import * as React from 'react';
import * as firebase from 'firebase';
import { Card, Button, Form, Message, Modal, Header, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { error } from 'util';

interface State {
  user?: firebase.User | null;
  email: string;
  password: string;
  error?: Error;
  success?: { name?: string, message?: string }; // like Error
  loggingIn: boolean;
  creating: boolean;
  resetting: boolean;
  unsubscribe?: () => void;
}
interface Props {
  allowSignup: boolean;
}

const firebaseConfig = {
  apiKey: 'AIzaSyA9EuEf7m3YOTBhBNhoe7DcOIZJP2toL6w',
  authDomain: 'muncoordinated.firebaseapp.com',
  databaseURL: 'https://muncoordinated.firebaseio.com',
  projectId: 'muncoordinated',
  storageBucket: 'muncoordinated.appspot.com',
  messagingSenderId: '308589918735'
};

firebase.initializeApp(firebaseConfig);

export default class Login extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      email: '',
      password: '',
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
      const nme = 'Account created';
      const message = 'Your account was successfully created';

      this.setState({ creating: false, success: { name: nme, message } });
    }).catch(err => {
      this.setState({ creating: false, error: err });
    });
  }

  passwordResetHandler = () => {
    const { email } = this.state;
    this.setState({ resetting: true });

    firebase.auth().sendPasswordResetEmail(email).then(() => {
      const nme = 'Password reset';
      const message = `Check your inbox at ${email} for further instructions`;

      this.setState({ resetting: false, success: { name: nme, message }  });
    }).catch(err => {
      this.setState({ resetting: false, error: err });
    });
  }

  handleDismiss = () => {
    this.setState({ error: undefined });
  }

  emailHandler = (e: React.FormEvent<HTMLInputElement>) =>
    this.setState({ email: e.currentTarget.value })

  passwordHandler = (e: React.FormEvent<HTMLInputElement>) =>
    this.setState({ password: e.currentTarget.value })

  renderLoggedIn = (u: firebase.User) => {
    const { logOutHandler } = this;

    return (
      <Card centered>
        <Card.Content key="main">
          <Card.Header>
            {u.email}
          </Card.Header>
          <Card.Meta>
            Logged in
          </Card.Meta>
        </Card.Content>
        <Card.Content extra key="extra">
          <Button basic color="red" fluid onClick={logOutHandler}>Logout</Button>
        </Card.Content>
      </Card>
    );
  }

  renderLogin = () => {
    const { emailHandler, passwordHandler, handleDismiss, createHandler, loginHandler, passwordResetHandler } = this;
    const { loggingIn, creating, user, resetting, email, password } = this.state;
    const { allowSignup } = this.props;

    const signupButton = <Button secondary onClick={createHandler} loading={creating} >Sign-Up</Button>;

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
        <Form.Input
          key="password"
          label="Password"
          type="password"
          placeholder="correct horse battery staple"
          value={password}
          onChange={passwordHandler}
        >
          {passwordInput}
        </Form.Input>
        <Message
          key="success"
          success
        >
          <Message.Header>{succ ? succ.name : ''}</Message.Header>
          <Message.Content>{succ ? succ.message : ''}</Message.Content>
        </Message>
        <Message
          key="error"
          error
          onDismiss={handleDismiss}
        >
          <Message.Header>{err ? err.name : ''}</Message.Header>
          <Message.Content>{err ? err.message : ''}</Message.Content>
        </Message>
        <Button.Group fluid>
          <Button primary onClick={loginHandler} loading={loggingIn} >Login</Button>
          <Button.Or />
          <Button onClick={passwordResetHandler} loading={resetting} disabled={!email}>Reset Password</Button>
          {allowSignup && <Button.Or />}
          {allowSignup && signupButton}
        </Button.Group>
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
    return (
      <Modal 
        trigger={this.renderModalTrigger()}
        dimmer
        size="large"
      >
        <Modal.Header>Login</Modal.Header>
        <Modal.Content image>
          <Login allowSignup={false}/>
        </Modal.Content>
      </Modal>
    );
  }
}