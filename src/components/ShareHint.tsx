import * as React from 'react';
import { Message } from 'semantic-ui-react';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { CommitteeID } from './Committee';

interface Props {
  committeeID: CommitteeID;
}

interface State {
  visible: boolean;
}

export default class ShareHint extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      visible: true
    };
  }

  handleDismiss = () => {
    this.setState({ visible: false });
  }

  render() {
    const hostname = window.location.hostname;
    const { committeeID } = this.props;
    const url = `${hostname}/committees/${committeeID}`;

    if (this.state.visible) {
      return (
        <Message
          onDismiss={this.handleDismiss}
          color="blue"
        >
          Send <a href={`/committees/${committeeID}`}><b>{url}</b></a> to delegates so that they may upload files, 
          and add themselves to speaker's lists that have the 'Delegates can queue' flag enabled
        </Message>
      );
    } else {
      return <div />;
    }
  }
}