import * as React from 'react';
import * as firebase from 'firebase';
import { Route } from 'react-router-dom';
import { Container } from 'semantic-ui-react';
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
import { Login } from './components/Auth';
import Onboard from './components/Onboard';
import Homepage from './components/Homepage';
import Committee from './components/Committee';

class App extends React.Component {
  render() {
    return (
      <div>
        <Route exact path="/" component={Homepage} />
        <Container style={{ padding: '1em 0em' }}>
          <ConnectionStatus />
          <Route exact path="/onboard" component={Onboard} />
          <Route exact path="/committees" component={Login} />
          <Route path="/committees/:committeeID" component={Committee} />
        </Container>
      </div>
    );
  }
}

export default App;
