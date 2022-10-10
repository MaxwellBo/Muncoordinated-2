import * as React from 'react';
import * as firebase from 'firebase/app';
import * as _ from 'lodash';
import { TransitionablePortal, Button, Card } from 'semantic-ui-react';
import { State as ConnectionStatusState } from './ConnectionStatus';

interface Props {
}

interface State extends ConnectionStatusState {
  notifications: Notification[];
}

interface Notification {
  message?: string;
  header: string;
  disposition: 'positive' | 'negative';
}

const PERMISSION_DENIED_NOTIFICATION: Notification =  {
  header: 'Permission denied',
  message: 'Please login as the owner of this committee in order to perform that action',
  disposition: 'negative'
};

const CONNECTION_LOST_NOTIFICATION: Notification =  {
  header: 'Connection lost',
  message: 'The connection to the server was lost. You may have been logged out',
  disposition: 'negative'
};

const CONNECTION_REGAINED_NOTIFICATION: Notification =  {
  header: 'Connection regained',
  message: 'The connection to the server was regained',
  disposition: 'positive'
};

export default class Notifications extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      notifications: [],
      connected: false,
      hasConnectedBefore: false,
      fref: firebase.database().ref('.info/connected')
    };
  }

  computeNewNotificationState = 
  (prevState: Pick<State, 'notifications'>, notification: Notification): Pick<State, 'notifications'> => {
      // Debounce unique
      if (!_.some(prevState.notifications, notification)) {
        console.info(notification);

        return {
          notifications: [...prevState.notifications, notification]
        };
      } else {
        return { notifications: prevState.notifications };
      }
  }

  firebaseCallback = (status: firebase.database.DataSnapshot | null) => {
    const { computeNewNotificationState } = this;

    if (status) {
      this.setState((prevState: State) => { 

        const connected = status.val();

        let acc: Pick<State, | 'notifications'> = prevState;

        acc = (!connected && prevState.hasConnectedBefore)
            ?  computeNewNotificationState(acc, CONNECTION_LOST_NOTIFICATION)
            : acc;

        acc = (!prevState.connected && connected && prevState.hasConnectedBefore)
            ?  computeNewNotificationState(acc, CONNECTION_REGAINED_NOTIFICATION)
            : acc;

        return {
          ...acc,
          hasConnectedBefore: connected || prevState.hasConnectedBefore
        };
      });
    }
  }

  listener: EventListener = (event: Event) => {
    const { computeNewNotificationState } = this;
    // @ts-ignore
    const reason = event.reason as { code: string, message: string } | undefined; 

    if (reason && reason.code === 'PERMISSION_DENIED') {
      this.setState(prevState => {
        return computeNewNotificationState(prevState, PERMISSION_DENIED_NOTIFICATION);
      });
    }
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.listener);
    this.state.fref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.listener);
    this.state.fref.off('value', this.firebaseCallback);
  }

  dismiss = (key: number) => () => {
    const target = [...this.state.notifications];

    target.splice(key, 1);

    this.setState({notifications: target});
  }

  renderNotification = (notification: Notification, key: number) => {
    return (
      <Card style={{ 'maxWidth': 275 }} key={key} raised>
        <Card.Content>
          <Card.Header>{notification.header}</Card.Header>
          {notification.message && <Card.Description>{notification.message}</Card.Description>}
        </Card.Content>
        <Card.Content extra>
          <Button 
            basic 
            fluid 
            positive={notification.disposition === 'positive'} 
            negative={notification.disposition === 'negative'} 
            onClick={this.dismiss(key)}
          >
              Dismiss
          </Button>
        </Card.Content>
      </Card>
    );
  }

  render() {
    const { renderNotification } = this;
    const { notifications } = this.state;

    const renderedNotifications = notifications.map(renderNotification);

    return (
      <TransitionablePortal
        open={notifications.length > 0}
        transition={{ animation: 'fly left', duration: 500 }}
      >
        <Card.Group 
          itemsPerRow={1} 
          style={{ right: 5, position: 'fixed', top: '7%', zIndex: 1000 }}
        >
          {renderedNotifications}
        </Card.Group>
      </TransitionablePortal>
    );
  }
}