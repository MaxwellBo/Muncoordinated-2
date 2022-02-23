import * as React from 'react';

// This import loads the firebase namespace along with all its type information.
import * as firebase from 'firebase/app';

// These imports load individual services into the firebase namespace.
import 'firebase/auth';
import 'firebase/database';
import 'firebase/firestore';
import 'firebase/storage';

import { Route, Switch } from 'react-router-dom';
import './App.css';

import Onboard from './components/Onboard';
import Homepage from './components/Homepage';
import Committee from './components/Committee';
import { NotFound } from './components/NotFound';

const firebaseConfig = {
  apiKey: 'AIzaSyA9EuEf7m3YOTBhBNhoe7DcOIZJP2toL6w',
  authDomain: 'muncoordinated.firebaseapp.com',
  databaseURL: 'https://muncoordinated.firebaseio.com',
  projectId: 'muncoordinated',
  storageBucket: 'muncoordinated.appspot.com',
  messagingSenderId: '308589918735',
  appId: "1:308589918735:web:f3567ce28d637eba40017a"
};

firebase.initializeApp(firebaseConfig);

class App extends React.Component {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={Homepage} />
        <Route exact path="/onboard" component={Onboard} />
        <Route exact path="/committees" component={Onboard} />
        <Route path="/committees/:committeeID" component={Committee} />
        <Route path="*">
          <NotFound item="page" id="unknown" />
        </Route>
      </Switch>
    );
  }
}

export default App;
