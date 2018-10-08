import * as React from 'react';
import { TransitionablePortal, Button, Segment, Header, Card } from 'semantic-ui-react';
import * as _ from 'lodash';

interface Props {
}

interface State {
  open: boolean;
  notifications: Notification[];
}

interface Notification {
  message: string;
  header: string;
}

export default class Notifications extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      open: true,
      notifications: []
    };
  }

  handleClose = () => this.setState({ open: false });

  listener: EventListener = (event: Event) => {
    // @ts-ignore
    const reason = event.reason as { code: string, message: string } | undefined; 

    if (reason && reason.code === 'PERMISSION_DENIED') {
      this.setState(prevState => {
        const newNotification: Notification = {
          header: 'Permission denied',
          message: 'Please login as the owner of this committee in order to perform that action. You may be seeing this due to a recently lost connection'
        };

        // Debounce unique
        if (!_.some(prevState.notifications, newNotification)) {
          console.debug(newNotification);

          return {
            notifications: [...prevState.notifications, newNotification]
          };
        } else {
          return { notifications: prevState.notifications };
        }
      });
    }
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.listener);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.listener);
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
    const { open, notifications } = this.state;

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