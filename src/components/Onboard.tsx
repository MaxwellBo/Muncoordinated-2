import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import * as firebase from 'firebase/app';
import { CommitteeData, DEFAULT_COMMITTEE } from './Committee';
import {
  Form, Grid, Header, InputOnChangeData, DropdownProps,
  Message, Popup, Container, Segment, Icon, Flag,
} from 'semantic-ui-react';
import { Login } from './Auth';
import { URLParameters } from '../types';
import { makeDropdownOption } from '../utils';
import { CommitteeTemplate, TEMPLATE_TO_MEMBERS } from '../constants';
import ConnectionStatus from './ConnectionStatus';
import { logCreateCommittee } from '../analytics';
import { meetId } from '../utils';
import { putCommittee } from '../actions/committee-actions';
import { parseFlagName, Rank } from './Member';
import { Helmet } from 'react-helmet';

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
    this.setState(old => ({ 
      template: data.value as CommitteeTemplate,
      // don't clear the name if the template is deselected
      name: data.value as string || old.name
    }));
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

      // We can't send `undefined` properties to Firebase or it will complain
      // so we only set this property if the template exists
      if (template) {
        newCommittee.template = template;
      }

      const newCommitteeRef = putCommittee(meetId(), newCommittee)
      this.props.history.push(`/committees/${newCommitteeRef.key}`);
      logCreateCommittee(newCommitteeRef.key ?? undefined)

      if (template) {
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

  renderCountriesTable = (template: CommitteeTemplate | undefined) => {
    if (!template) {
      return (
          <p>Select a template to see which members will be added</p>
      );
    }

    return (
      <>
        {TEMPLATE_TO_MEMBERS[template]
          .map(member => 
          <div key={member.name}>
            <Flag name={parseFlagName(member.name)} />
            {member.name}
          </div>
        )}
      </>
    );
  }

  renderNewCommitteeForm = () => {
    const { user, template } = this.state;

    return (
      <React.Fragment>
        {!user && <Message
          error
          attached="top"
          content="Log in or create an account to continue"
        />}
        <Segment attached={!user ? 'bottom' : undefined} >
          <Form onSubmit={this.handleSubmit}>
            <Form.Group unstackable>
              <Form.Dropdown
                label="Template"
                name="template"
                width={14}
                search
                clearable
                selection
                placeholder="Template to skip manual member creation (optional)"
                options={Object.values(CommitteeTemplate).map(makeDropdownOption)}
                onChange={this.onChangeTemplateDropdown}
              />
              <Popup 
                basic 
                pinned 
                hoverable 
                position="top left"
                trigger={
                  <Form.Button 
                    type="button"
                    icon='question circle outline'
                    width={1}
                  />}>
                <Popup.Content>
                  {this.renderCountriesTable(template)}
                </Popup.Content>
              </Popup>
            </Form.Group>
            <Form.Input
              label="Name"
              name="name"
              fluid
              value={this.state.name}
              required
              error={!this.state.name}
              placeholder="Committee name"
              onChange={this.handleInput}
            />
            <Form.Input
              label="Topic"
              name="topic"
              value={this.state.topic}
              fluid
              placeholder="Committee topic"
              onChange={this.handleInput}
            />
            <Form.Input
              label="Conference"
              name="conference"
              value={this.state.conference}
              fluid
              placeholder="Conference name"
              onChange={this.handleInput}
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
        <Helmet>
          <title>{`Create Committee - Muncoordinated`}</title>
          <meta name="description" content="Login, create an account, or create
                                      a committee with Muncoordinated now!" />
        </Helmet>
        <ConnectionStatus />
        <Grid
          columns="equal"
          stackable
        >
          <Grid.Row>
            <Grid.Column>
              <Header as="h1" textAlign='center'>
                Muncoordinated
              </Header>
              <Message>
                <Message.Header>Browser compatibility notice</Message.Header>
                  <p>
                  Muncoordinated works best with newer versions of <a 
                    href="https://www.google.com/chrome/">Google Chrome</a>.
                   Use of other/older browsers has caused bugs and data loss.
                  </p>
              </Message>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Login allowNewCommittee={false} />
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
