import * as React from 'react';
import * as firebase from 'firebase';
import { Card, Button, Form, Message, Modal, Header, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { error } from 'util';

interface State {
  email: string;
  password: string;
  error?: Error;
  loggingIn: boolean;
  creating: boolean;
}
interface Props {
  onAuth: (user: firebase.User | null) => any;
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

export var user: firebase.User | null = null;

export default class Login extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    firebase.auth().onAuthStateChanged(
      this.authStateChangedCallback,
    );

    this.state = {
      email: '',
      password: '',
      loggingIn: false,
      creating: false,
    };
  }

  authStateChangedCallback = (u: firebase.User | null) => {
    user = u;
    this.setState({ loggingIn: false, creating: false });
    this.props.onAuth(u);
  }

  render() {
    if (user) {
      const logOutHandler = () => {
        firebase.auth().signOut().then(() => {
          user = null;
        }).catch(err => {
          this.setState({ error: err });
        });
      };

      return (
        <Card centered>
          <Card.Content key="main">
            <Card.Header>
              {user.email}
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
    } else {
      // authUi.reset(); // You might need to do this
      const loginHandler = () => {
        this.setState({ loggingIn: true });

        firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password).then(() => {
          this.setState({ loggingIn: false });
        }).catch(err => {
          this.setState({ loggingIn: false, error: err });
        });
      };

      const createHandler = () => {
        this.setState({ creating: true });

        firebase.auth().createUserWithEmailAndPassword(this.state.email, this.state.password).then(() => {
          this.setState({ creating: false });
        }).catch(err => {
          this.setState({ creating: false, error: err });
        });
      };

      const handleDismiss = () => {
        this.setState({ error: undefined });
      };

      const emailHandler = (e: React.FormEvent<HTMLInputElement>) =>
        this.setState({ email: e.currentTarget.value });

      const passwordHandler = (e: React.FormEvent<HTMLInputElement>) =>
        this.setState({ password: e.currentTarget.value });

      return (
        <Form error={!!this.state.error} success={!!user}>
          <Form.Input
            label="Email"
            placeholder="joe@schmoe.com"
            value={this.state.email}
            onChange={emailHandler}
          />
          <Form.Input
            label="Password"
            type="password"
            placeholder="correct horse battery staple"
            value={this.state.password}
            onChange={passwordHandler}
          />
          <Message
            success
            header="Account created"
            content="Your account was successfully created"
          />
          <Message
            error
            header={this.state.error ? this.state.error.name : ''}
            content={this.state.error ? this.state.error.message : ''}
            onDismiss={handleDismiss}
          />
          <Button.Group>
            <Button primary fluid onClick={loginHandler} loading={this.state.loggingIn} >Login</Button>
            {this.props.allowSignup && 
              (<Button secondary fluid onClick={createHandler} loading={this.state.creating} >Sign-Up</Button>)
            }
          </Button.Group>
        </Form>
      );
    }
  }
}

export const ModalLogin = () => {

  const text = user ? user.email : 'Login';

  return (
    <Modal 
      trigger={<Button content={text} basic size="small"><Icon name="lock" />{text}</Button>}
      dimmer
      size="large"
    >
      <Modal.Header>Login</Modal.Header>
      <Modal.Content image>
        <Login onAuth={() => { return null; }} allowSignup={false}/>
      </Modal.Content>
    </Modal>
  );
};