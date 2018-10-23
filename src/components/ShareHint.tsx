import * as React from 'react';
import { CommitteeID } from './Committee';
import { List } from 'semantic-ui-react';

interface Props {
  committeeID: CommitteeID;
}

interface State {
}

export default class ShareHint extends React.Component<Props, State> {
  render() {
    const hostname = window.location.hostname;
    const { committeeID } = this.props;
    const url = `${hostname}/committees/${committeeID}`;

    return (
      <React.Fragment>
        Send <a href={`/committees/${committeeID}`}><b>{url}</b></a> to delegates so that they may: 
        <List bulleted>
          <List.Item>Upload files</List.Item>
          <List.Item>Add themselves to speaker's lists that have the 'Delegates can queue' flag enabled</List.Item>
          <List.Item>Add and edit amendments on resolutions that have the 'Delegates can amend' flag enabled</List.Item>
        </List>
      </React.Fragment>
    );
  }
}