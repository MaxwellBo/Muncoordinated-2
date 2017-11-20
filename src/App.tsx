import * as React from 'react';
import * as firebase from 'firebase';
import { Route } from 'react-router-dom';
import { Button, Container, Header, Message } from 'semantic-ui-react';
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

import Welcome from './Welcome';
import Committee from './Committee';
import Login from './Login';

const Footer = () => {
  return (
    <Message compact size="mini">
      Made with 💖 by <a href="http://maxbo.me/">Max Bo</a>
      {/* , <a href="http://hugokawamata.com/">Hugo Kawamata</a>, 
      and <a href="http://charltongroves.com/">Charlie Groves</a> */}
    </Message>);
};

class App extends React.Component {
  render() {

    return (
      <Container>
        <Route exact={true} path="/" component={Welcome} />
        <Route exact={true} path="/login" component={Login} />
        <Route path="/committees/:committeeID" component={Committee} />
        <Footer />
      </Container>
    );
  }
}

export default App;
