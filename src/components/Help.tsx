import * as React from 'react';
import { Button, Segment, Header, List, Container } from 'semantic-ui-react';

export default class Help extends React.PureComponent<{}, {}> {

  edge = ( 
    <a href="https://docs.microsoft.com/en-us/microsoft-edge/devtools-guide/console">
      Edge
    </a>
  );

  chrome = ( 
    <a href="https://developers.google.com/web/tools/chrome-devtools/console/">
      Chrome
    </a>
  );

  firefox = ( 
    <a href="https://developer.mozilla.org/en-US/docs/Tools/Web_Console/Opening_the_Web_Console">
      Firefox
    </a>
  );

  gpl = ( 
    <a href="https://github.com/MaxwellBo/Muncoordinated-2/blob/master/LICENSE">
      GNU GPLv3
    </a>
  );

  render() {
    const { edge, firefox, chrome, gpl } = this;

    return (
      <Container text>
        <Header as="h3" attached="top">Keyboard Shortcuts</Header>
        <Segment attached="bottom">
          <List>
            <List.Item>
              <Button size="mini">
                Alt
              </Button>
              <Button size="mini">
                N
              </Button>
              Next Speaker
            </List.Item>
            <List.Item>
              <Button size="mini">
                Alt
              </Button>
              <Button size="mini">
                S
              </Button>
              Toggle Speaker Timer
            </List.Item>
            <List.Item>
              <Button size="mini">
                Alt
              </Button>
              <Button size="mini">
                C
              </Button>
              Toggle Caucus Timer
            </List.Item>
          </List>
        </Segment>
        <Header as="h3" attached="top">Bug Reporting &amp; Help Requests</Header>
        <Segment attached="bottom">
          In the likely event that a bug crops up, follow these steps:
          <br />
          <List ordered>
            <List.Item>
              Create an issue on the <a href="https://github.com/MaxwellBo/Muncoordinated-2/issues">
                Muncoordinated issue tracking page
              </a>. You can also use this for help requests regarding the apps usage
            </List.Item>
            <List.Item>
              Describe what you intended to do
            </List.Item>
            <List.Item>
              Describe what happened instead 
            </List.Item>
            <List.Item>
              List the browser you are using
            </List.Item>
            <List.Item>
              List the version of the app you're using (displayed under the sidebar)
            </List.Item>
            <List.Item>
              Copy-paste everything from the {firefox}, {chrome}, or {edge} developer 
              console debugging logs
            </List.Item>
          </List>
          <br />
          If you're at an Australian MUN, I'll see if I can push a fix within the hour
        </Segment>
        <Header as="h3" attached="top">License</Header>
        <Segment attached="bottom">
          Muncoordinated is licensed under {gpl}
        </Segment>
      </Container>
    );
  }
}