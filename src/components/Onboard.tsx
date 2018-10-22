import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import * as firebase from 'firebase';
import { CommitteeData, DEFAULT_COMMITTEE } from './Committee';
import { Segment, Divider, Form, Grid, Header, InputOnChangeData, 
  Message, Container, List } from 'semantic-ui-react';
import { Login } from './Auth';
import { URLParameters } from '../types';
import ConnectionStatus from './ConnectionStatus';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committees: Map<string, CommitteeData>;
  name: string;
  topic: string;
  chair: string;
  conference: string;
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
      chair: '',
      conference: '',
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
        const newCommittee: CommitteeData = {
          ...DEFAULT_COMMITTEE,
          name: this.state.name,
          topic: this.state.topic,
          chair: this.state.chair,
          conference: this.state.conference,
          creatorUid: this.state.user.uid
        };

        const newCommitteeRef = this.committeesRef.push();
        newCommitteeRef.set(newCommittee);

        this.props.history.push(`/committees/${newCommitteeRef.key}`);
      }
    };

    const handleChange = (event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData): void => {
      // XXX: Don't do stupid shit and choose form input names that don't
      // map to valid state properties
      // @ts-ignore
      this.setState({ [data.name]: data.value });
    };

    return (
      <Form onSubmit={submitHandler}>
        <Form.Group widths="equal">
          <Form.Input 
            label="Name" 
            name="name" 
            fluid
            placeholder="Committee name" 
            onChange={handleChange} 
          />
          <Form.Input 
            label="Topic" 
            name="topic" 
            fluid
            placeholder="Committee topic" 
            onChange={handleChange} 
          />
          <Form.Input
            label="Chairpeople"
            name="chair"
            fluid
            placeholder="Name(s) of chairperson or chairpeople"
            onChange={handleChange}
          />
          <Form.Input
            label="Conference"
            name="conference"
            fluid
            placeholder="Conference name"
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
      <Container style={{ padding: '1em 0em' }}>
        <ConnectionStatus />
        <Grid
          style={{ height: '100%' }}
        >
          <Grid.Column>
            <Header as="h1" dividing>
            Muncoordinated
            </Header>
            <Segment>
              <Message warning>
                <List bulleted>
                  {!user && <List.Item>Login to access your previously created committees, 
                    or to create a new committee.</List.Item>}
                  <List.Item>Multiple directors may use the same account concurrently from 
                    different computers.
                  </List.Item>
                  <List.Item>Muncoordinated officially supports Google Chrome. 
                    Use of other browsers may lead to bugs or data loss.</List.Item>
                </List>
              </Message>
              <Login allowSignup={true} allowNewCommittee={false}/>
              {user && <Divider horizontal>Or</Divider>}
              {user && this.renderNewCommitteeForm()}
            </Segment>
          </Grid.Column>
        </Grid>
      </Container>
    );
  }
}
