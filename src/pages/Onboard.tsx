import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import firebase from 'firebase/compat/app';
import {
  Form, Grid, Header, InputOnChangeData, DropdownProps,
  Message, Popup, Container, Segment, Icon,
} from 'semantic-ui-react';
import { Login } from '../components/auth';
import { URLParameters } from '../types';
import { makeDropdownOption } from '../utils';
import ConnectionStatus from '../components/ConnectionStatus';
import { logCreateCommittee } from '../modules/analytics';
import { meetId } from '../utils';
import {CommitteeData, DEFAULT_COMMITTEE, pushTemplateMembers, putCommittee, Template} from '../models/committee';
import { TemplatePreview } from '../components/template';
import { Helmet } from 'react-helmet';
import { FormattedMessage, useIntl } from 'react-intl';

interface Props extends RouteComponentProps<URLParameters> {
}

interface FormState {
  name: string;
  topic: string;
  conference: string;
  template: Template | undefined;
  user: firebase.User | null;
}

export default function Onboard() {
  const [state, setState] = React.useState<FormState>({
    name: '',
    topic: '',
    conference: '',
    template: undefined,
    user: null
  });

  const intl = useIntl();

  React.useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(
      (user) => setState(prev => ({ ...prev, user }))
    );
    return () => unsubscribe();
  }, []);

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const onChangeTemplateDropdown = (_: any, { value }: any) => {
    setState(prev => ({ ...prev, template: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const { name, topic, conference, template, user } = state;

    if (user) {
      const committeeRef = firebase.database().ref('committees').push();
      const committeeData = {
        name,
        topic,
        conference,
        creatorUid: user.uid,
        template,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      };

      committeeRef.set(committeeData);
    }
  };

  const renderNewCommitteeForm = () => {
    const { user, template } = state;

    return (
      <React.Fragment>
        {!user && 
          <Message
            error
            attached="top"
            content={<FormattedMessage id="onboard.login.required" defaultMessage="Log in or create an account to continue" />}
          />
        }
        <Segment attached={!user ? 'bottom' : undefined} >
          <Form onSubmit={handleSubmit}>
            <Form.Group unstackable>
              <Form.Dropdown
                label={<FormattedMessage id="onboard.form.template" defaultMessage="Template" />}
                name="template"
                width={14}
                search
                clearable
                selection
                placeholder={intl.formatMessage({ id: 'onboard.form.template.placeholder', defaultMessage: 'Template to skip manual member creation (optional)' })}
                options={Object.values(Template).map(makeDropdownOption)}
                onChange={onChangeTemplateDropdown}
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
              label={<FormattedMessage id="onboard.form.name" defaultMessage="Name" />}
              name="name"
              fluid
              value={state.name}
              required
              error={!state.name}
              placeholder={intl.formatMessage({ id: 'onboard.form.name.placeholder', defaultMessage: 'Committee name' })}
              onChange={handleInput}
            />
            <Form.Input
              label={<FormattedMessage id="onboard.form.topic" defaultMessage="Topic" />}
              name="topic"
              value={state.topic}
              fluid
              placeholder={intl.formatMessage({ id: 'onboard.form.topic.placeholder', defaultMessage: 'Committee topic' })}
              onChange={handleInput}
            />
            <Form.Input
              label={<FormattedMessage id="onboard.form.conference" defaultMessage="Conference" />}
              name="conference"
              value={state.conference}
              fluid
              placeholder={intl.formatMessage({ id: 'onboard.form.conference.placeholder', defaultMessage: 'Conference name' })}
              onChange={handleInput}
            />
            <Form.Button
              primary
              fluid
              disabled={!state.user || state.name === ''}
            >
              <FormattedMessage id="onboard.form.submit" defaultMessage="Create committee" />
              <Icon name="arrow right" />
            </Form.Button>
          </Form>
        </Segment>
      </React.Fragment>
    );
  };

  return (
    <Container style={{ padding: '1em 0em' }}>
      <Helmet>
        <title>
          <FormattedMessage id="onboard.title" defaultMessage="Create Committee - Muncoordinated" />
        </title>
        <meta name="description" content="Login, create an account, or create a committee with Muncoordinated now!" />
      </Helmet>
      <ConnectionStatus />
      <Grid columns="equal" stackable>
        <Grid.Row>
          <Grid.Column>
            <Header as="h1" textAlign='center'>
              <FormattedMessage id="home.title" defaultMessage="Muncoordinated" />
            </Header>
            <Message>
              <Message.Header>
                <FormattedMessage id="onboard.browser.notice.title" defaultMessage="Browser compatibility notice" />
              </Message.Header>
              <p>
                <FormattedMessage 
                  id="onboard.browser.notice.message" 
                  defaultMessage="Muncoordinated works best with newer versions of {chromeLink}. Use of other/older browsers has caused bugs and data loss."
                  values={{
                    chromeLink: <a href="https://www.google.com/chrome/">Google Chrome</a>
                  }}
                />
              </p>
            </Message>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Login allowNewCommittee={false} />
          </Grid.Column>
          <Grid.Column>
            {renderNewCommitteeForm()}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
}
