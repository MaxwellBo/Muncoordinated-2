import * as React from 'react';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import * as Rx from 'rxjs';
import { TransitionablePortal, Button, Card } from 'semantic-ui-react';

export const PERMISSION_DENIED_NOTIFICATION: Notification =  {
  header: 'Permission denied',
  message: 'Please login as the owner of this committee in order to perform that action',
  disposition: 'negative'
};

export const CONNECTION_LOST_NOTIFICATION: Notification =  {
  header: 'Connection lost',
  message: 'The connection to the server was lost. You may have been logged out',
  disposition: 'negative'
};

export const CONNECTION_REGAINED_NOTIFICATION: Notification =  {
  header: 'Connection regained',
  message: 'The connection to the server was regained',
  disposition: 'positive'
};

export const NEW_VERSION_AVAILABLE_NOTIFICATION: Notification =  {
  header: 'New version available',
  message: 'Refresh the page twice to download a new version of Muncoordinated',
  disposition: 'positive'
};

let connected = false;
let hasConnectedBefore = false; 
const $notifications = new Rx.BehaviorSubject<Notification[]>([]);

interface Props {
}

interface State {
  latestNotifications: Notification[];
  subscription?: Rx.Subscription;
}

function handleInfoConnected(status: firebase.database.DataSnapshot | null) {
  if (status) {
      const oldConnected = connected;
      const newConnected = status.val();
      connected = newConnected;

      if (!newConnected && hasConnectedBefore) {
        appendNotification(CONNECTION_LOST_NOTIFICATION);
      }

      if (!oldConnected && newConnected && hasConnectedBefore) {
        appendNotification(CONNECTION_REGAINED_NOTIFICATION);
      }

      hasConnectedBefore = newConnected || hasConnectedBefore;
  }
}

function handleUnhandledRejection(event: Event)  {
  // @ts-ignore
  const reason = event.reason as { code: string, message: string } | undefined; 

  if (reason && reason.code === 'PERMISSION_DENIED') {
    appendNotification(PERMISSION_DENIED_NOTIFICATION);
  }
}

export function appendNotification(n: Notification): void {
    const ns = $notifications.value;
    // Don't permit duplicates
    if (!_.some(ns, n)) {
      console.info(n);
      $notifications.next([...ns, n]);
    }
}

interface Notification {
  message?: string;
  header: string;
  disposition: 'positive' | 'negative';
}

export default class Notifications extends React.Component<Props, State> {
  infoConnected = firebase.database().ref('.info/connected');

  constructor(props: Props) {
    super(props);

    this.state = {
      latestNotifications: [] as Notification[]
    };
  }

  componentDidMount() {
    const subscription = $notifications.subscribe({
      next: (v) => this.setState( { latestNotifications: v })
    });

    this.setState({ subscription });

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    this.infoConnected.on('value', handleInfoConnected);
  }

  componentWillUnmount() {
    const { subscription } = this.state;

    if (subscription) {
      subscription.unsubscribe();
      this.setState({ subscription: undefined });
    }

    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    this.infoConnected.off('value', handleInfoConnected);
  }

  dismiss = (key: number) => () => {
    const spliced = [...$notifications.value];
    spliced.splice(key, 1);

    $notifications.next(spliced);
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
    const { latestNotifications } = this.state;

    const renderedNotifications = latestNotifications.map(renderNotification);

    return (
      <TransitionablePortal
        open={latestNotifications.length > 0}
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