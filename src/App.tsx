import * as React from 'react';
import * as firebase from 'firebase';
import { Route } from 'react-router-dom';
import { Button, Container, Header } from 'semantic-ui-react';
import './App.css';
import { ConnectionStatus } from './components/ConnectionStatus';

import { ModalLogin } from './components/Auth';
import Onboard from './components/Onboard';
import Homepage from './components/Homepage';
import Committee, { CommitteeID } from './components/Committee';
import { CaucusID } from './components/Caucus';

class App extends React.Component {
  render() {

    return (
      <Container style={{ padding: '1em 0em' }}>
        <ConnectionStatus />
        <Route exact={true} path="/" component={Onboard} />
        <Route exact={true} path="/onboard" component={Onboard} />
        <Route path="/committees" component={ModalLogin} />
        <Route path="/committees/:committeeID" component={Committee} />
      </Container>
    );
  }
}

export default App;
