import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Icon, Message } from 'semantic-ui-react';

interface Props {
  small?: boolean;
}

export default function Loading({ small }: Props) {
  if (small) {
    return <Icon loading name="spinner" />;
  }

  return (
    <Message icon info>
      <Icon name="circle notched" loading />
      <Message.Content>
        <Message.Header>
          <FormattedMessage id="common.loading" defaultMessage="Loading..." />
        </Message.Header>
      </Message.Content>
    </Message>
  );
}