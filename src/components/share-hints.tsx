import * as React from 'react';
import { Divider, Header, Input, List, Segment } from 'semantic-ui-react';
import {CommitteeID} from "../models/committee";
import {StrawpollID} from "../models/strawpoll";

function CopyableText(props: {
  value: string
}) {
  const [message, setMessage] = React.useState<string>('Copy');

  const copy = () => {
    // We have to try-catch because this API might not be available
    try {
      navigator.clipboard.writeText(props.value)
        .then(() => {
          setMessage('Copiado!')
          setTimeout(() => setMessage('Copiar'), 3000)
        })
        .catch(() => {
          setMessage('Por favor copie manualmente')
        })
    } catch (e) {
      setMessage('Por favor copie manualmente')
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
      <Header size='medium'>Here's the shareable link to your committee</Header>
      <CopyableText value={url} />

      <Divider hidden />

      Copy and send this to your delegates, and they will be able to:

      <VerboseShareCapabilities />
      
    </Segment>
  );
}

export function ShareCapabilities() {
  return (
      <List bulleted>
        <List.Item>Upload files</List.Item>
        <List.Item>Add themselves to speakers' lists</List.Item>
        <List.Item>Add and edit amendments on resolutions</List.Item>
        <List.Item>Propose motions</List.Item>
        <List.Item>Vote on motions</List.Item>
        <List.Item>Vote on strawpolls</List.Item>
      </List>
  )
}

export function VerboseShareCapabilities() {
  return (
      <List bulleted>
        <List.Item>Upload files</List.Item>
        <List.Item>Add themselves to speakers' lists that have the <i>Delegates can queue</i> flag enabled</List.Item>
        <List.Item>Add and edit amendments on resolutions that have the <i>Delegates can amend</i> flag enabled</List.Item>
        <List.Item>Propose motions that have the <i>Delegates can propose motions</i> flag enabled</List.Item>
        <List.Item>Vote on motions that have the <i>Delegates can vote on motions</i> flag enabled</List.Item>
        <List.Item>Vote on strawpolls</List.Item>
      </List>
  )
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
      <Header size='small'>Here's the shareable link to your strawpoll</Header>
      <CopyableText value={url} />
    </Segment>
  );
}

export function MotionsShareHint(props: {
  canVote: boolean,
  canPropose: boolean,
  committeeID: CommitteeID;
}) {
  const hostname = window.location.hostname;
  const { committeeID, canVote, canPropose } = props;
  const url = `${hostname}/committees/${committeeID}/motions`;

  let action: string

  if (canVote && canPropose) {
    action = 'vote on and propose motions'
  } else if (canVote) {
    action = 'vote on motions'
  } else if (canPropose) {
    action = 'propose motions'
  } else {
    action = 'vote on and propose motions'
  }

  return (
    <Segment>
      <Header size='small'>Here's the shareable link to {action}</Header>
      <CopyableText value={url} />
    </Segment>
  );
}
