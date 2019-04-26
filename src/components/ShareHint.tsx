import * as React from 'react';
import { CommitteeID } from './Committee';
import { List, Message } from 'semantic-ui-react';
import { StrawpollID } from './Strawpoll';

export function CommitteeShareHint(props: {
  committeeID: CommitteeID;
}) {
  const hostname = window.location.hostname;
  const { committeeID } = props;
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

export function StrawpollShareHint(props: {
  committeeID: CommitteeID;
  strawpollID: StrawpollID;
}) {
  const hostname = window.location.hostname;
  const { committeeID, strawpollID } = props;
  const url = `${hostname}/committees/${committeeID}/strawpolls/${strawpollID}`;

  return (
    <Message info>
      <Message.Header>Sharable voting link</Message.Header>
      <a href={`/committees/${committeeID}/strawpolls/${strawpollID}`}><b>{url}</b></a>
    </Message>
  );
}