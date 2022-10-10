import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import * as firebase from 'firebase/app';
import {
  Form, Grid, Header, InputOnChangeData, DropdownProps,
  Message, Popup, Container, Segment, Icon,
} from 'semantic-ui-react';
import { Login } from '../components/auth';
import { URLParameters } from '../types';
import { makeDropdownOption } from '../utils';
import ConnectionStatus from '../components/aux/ConnectionStatus';
import { logCreateCommittee } from '../modules/analytics';
import { meetId } from '../utils';
import {CommitteeData, DEFAULT_COMMITTEE, pushTemplateMembers, putCommittee, Template} from '../models/committee';
import { Helmet } from 'react-helmet';
import { TemplatePreview } from '../components/template';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  name: string;
  topic: string;
  chair: string;
  conference: string;
  user: firebase.User | null;
  template?: Template,
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
      template: data.value as Template,
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
        pushTemplateMembers(newCommitteeRef.key!, template);
      }
    }
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
                options={Object.values(Template).map(makeDropdownOption)}
                onChange={this.onChangeTemplateDropdown}
              />
              <Popup 
                basic 
                pinned 
                hoverable 
                position="bottom left"
                trigger={
                  <Form.Button 
                    type="button"
                    icon='question circle outline'
                    width={1}
                  />}>
                <Popup.Content>
                  <TemplatePreview template={template} />
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
