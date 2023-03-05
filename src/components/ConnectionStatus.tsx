import * as React from 'react';
import firebase from 'firebase/app';
import { Message, Icon } from 'semantic-ui-react';

interface Props {
}

export interface State {
  connected: boolean;
  hasConnectedBefore: boolean;
  fref: firebase.database.Reference;
}

export default class ConnectionStatus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasConnectedBefore: false,
      connected: false,
      fref: firebase.database().ref('.info/connected')
    };
  }

  firebaseCallback = (status: firebase.database.DataSnapshot | null) => {
    if (status) {
      this.setState((prevState: State) => { 

        const connected = status.val();

        if (!connected) {
          console.info('Firebase connection lost');
        }

        return {
          connected: connected,
          hasConnectedBefore: connected || prevState.hasConnectedBefore
        };
      });
    }
  }

  componentDidMount() {
    this.state.fref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    this.state.fref.off('value', this.firebaseCallback);
  }

  render() {
    const { connected, hasConnectedBefore } = this.state;

    return (!connected && hasConnectedBefore) ? (
      <Message icon negative>
        <Icon name="circle notched" loading />
        <Message.Content>
          <Message.Header>Connexão Perdidat</Message.Header>
          Não conseguimos efetuar suas mudanças no servidor. Tente de novo mais tarde.
        </Message.Content>
      </Message>
    ) : <div />;
  }
}