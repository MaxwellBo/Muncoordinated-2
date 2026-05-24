import * as React from 'react';

// This import loads the firebase namespace along with all its type information.
import firebase from 'firebase/compat/app';

// These imports load individual services into the firebase namespace.
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/analytics';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

import { Route, Switch } from 'react-router-dom';
import './App.css';

import Onboard from './pages/Onboard';
import Homepage from './pages/Homepage';
import Committee from './pages/Committee';
import { NotFound } from './components/NotFound';

const firebaseConfig = {
  apiKey: 'AIzaSyA9EuEf7m3YOTBhBNhoe7DcOIZJP2toL6w',
  authDomain: 'muncoordinated.firebaseapp.com',
  databaseURL: 'https://muncoordinated.firebaseio.com',
  projectId: 'muncoordinated',
  storageBucket: 'muncoordinated.appspot.com',
  messagingSenderId: '308589918735',
  appId: "1:308589918735:web:f3567ce28d637eba40017a",
  measurementId: "G-DPWPPBRD4M"
};

const useFirebaseEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const emulatorState = window as typeof window & {
  __FIREBASE_EMULATORS_CONNECTED__?: boolean;
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

if (useFirebaseEmulators && !emulatorState.__FIREBASE_EMULATORS_CONNECTED__) {
  firebase.auth().useEmulator('http://127.0.0.1:9099');
  connectDatabaseEmulator(getDatabase(), '127.0.0.1', 9000);
  connectStorageEmulator(getStorage(), '127.0.0.1', 9199);
  emulatorState.__FIREBASE_EMULATORS_CONNECTED__ = true;
}

if (!useFirebaseEmulators) {
  firebase.analytics();
}

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
