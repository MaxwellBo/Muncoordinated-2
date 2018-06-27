import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID, DEFAULT_COMMITTEE } from './Committee';
import { Segment, Button, Divider, Form, Grid, Header, InputOnChangeData, Message, Icon } from 'semantic-ui-react';
import { Login } from './Auth';
import { URLParameters } from '../types';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committees: Map<string, CommitteeData>;
  name: string;
  topic: string;
  chairperson: string;
  user: firebase.User | null;
  committeesFref: firebase.database.Reference;
  unsubscribe?: () => void;
}

export default class Onboard extends React.Component<Props, State> {
  committeesRef = firebase.database().ref('committees');

  constructor(props: Props) {
    super(props);

    this.state = {
      committees: {} as Map<string, CommitteeData>,
      name: '',
      topic: '',
      chairperson: '',
      user: null,
      committeesFref: firebase.database().ref('committees')
    };
  }

  firebaseCallback = (committees: firebase.database.DataSnapshot | null) => {
    if (committees) {
      this.setState({ committees: committees.val() });
    }
  }

  authStateChangedCallback = (user: firebase.User | null) => {
    this.setState({ user: user });
  }

  componentDidMount() {
    this.state.committeesFref.on('value', this.firebaseCallback);

    const unsubscribe = firebase.auth().onAuthStateChanged(
      this.authStateChangedCallback,
    );

    this.setState({ unsubscribe });
  }

  componentWillUnmount() {
    this.state.committeesFref.off('value', this.firebaseCallback);

    if (this.state.unsubscribe) {
      this.state.unsubscribe();
    }
  }

  renderNewCommitteeForm = () => {
    const submitHandler = () => {
      if (this.state.user) {
        const newCommittee = {
          ...DEFAULT_COMMITTEE,
          name: this.state.name,
          topic: this.state.topic,
          chair: this.state.chairperson,
          creatorUid: this.state.user.uid
        };

        const newCommitteeRef = this.committeesRef.push();
        newCommitteeRef.set(newCommittee);

        this.props.history.push(`/committees/${newCommitteeRef.key}`);
      }
    };

    const handleChange = (event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData): void =>
      this.setState({ [data.name]: data.value });

    return (
      <Form onSubmit={submitHandler}>
        <Form.Group widths="equal">
          <Form.Input label="Name" name="name" placeholder="Committee name" onChange={handleChange} />
          <Form.Input label="Topic" name="topic" placeholder="Committee topic" onChange={handleChange} />
          <Form.Input
            label="Chairpeople"
            name="chairperson"
            placeholder="Name(s) of chairperson or chairpeople"
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Button primary fluid disabled={!this.state.user}>Create Committee</Form.Button>
      </Form>
    );
  }

  render() {
    const { user } = this.state;

    return (
      <Grid
        style={{ height: '100%' }}
      >
        <Grid.Column>
          <Header as="h1" dividing>
          Muncoordinated
          </Header>
          <Segment>
            {!user && (
              <Message warning>
                <Icon name="warning" />
                Login to access your previously created committees, or create a new one.
              </Message>
              )
            }
            <Login allowSignup={true}/>
            {user && <Divider horizontal>And</Divider>}
            {user && this.renderNewCommitteeForm()}
          </Segment>
        </Grid.Column>
      </Grid>
    );
  }
}
