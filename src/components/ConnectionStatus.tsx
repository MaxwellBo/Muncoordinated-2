import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Message } from 'semantic-ui-react';
import firebase from 'firebase/compat/app';

interface State {
  connected: boolean;
  connecting: boolean;
}

export default class ConnectionStatus extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      connected: false,
      connecting: true
    };
  }

  componentDidMount() {
    const connectedRef = firebase.database().ref('.info/connected');
    connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        this.setState({ connected: true, connecting: false });
      } else {
        this.setState({ connected: false, connecting: false });
      }
    });
  }

  render() {
    const { connected, connecting } = this.state;

    if (connecting) {
      return (
        <Message info>
          <FormattedMessage id="connection.status.connecting" defaultMessage="Connecting..." />
        </Message>
      );
    }

    if (!connected) {
      return (
        <Message error>
          <FormattedMessage id="connection.status.disconnected" defaultMessage="Disconnected" />
        </Message>
      );
    }

    return (
      <Message positive>
        <FormattedMessage id="connection.status.connected" defaultMessage="Connected" />
      </Message>
    );
  }
}