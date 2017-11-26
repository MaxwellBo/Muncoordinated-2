import * as React from 'react';
import * as firebase from 'firebase';
import { Route } from 'react-router-dom';
import { Button, Container, Header, Message } from 'semantic-ui-react';
import './App.css';

import { ModalLogin } from './Auth';
import Welcome from './Welcome';
import Committee from './Committee';

const Footer = () => {
  return (
    <Message compact size="mini">
      Made with 💖 by <a href="https://github.com/MaxwellBo">Max Bo</a>
      {/* , <a href="http://hugokawamata.com/">Hugo Kawamata</a>, 
      and <a href="http://charltongroves.com/">Charlie Groves</a> */}
    </Message>);
};

class App extends React.Component {
  render() {

    return (
      <Container style={{ padding: '1em 0em' }}>
        <ModalLogin />
        <Route exact={true} path="/" component={Welcome} />
        <Route path="/committees/:committeeID" component={Committee} />
        <Footer />
      </Container>
    );
  }
}

export default App;
