import * as React from 'react';
import firebase from 'firebase/compat/app';
import { Card, Button, Form, Message, Modal, Icon, List, Segment, Header } from 'semantic-ui-react';
import _ from 'lodash';
import Loading from './Loading';
import { logCreateAccount, logLogin } from '../modules/analytics';
import { CommitteeData, CommitteeID } from "../models/committee";
import { FormattedMessage, useIntl } from 'react-intl';

enum Mode {
  Login = 'Login',
  CreateAccount = 'CreateAccount',
  ForgotPassword = 'ForgotPassword'
}

interface State {
  user?: firebase.User | null;
  email: string;
  password: string;
  error?: Error;
  success?: { name?: string, message?: string }; // like Error
  loggingIn: boolean;
  creating: boolean;
  mode: Mode;
  resetting: boolean;
  unsubscribe?: () => void;
  committees?: Record<CommitteeID, CommitteeData>;
}

interface Props {
  allowNewCommittee?: boolean;
}

export class Login extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      email: '',
      password: '',
      mode: Mode.Login,
      loggingIn: false,
      creating: false,
      resetting: false
    };
  }

  authStateChangedCallback = (user: firebase.User | null) => {
    this.setState({ loggingIn: false, creating: false, user: user });

    if (user) {
      firebase.database()
        .ref('committees')
        .orderByChild('creatorUid')
        .equalTo(user.uid)
        .once('value').then(committees => {
          // we need to || {} because this returns undefined when it can't find anything
          this.setState({ committees: committees.val() || {} });
        });
    }
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

  logout = () => {
    firebase.auth().signOut().catch(err => {
      this.setState({ error: err });
    });
  }

  login = () => {
    const { email, password } = this.state;

    this.setState({ loggingIn: true });

    firebase.auth().signInWithEmailAndPassword(email, password).then(credential => {
      this.setState({ 
        loggingIn: false,
        email: '',
        password: ''
      });
      logLogin(credential.user?.uid)
    }).catch(err => {
      this.setState({ loggingIn: false, error: err });
    });
  }

  createAccount = () => {
    const { email, password } = this.state;
    this.setState({ creating: true });

    firebase.auth().createUserWithEmailAndPassword(email, password).then(credential => {
      const success = { 
        name: 'Account created',
        message: 'Your account was successfully created' 
      };

      this.setState({ 
        creating: false,
        email: '',
        password: '',
        success 
      });
      logCreateAccount(credential.user?.uid)
    }).catch(err => {
      this.setState({ creating: false, error: err });
    });
  }

  resetPassword = () => {
    const { email } = this.state;
    this.setState({ resetting: true });

    firebase.auth().sendPasswordResetEmail(email).then(() => {
      const success = {
        name: 'Password reset',
        message: `Check your inbox at ${email} for further instructions`
      };

      this.setState({ resetting: false, success });
    }).catch(err => {
      this.setState({ resetting: false, error: err });
    });
  }

  dismissError = () => {
    this.setState({ error: undefined });
  }

  dismissSuccess = () => {
    this.setState({ success: undefined });
  }

  toLoginMode = () => {
    this.setState( {
      password: '',
      mode: Mode.Login
    });
  }

  toCreateAccountMode = () => {
    this.setState({ 
      mode: Mode.CreateAccount 
    });
  }

  toForgotPasswordMode = () => {
    this.setState({ 
      password: '',
      mode: Mode.ForgotPassword 
    });
  }

  setEmail = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({ email: e.currentTarget.value })
  }

  setPassword = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({ password: e.currentTarget.value })
  }

  renderCommittee = (committeeID: CommitteeID, committee: CommitteeData) => {
    return (
      <List.Item key={committeeID}>
        <List.Content>
          <List.Header as="a" href={`/committees/${committeeID}`}>
            {committee.name}
          </List.Header>
          <List.Description>
            {committee.topic}
          </List.Description>
        </List.Content>
      </List.Item>
    );
  }

  renderNewCommitteeButton = () => {
    return (
      <List.Item key={'add'}>
        <List.Content>
          <List.Header as="a" href={'/onboard'}>
            <Icon name="plus" />
            <FormattedMessage id="auth.button.create.committee" defaultMessage="Create new committee" />
          </List.Header>
        </List.Content>
      </List.Item>
    );
  }

  renderCommittees = () => {
    const { renderCommittee } = this;
    const { committees } = this.state;

    const defaulted = committees || {} as Record<CommitteeID, CommitteeData>;
    const owned = _.keys(defaulted);

    return (owned.length > 0) ? 
    (
      <List relaxed>
        {owned.map(k => renderCommittee(k, defaulted[k]))}
      </List>
    ) : (
      <Header as='h4'>
        <FormattedMessage id="auth.message.no.committees" defaultMessage="No committees created" />
        <Header.Subheader>
          <FormattedMessage id="auth.message.create.first" defaultMessage="Create a new committee and it'll appear here!" />
        </Header.Subheader>
      </Header>
    );
  }

  renderError = () => {
    const { dismissError } = this;

    const err = this.state.error;
    
    return (
      <Message
        key="error"
        error
        onDismiss={dismissError}
      >
        <Message.Header>{err ? err.name : ''}</Message.Header>
        <Message.Content>{err ? err.message : ''}</Message.Content>
      </Message>
    );
  }

  renderSuccess = () => {
    const { dismissSuccess } = this;

    const succ = this.state.success;

    return (
      <Message
        key="success"
        success
        onDismiss={dismissSuccess}
      >
        <Message.Header>{succ ? succ.name : ''}</Message.Header>
        <Message.Content>{succ ? succ.message : ''}</Message.Content>
      </Message>
    );
  }

  renderLoggedIn = (u: firebase.User) => {
    const { logout, renderCommittees, renderNewCommitteeButton, props: { allowNewCommittee } } = this;

    return (
      <Card fluid>
        <Card.Content>
          <Card.Header>
            <FormattedMessage 
              id="auth.header.welcome" 
              defaultMessage="Welcome, {email}" 
              values={{ email: u.email }}
            />
          </Card.Header>
          <Card.Meta>
            <FormattedMessage id="auth.header.committees" defaultMessage="Your committees" />
          </Card.Meta>
          <Card.Description>
            {renderCommittees()}
            {allowNewCommittee !== false && renderNewCommitteeButton()}
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Button basic fluid onClick={logout}>
            <FormattedMessage id="auth.button.logout" defaultMessage="Log out" />
          </Button>
        </Card.Content>
      </Card>
    );
  }

  renderLogin = () => {
    const { loggingIn, creating, user, resetting, email, password, mode } = this.state;

    const renderLogInButton = () => (
      <Button
        primary
        fluid
        loading={loggingIn}
        onClick={this.login}
      >
        <FormattedMessage id="auth.button.login" defaultMessage="Log in" />
      </Button>
    );

    const renderCreateAccountButton = () => (
      <Button basic fluid onClick={this.toCreateAccountMode}>
        <FormattedMessage id="auth.button.create.account" defaultMessage="Create an account" />
      </Button>
    );

    const renderSubmitCreateAccountButton = () => (
      <Button
        primary
        fluid
        loading={creating}
        onClick={this.createAccount}
      >
        <FormattedMessage id="auth.button.submit.create" defaultMessage="Create account" />
      </Button>
    );

    const renderForgotPasswordButton = () => (
      <Button basic fluid onClick={this.toForgotPasswordMode}>
        <FormattedMessage id="auth.button.forgot.password" defaultMessage="Forgot password?" />
      </Button>
    );

    const renderToLoginButton = () => (
      <Button basic fluid onClick={this.toLoginMode}>
        <FormattedMessage id="auth.button.back.login" defaultMessage="Back to login" />
      </Button>
    );

    const renderSendResetEmailButton = () => (
      <Button
        primary
        fluid
        loading={resetting}
        onClick={this.resetPassword}
      >
        <FormattedMessage id="auth.button.reset.password" defaultMessage="Send reset email" />
      </Button>
    );

    return (
      <Card fluid>
        <Card.Content>
          <Card.Header>
            {mode === Mode.Login && (
              <FormattedMessage id="auth.header.login" defaultMessage="Log in" />
            )}
            {mode === Mode.CreateAccount && (
              <FormattedMessage id="auth.header.create" defaultMessage="Create an account" />
            )}
            {mode === Mode.ForgotPassword && (
              <FormattedMessage id="auth.header.reset" defaultMessage="Reset password" />
            )}
          </Card.Header>
          <Card.Description>
            <Form>
              <Form.Input
                label={<FormattedMessage id="auth.label.email" defaultMessage="Email" />}
                placeholder={<FormattedMessage id="auth.placeholder.email" defaultMessage="Enter your email" />}
                value={email}
                onChange={this.setEmail}
                error={mode === Mode.CreateAccount && !email}
              />
              {mode !== Mode.ForgotPassword && (
                <Form.Input
                  label={<FormattedMessage id="auth.label.password" defaultMessage="Password" />}
                  placeholder={<FormattedMessage id="auth.placeholder.password" defaultMessage="Enter your password" />}
                  type="password"
                  value={password}
                  onChange={this.setPassword}
                  error={mode === Mode.CreateAccount && !password}
                />
              )}
            </Form>
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          {mode === Mode.Login && (
            <>
              {renderLogInButton()}
              {renderCreateAccountButton()}
              {renderForgotPasswordButton()}
            </>
          )}
          {mode === Mode.CreateAccount && (
            <>
              {renderSubmitCreateAccountButton()}
              {renderToLoginButton()}
            </>
          )}
          {mode === Mode.ForgotPassword && (
            <>
              {renderSendResetEmailButton()}
              {renderToLoginButton()}
            </>
          )}
        </Card.Content>
      </Card>
    );
  }

  render() {
    const { error, success, user } = this.state;

    return (
      <div>
        {error && this.renderError()}
        {success && this.renderSuccess()}
        {user === undefined ? (
          <Loading />
        ) : user ? (
          this.renderLoggedIn(user)
        ) : (
          this.renderLogin()
        )}
      </div>
    );
  }
}

export class LoginModal extends React.Component<{}, { 
  user?: firebase.User | null;
  unsubscribe?: () => void;
}> {
  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  renderModalTrigger() {
    const { user } = this.state;

    return (
      <Button basic>
        {user ? (
          <FormattedMessage id="auth.button.account" defaultMessage="Account" />
        ) : (
          <FormattedMessage id="auth.button.login.signup" defaultMessage="Log in / Sign up" />
        )}
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
        size="tiny"
        dimmer
        basic={true} // strip out the outer window
      >
        <Modal.Content>
          <Login allowNewCommittee={true}/>
        </Modal.Content>
      </Modal>
    );
  }
}