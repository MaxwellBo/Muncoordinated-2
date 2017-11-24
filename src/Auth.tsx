import * as React from 'react';
import * as firebase from 'firebase';
import { Card, Button, Form, Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import 'firebaseui/dist/firebaseui.css';
import { error } from 'util';

interface State {
  email: string;
  password: string;
  error?: Error;
}
interface Props {
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

firebase.auth().onAuthStateChanged(authStateChangedCallback, err => { console.debug(err); });

export var user: firebase.User | null = null;

function authStateChangedCallback(u: firebase.User | null) {
  user = u;
}

export default class Login extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      email: '',
      password: ''
    };
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
          <Card.Content>
            <Card.Header>
              {user.email}
            </Card.Header>
            <Card.Meta>
              Logged in
          </Card.Meta>
          </Card.Content>
          <Card.Content extra>
            <div className="ui two buttons">
              <Button basic color="red" onClick={logOutHandler}>Log out</Button>
            </div>
          </Card.Content>
        </Card>
      );
    } else {
      // authUi.reset(); // You might need to do this
      const loginHandler = () => {
        firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password).catch(err => {
          this.setState({ error: err });
        });
      };

      const createHandler = () => {
        firebase.auth().createUserWithEmailAndPassword(this.state.email, this.state.password).catch(err => {
          this.setState({ error: err });
        });
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
          />
          <Button.Group>
            <Button primary fluid onClick={loginHandler}>Login</Button>
            <Button secondary fluid onClick={createHandler}>Create</Button>
          </Button.Group>
        </Form>
      );
    }
  }
}
