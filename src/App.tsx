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

const Footer = () => {
  return (
    <Message size="mini">
      Made with 💖 by <a href="http://maxbo.me/">Max Bo</a>, <a href="http://hugokawamata.com/">Hugo Kawmata</a>, 
      and <a href="http://charltongroves.com/">Charlie Groves</a>
    </Message>);
};

class App extends React.Component {
  render() {

    return (
      <Container>
        <Route exact={true} path="/committees" component={Welcome} />
        <Route path="/committees/:committeeID" component={Committee} />
        <Footer />
      </Container>
    );
  }
}

export default App;
