import * as React from 'react';
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
        <div>
          Send <a href={`/committees/${committeeID}`}><b>{url}</b></a> to delegates so that they may upload files, 
          and add themselves to speaker's lists that have the 'Delegates can queue' flag enabled
        </div>
      );
    } else {
      return <div />;
    }
  }
}