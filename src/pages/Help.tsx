import * as React from 'react';
import { Button, Segment, Header, List, Container } from 'semantic-ui-react';
import { CLIENT_VERSION, VersionLink } from '../components/Footer';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';

export const KEYBOARD_SHORTCUT_LIST = (
  <List>
    <List.Item>
      <Button size="mini">Alt</Button>
      <Button size="mini">N</Button>
      <FormattedMessage id="help.shortcuts.next" defaultMessage="Next speaker" />
    </List.Item>
    <List.Item>
      <Button size="mini">Alt</Button>
      <Button size="mini">S</Button>
      <FormattedMessage id="help.shortcuts.speaker" defaultMessage="Toggle speaker timer" />
    </List.Item>
    <List.Item>
      <Button size="mini">Alt</Button>
      <Button size="mini">C</Button>
      <FormattedMessage id="help.shortcuts.caucus" defaultMessage="Toggle caucus timer" />
    </List.Item>
  </List>
);

export default class Help extends React.PureComponent<{}, {}> {
  gpl = ( 
    <a href="https://github.com/MaxwellBo/Muncoordinated-2/blob/master/LICENSE">
      GNU GPLv3
    </a>
  );

  render() {
    const { gpl } = this;

    return (
      <Container text style={{ padding: '1em 0em' }}>
        <Helmet>
          <title>
            <FormattedMessage id="help.page.title" defaultMessage="Help - Muncoordinated" />
          </title>
        </Helmet>
        <Header as="h3" attached="top">
          <FormattedMessage id="help.shortcuts.title" defaultMessage="Keyboard shortcuts" />
        </Header>
        <Segment attached="bottom">
          {KEYBOARD_SHORTCUT_LIST}
        </Segment>
        <Header as="h3" attached="top">
          <FormattedMessage id="help.bugs.title" defaultMessage="Bug reporting & help requests" />
        </Header>
        <Segment attached="bottom">
          <FormattedMessage id="help.bugs.steps" defaultMessage="In the event that a bug or issue crops up, follow these steps:" />
          <br />
          <List ordered>
            <List.Item>
              <FormattedMessage 
                id="help.bugs.step1" 
                defaultMessage='Create an issue on the {issueLink}. You can also use this for help requests regarding the apps usage.'
                values={{
                  issueLink: (
                    <a href="https://github.com/MaxwellBo/Muncoordinated-2/issues">
                      Muncoordinated issue tracking page
                    </a>
                  )
                }}
              />
            </List.Item>
            <List.Item>
              <FormattedMessage id="help.bugs.step2" defaultMessage="Describe what you intended to do" />
            </List.Item>
            <List.Item>
              <FormattedMessage id="help.bugs.step3" defaultMessage="Describe what happened instead" />
            </List.Item>
            <List.Item>
              <FormattedMessage 
                id="help.bugs.step4" 
                defaultMessage="List the version of the app you're using ({version})"
                values={{ version: <VersionLink version={CLIENT_VERSION} /> }}
              />
            </List.Item>
            <List.Item>
              <FormattedMessage id="help.bugs.step5" defaultMessage="List the time, date, and browser that you were using when this occurred" />
            </List.Item>
          </List>
        </Segment>
        <Header as="h3" attached="top">
          <FormattedMessage id="help.license.title" defaultMessage="License" />
        </Header>
        <Segment attached="bottom">
          <FormattedMessage 
            id="help.license.text" 
            defaultMessage="Muncoordinated is licensed under {gpl}"
            values={{ gpl }}
          />
        </Segment>
        <Header as="h3" attached="top">
          <FormattedMessage id="help.social.title" defaultMessage="Social media" />
        </Header>
        <Segment attached="bottom">
          <FormattedMessage 
            id="help.social.message" 
            defaultMessage='Want to meet likeminded Muncoordinators? Come check out our forum {forumLink}.'
            values={{
              forumLink: (
                <a href="https://github.com/MaxwellBo/Muncoordinated-2/discussions">
                  The Muncoordinator's Discussion Space
                </a>
              )
            }}
          />
        </Segment>
      </Container>
    );
  }
}
