import * as React from 'react';
import * as firebase from 'firebase';
import { Route } from 'react-router-dom';
import { Button, Container, Header, Message, Icon } from 'semantic-ui-react';
import './App.css';

import { ModalLogin } from './Auth';
import Welcome from './Welcome';
import Committee from './Committee';

export const Footer = () => {
  return (
    <Message compact size="mini">
      Made with 😡 by <a href="https://github.com/MaxwellBo">Max Bo</a>
    </Message>);
};

class ConnectionStatus extends React.Component<{}, { connected: boolean, fref: firebase.database.Reference }> {
  constructor(props: {}) {
    super(props);

    this.state = {
      connected: false,
      fref: firebase.database().ref('.info/connected')
    };
  }

  componentDidMount() {
    this.state.fref.on('value', (status) => {
      if (status) {
        this.setState({ connected: status.val() });
      }
    });
  }

  componentWillUnmount() {
    this.state.fref.off();
  }

  render() {
    return !this.state.connected ? (
      <Message icon negative>
        <Icon name="warning sign" />
        <Message.Content>
          <Message.Header>Connection Lost</Message.Header>
          Refresh the page, as local changes will no longer be committed to the server.
        </Message.Content>
      </Message>
    ) : <div />;
  }
}

class App extends React.Component {
  render() {

    return (
      <Container style={{ padding: '1em 0em' }}>
        <ConnectionStatus />
        <Route exact={true} path="/onboard" component={Welcome} />
        <Route path="/committees" component={ModalLogin} />
        <Route path="/committees/:committeeID" component={Committee} />
        <Footer />
      </Container>
    );
  }
}

export default App;
