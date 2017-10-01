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

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <p>Hello world</p>
        <Timer />
      </div>
    );
  }
}

export default App;
