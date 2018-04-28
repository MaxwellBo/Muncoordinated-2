import * as React from 'react';
import * as firebase from 'firebase';
import { Route } from 'react-router-dom';
import { Button, Container, Header } from 'semantic-ui-react';
import './App.css';

const firebaseConfig = {
  apiKey: 'AIzaSyA9EuEf7m3YOTBhBNhoe7DcOIZJP2toL6w',
  authDomain: 'muncoordinated.firebaseapp.com',
  databaseURL: 'https://muncoordinated.firebaseio.com',
  projectId: 'muncoordinated',
  storageBucket: 'muncoordinated.appspot.com',
  messagingSenderId: '308589918735'
};

firebase.initializeApp(firebaseConfig);

import ConnectionStatus from './components/ConnectionStatus';
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
        <Route exact={true} path="/" component={Homepage} />
        <Route exact={true} path="/onboard" component={Onboard} />
        <Route path="/committees" component={ModalLogin} />
        <Route path="/committees/:committeeID" component={Committee} />
      </Container>
    );
  }
}

export default App;
