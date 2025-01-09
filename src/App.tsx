import * as React from 'react';

// This import loads the firebase namespace along with all its type information.
import firebase from 'firebase/compat/app';

// These imports load individual services into the firebase namespace.
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/analytics';

import { Route, Switch } from 'react-router-dom';
import './App.css';

import Onboard from './pages/Onboard';
import Homepage from './pages/Homepage';
import Committee from './pages/Committee';
import { NotFound } from './components/NotFound';

const firebaseConfig = {
  apiKey: 'AIzaSyA9EuEf7m3YOTBhBNhoe7DcOIZJP2toL6w',
  authDomain: 'qmun.firebaseapp.com',
  databaseURL: 'https://qmun.firebaseio.com',
  projectId: 'qmun',
  storageBucket: 'qmun.appspot.com',
  messagingSenderId: '308589918735',
  appId: "1:308589918735:web:f3567ce28d637eba40017a",
  measurementId: "G-DPWPPBRD4M"
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

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
