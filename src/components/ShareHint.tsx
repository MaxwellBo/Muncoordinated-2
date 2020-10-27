import * as React from 'react';
import { CommitteeID } from './Committee';
import { Divider, Header, Input, List, Segment } from 'semantic-ui-react';
import { StrawpollID } from './Strawpoll';

function CopyableText(props: {
  value: string
}) {
  const [message, setMessage] = React.useState<string>('Copy');

  const copy = () => {

    // We have to try-catch because this API might not be available
    try {
      navigator.clipboard.writeText(props.value)
        .then(() => {
          setMessage('Copy again')
        })
        .catch(() => {
          setMessage('Please copy manually')
        })
    } catch (e) {
      setMessage('Please copy manually')
    }
  }

  return (
      <Input fluid
        value={props.value}
        action={{
          labelPosition: 'right',
          icon: 'copy outline',
          content: message,
          onClick: copy
        }}
        defaultValue={props.value}
      />
  );
}

export function CommitteeShareHint(props: {
  committeeID: CommitteeID;
}) {
  const hostname = window.location.hostname;
  const { committeeID } = props;
  const url = `${hostname}/committees/${committeeID}`;

  return (
    <Segment>
      <Header size='medium'>Here's the link to your committee</Header>
      <CopyableText value={url} />

      <Divider />

      Copy and send this to your delegates, and they will be able to:
      
      <List bulleted>
        <List.Item>Upload files</List.Item>
        <List.Item>Add themselves to speaker's lists that have the 'Delegates can queue' flag enabled</List.Item>
        <List.Item>Add and edit amendments on resolutions that have the 'Delegates can amend' flag enabled</List.Item>
        <List.Item>Vote on strawpolls</List.Item>
      </List>
    </Segment>
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
    <Segment>
      <Header size='medium'>Here's the sharable link to your strawpoll</Header>
      <CopyableText value={url} />
    </Segment>
  );
}
