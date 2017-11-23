import * as React from 'react';
import * as firebase from 'firebase';
import * as firebaseui from 'firebaseui';
import { Link } from 'react-router-dom';
import 'firebaseui/dist/firebaseui.css';

interface State { 
}
interface Props { 
}

const firebaseConfig = {
  apiKey: 'AIzaSyA9EuEf7m3YOTBhBNhoe7DcOIZJP2toL6w',
  authDomain: 'muncoordinated.firebaseapp.com',
  databaseURL: 'https://muncoordinated.firebaseio.com',
  projectId: 'muncoordinated',
  storageBucket: 'muncoordinated.appspot.com',
  messagingSenderId: '308589918735'
};

firebase.initializeApp(firebaseConfig);

const authUi = new firebaseui.auth.AuthUI(firebase.auth());
firebase.auth().onAuthStateChanged(authStateChangedCallback);

export var user: firebase.User | null = null;

function authStateChangedCallback(u: firebase.User) {
  user = u;
}

export default class Login extends React.Component<Props, State> {
  componentWillUnmount() {
    authUi.reset();
  }

  componentDidMount() {
    var uiConfig = {
      signInSuccessUrl: '/adfsad',
      signInFlow: 'popup' as 'popup',
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID
      ],
      tosUrl: '/tos`'
    };

    if (!user) {
      authUi.start('#Login-firebaseui-auth-container', uiConfig);
    }
  }

  render() {
    if (user) {
      // authUi.reset(); // You might need to do this
      return (
        <section className="section">
          <div className="container">
            <div className="centered-container centered">
              <p>
                You're already logged in!
                <div className="download-button">
                  <Link to="/app/view"><button className="button is-primary">Go to app</button></Link>
                </div>
              </p>
            </div>
          </div>
        </section>
      );
    } else {
      return (
        <section className="section">
          <div className="container">
            <div id="Login-firebaseui-auth-container" />
          </div>
        </section>
      );
    }
  }
}
