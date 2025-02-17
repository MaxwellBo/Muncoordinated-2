import * as React from 'react';
import { Divider, Header, Input, List, Segment } from 'semantic-ui-react';
import { CommitteeID } from "../models/committee";
import { StrawpollID } from "../models/strawpoll";
import { FormattedMessage, useIntl } from 'react-intl';

function CopyableText(props: {
  value: string
}) {
  const [message, setMessage] = React.useState<string>('Copy');
  const intl = useIntl();

  const copy = () => {
    // We have to try-catch because this API might not be available
    try {
      navigator.clipboard.writeText(props.value)
        .then(() => {
          setMessage(intl.formatMessage({ id: 'share.button.copied', defaultMessage: 'Copied!' }));
          setTimeout(() => setMessage(intl.formatMessage({ id: 'share.button.copy', defaultMessage: 'Copy' })), 3000);
        })
        .catch(() => {
          setMessage(intl.formatMessage({ id: 'share.button.manual', defaultMessage: 'Please copy manually' }));
        });
    } catch (e) {
      setMessage(intl.formatMessage({ id: 'share.button.manual', defaultMessage: 'Please copy manually' }));
    }
  };

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
      <Header size='medium'>
        <FormattedMessage 
          id="share.committee.title" 
          defaultMessage="Here's the shareable link to your committee" 
        />
      </Header>
      <CopyableText value={url} />

      <Divider hidden />

      <FormattedMessage 
        id="share.committee.instruction" 
        defaultMessage="Copy and send this to your delegates, and they will be able to:" 
      />

      <VerboseShareCapabilities />
      
    </Segment>
  );
}

export function ShareCapabilities() {
  return (
    <List bulleted>
      <List.Item>
        <FormattedMessage id="share.capability.files" defaultMessage="Upload files" />
      </List.Item>
      <List.Item>
        <FormattedMessage id="share.capability.speakers" defaultMessage="Add themselves to speakers' lists" />
      </List.Item>
      <List.Item>
        <FormattedMessage id="share.capability.amendments" defaultMessage="Add and edit amendments on resolutions" />
      </List.Item>
      <List.Item>
        <FormattedMessage id="share.capability.motions" defaultMessage="Propose motions" />
      </List.Item>
      <List.Item>
        <FormattedMessage id="share.capability.votes" defaultMessage="Vote on motions" />
      </List.Item>
      <List.Item>
        <FormattedMessage id="share.capability.strawpolls" defaultMessage="Vote on strawpolls" />
      </List.Item>
    </List>
  );
}

export function VerboseShareCapabilities() {
  return (
    <List bulleted>
      <List.Item>
        <FormattedMessage id="share.capability.files" defaultMessage="Upload files" />
      </List.Item>
      <List.Item>
        <FormattedMessage 
          id="share.capability.speakers.verbose" 
          defaultMessage="Add themselves to speakers' lists that have the {flag} flag enabled" 
          values={{ flag: <i>
            <FormattedMessage id="share.flag.queue" defaultMessage="Delegates can queue" />
          </i> }}
        />
      </List.Item>
      <List.Item>
        <FormattedMessage 
          id="share.capability.amendments.verbose" 
          defaultMessage="Add and edit amendments on resolutions that have the {flag} flag enabled" 
          values={{ flag: <i>
            <FormattedMessage id="share.flag.amend" defaultMessage="Delegates can amend" />
          </i> }}
        />
      </List.Item>
      <List.Item>
        <FormattedMessage 
          id="share.capability.motions.verbose" 
          defaultMessage="Propose motions that have the {flag} flag enabled" 
          values={{ flag: <i>
            <FormattedMessage id="share.flag.propose" defaultMessage="Delegates can propose motions" />
          </i> }}
        />
      </List.Item>
      <List.Item>
        <FormattedMessage 
          id="share.capability.votes.verbose" 
          defaultMessage="Vote on motions that have the {flag} flag enabled" 
          values={{ flag: <i>
            <FormattedMessage id="share.flag.vote" defaultMessage="Delegates can vote on motions" />
          </i> }}
        />
      </List.Item>
      <List.Item>
        <FormattedMessage id="share.capability.strawpolls" defaultMessage="Vote on strawpolls" />
      </List.Item>
    </List>
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
      <Header size='small'>
        <FormattedMessage 
          id="share.strawpoll.title" 
          defaultMessage="Here's the shareable link to your strawpoll" 
        />
      </Header>
      <CopyableText value={url} />
    </Segment>
  );
}

export function MotionsShareHint(props: {
  canVote: boolean;
  canPropose: boolean;
  committeeID: CommitteeID;
}) {
  const hostname = window.location.hostname;
  const { committeeID, canVote, canPropose } = props;
  const url = `${hostname}/committees/${committeeID}/motions`;

  let actionMessageId: string;

  if (canVote && canPropose) {
    actionMessageId = 'share.motions.action.both';
  } else if (canVote) {
    actionMessageId = 'share.motions.action.vote';
  } else if (canPropose) {
    actionMessageId = 'share.motions.action.propose';
  } else {
    actionMessageId = 'share.motions.action.both';
  }

  return (
    <Segment>
      <Header size='small'>
        <FormattedMessage 
          id="share.motions.title" 
          defaultMessage="Here's the shareable link to {action}" 
          values={{ 
            action: <FormattedMessage 
              id={actionMessageId} 
              defaultMessage={
                canVote && canPropose ? 'vote on and propose motions' :
                canVote ? 'vote on motions' :
                canPropose ? 'propose motions' :
                'vote on and propose motions'
              } 
            />
          }}
        />
      </Header>
      <CopyableText value={url} />
    </Segment>
  );
}
