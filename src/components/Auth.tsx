import * as React from 'react';
import * as firebase from 'firebase';
import { Card, Button, Form, Message, Modal, Header, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { error } from 'util';

interface State {
  user: firebase.User | null;
  email: string;
  password: string;
  error?: Error;
  loggingIn: boolean;
  creating: boolean;
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
      user: null,
      email: '',
      password: '',
      loggingIn: false,
      creating: false,
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
      this.setState({ creating: false });
    }).catch(err => {
      this.setState({ creating: false, error: err });
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
    const { emailHandler, passwordHandler, handleDismiss, createHandler, loginHandler } = this;
    const { loggingIn, creating, user } = this.state;
    const { allowSignup } = this.props;

    const signupButton = <Button secondary onClick={createHandler} loading={creating} >Sign-Up</Button>;

    const usernameInput = <input autoComplete="email" />;

    const passwordInput = <input autoComplete="current-password" />;
    
    return (
      <Form error={!!this.state.error} success={!!user}>
        <Form.Input
          key="email"
          label="Email"
          placeholder="joe@schmoe.com"
          value={this.state.email}
          onChange={emailHandler}
        >
          {usernameInput}
        </Form.Input>
        <Form.Input
          key="password"
          label="Password"
          type="password"
          placeholder="correct horse battery staple"
          autocomplete="current-password"
          value={this.state.password}
          onChange={passwordHandler}
        >
          {passwordInput}
        </Form.Input>
        <Message
          key="success"
          success
          header="Account created"
          content="Your account was successfully created"
        />
        <Message
          key="error"
          error
          header={this.state.error ? this.state.error.name : ''}
          content={this.state.error ? this.state.error.message : ''}
          onDismiss={handleDismiss}
        />
        <Button.Group fluid>
          <Button primary onClick={loginHandler} loading={loggingIn} >Login</Button>
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
  { user: firebase.User | null 
    unsubscribe?: () => void
  }> {
  constructor(props: {}) {
    super(props);
    this.state = {
      user: null
    };
  }

  renderModalTrigger() {
    const { user } = this.state;

    const text = user ? user.email : 'Login';

    return (
      <Button basic size="small">
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