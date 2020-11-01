import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import * as firebase from 'firebase/app';
import { CommitteeData, DEFAULT_COMMITTEE } from './Committee';
import {
  Form, Grid, Header, InputOnChangeData, DropdownProps, Divider,
  Message, Container, Segment, Icon
} from 'semantic-ui-react';
import { Login } from './Auth';
import { URLParameters } from '../types';
import { makeDropdownOption } from '../utils';
import { CommitteeTemplate, TEMPLATE_TO_MEMBERS } from '../constants';
import ConnectionStatus from './ConnectionStatus';
import { logCreateCommittee } from '../analytics';
import { meetId } from '../utils';
import { putCommittee } from '../actions/committee-actions';
import { Rank } from './Member';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  name: string;
  topic: string;
  chair: string;
  conference: string;
  user: firebase.User | null;
  template?: CommitteeTemplate,
  committeesFref: firebase.database.Reference;
  unsubscribe?: () => void;
}

export default class Onboard extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      name: '',
      topic: '',
      chair: '',
      conference: '',
      user: null,
      committeesFref: firebase.database().ref('committees')
    };
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

  handleInput = (event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData): void => {
    // XXX: Don't do stupid shit and choose form input names that don't
    // map to valid state properties
    // @ts-ignore
    this.setState({ [data.name]: data.value });
  }

  onChangeTemplateDropdown = (event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps): void => {
    // @ts-ignore
    this.setState({ template: data.value });
  }

  handleSubmit = () => {
    const { name, topic, chair, conference, template, user } = this.state;

    if (user) {
      const newCommittee: CommitteeData = {
        ...DEFAULT_COMMITTEE,
        name,
        topic,
        chair,
        conference,
        creatorUid: user.uid
      };

      const newCommitteeRef = putCommittee(meetId(), newCommittee)
      this.props.history.push(`/committees/${newCommitteeRef.key}`);
      logCreateCommittee(newCommitteeRef.key ?? undefined)

      if (template) {
        // We can't send `undefined` properties to Firebase or it will complain.
        newCommittee.template = template;

        // Add countries as per selected templates
        [...TEMPLATE_TO_MEMBERS[template]]
          .reverse()
          .forEach(
            member =>
              newCommitteeRef
                .child('members')
                .push({
                  name: member.name,
                  rank: member.rank ?? Rank.Standard,
                  present: true,
                  voting: false
                })
          );
      }
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
            <Form.Dropdown
              label="Template"
              name="template"
              fluid
              search
              clearable
              selection
              placeholder="Template for committee"
              options={Object.values(CommitteeTemplate).map(makeDropdownOption)}
              onChange={this.onChangeTemplateDropdown}
            />
            <Form.Button
              primary
              fluid
              disabled={!this.state.user || this.state.name === ''}
            >
              Create committee
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
              <Divider hidden />
              Muncoordinated officially supports recent versions of Google Chrome.
                Use of older and other browsers has been known to cause bugs and data loss.
            </Grid.Column>
          </Grid.Row>
          <Divider />
          <Grid.Row>
            <Grid.Column>
              <Login allowSignup={true} allowNewCommittee={false} />
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
