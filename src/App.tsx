import * as React from 'react';
import * as firebase from 'firebase';
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

import Timer from './Timer';
import Member from './Member';

class App extends React.Component {
  render() {

    const committeeRef = firebase.database().ref('commitees/6019497035172651252');
    const caucusRef = committeeRef.child('caucuses').child('General');

    return (
      <div className="App">
        <p>Hello world</p>
        <Timer fref={caucusRef.child('caucusTimer')} />
        <Member fref={committeeRef.child('members').child('Russia')} />
      </div>
    );
  }
}

export default App;
