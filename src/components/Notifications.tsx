import * as React from 'react';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import { TransitionablePortal, Button, Card } from 'semantic-ui-react';
import { State as ConnectionStatusState } from './ConnectionStatus';

interface Props {
}

interface State extends ConnectionStatusState {
  open: boolean;
  notifications: Notification[];
}

interface Notification {
  message: string;
  header: string;
}

const PERMISSION_DENIED_NOTIFICATION =  {
  header: 'Permission denied',
  message: 'Please login as the owner of this committee in order to perform that action.'
};

const CONNECTION_LOST_NOTIFICATION =  {
  header: 'Connection lost',
  message: 'The connection to the server was lost. You may have been logged out, and will need to log in again'
};

export default class Notifications extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      open: true,
      notifications: [],
      hasConnectedBefore: false,
      connected: false,
      fref: firebase.database().ref('.info/connected')
    };
  }

  computeNewNotificationState = (prevState: State, notification: Notification): Pick<State, 'notifications'> => {
      // Debounce unique
      if (!_.some(prevState.notifications, notification)) {
        console.debug(notification);

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
      this.setState((prevState: State, props: Props) => { 

        const connected = status.val();

        const addedNotification = connected && prevState.hasConnectedBefore 
            ?  computeNewNotificationState(prevState, CONNECTION_LOST_NOTIFICATION)
            : {} as Pick<State, never>;

        return {
          ...addedNotification,
          connected: connected,
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
      <Card color="red" key={key}>
        <Card.Content>
          <Card.Header>{notification.header}</Card.Header>
          {/* <Card.Meta>Co-Worker</Card.Meta> */}
          <Card.Description>{notification.message}</Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Button basic fluid color="red" onClick={this.dismiss(key)}>
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
          style={{ left: '78%', position: 'fixed', top: '7%', zIndex: 1000 }}
        >
          {renderedNotifications}
        </Card.Group>
      </TransitionablePortal>
    );
  }
}