import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import * as firebase from 'firebase/app';
import { CommitteeData, DEFAULT_COMMITTEE } from './Committee';
import { Form, Grid, Header, InputOnChangeData, Divider,
  Message, Container, List, Segment, Icon } from 'semantic-ui-react';
import { Login } from './Auth';
import { URLParameters, Dictionary } from '../types';
import ConnectionStatus from './ConnectionStatus';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committees: Dictionary<string, CommitteeData>;
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
      committees: {} as Dictionary<string, CommitteeData>,
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

  handleInput = (event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData): void => {
    // XXX: Don't do stupid shit and choose form input names that don't
    // map to valid state properties
    // @ts-ignore
    this.setState({ [data.name]: data.value });
  }

  handleSubmit = () => {
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
  }

  renderNewCommitteeForm = () => {
    const { user } = this.state;

    return (
      <React.Fragment>
        {!user && <Message
          error 
          attached="top"
          content="Please login or create an account before creating a committee"
        />}
        <Segment attached={!user ? 'bottom' : undefined} >
          <Form onSubmit={this.handleSubmit}>
            <Form.Input 
              label="Name" 
              name="name" 
              fluid
              required
              error={this.state.name === ''}
              placeholder="Committee name" 
              onChange={this.handleInput} 
            />
            <Form.Input 
              label="Topic" 
              name="topic" 
              fluid
              placeholder="Committee topic" 
              onChange={this.handleInput} 
            />
            <Form.Input
              label="Chairpeople"
              name="chair"
              fluid
              placeholder="Name(s) of chairperson or chairpeople"
              onChange={this.handleInput}
            />
            <Form.Input
              label="Conference"
              name="conference"
              fluid
              placeholder="Conference name"
              onChange={this.handleInput}
            />
            <Form.Button 
              primary 
              fluid 
              disabled={!this.state.user || this.state.name === ''}
            >
              Create Committee
              <Icon name="arrow right" />
            </Form.Button>
          </Form>
        </Segment>
      </React.Fragment>
    );
  }

  render() {
    return (
      <Container style={{ padding: '1em 0em' }}>
        <ConnectionStatus />
        <Grid
          columns="equal" 
          stackable
        >
          <Grid.Row>
            <Grid.Column>
              <Header as="h1" dividing>
              Muncoordinated
              </Header>
              <Divider hidden/>
              Muncoordinated officially supports recent versions of Google Chrome. 
                Use of older and other browsers has been known to cause bugs and data loss.
            </Grid.Column>
          </Grid.Row>
          <Divider />
          <Grid.Row>
            <Grid.Column>
              <Login allowSignup={true} allowNewCommittee={false}/>
            </Grid.Column>
            <Grid.Column>
              {this.renderNewCommitteeForm()}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    );
  }
}
