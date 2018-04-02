import * as React from 'react';
import { Button, Segment, Header, List } from 'semantic-ui-react';

export default class Help extends React.PureComponent<{}, {}> {

  renderEdge() {
    return (
      <a href="https://docs.microsoft.com/en-us/microsoft-edge/devtools-guide/console">
        Edge
      </a>
    );
  }

  renderChrome() {
    return (
      <a href="https://developers.google.com/web/tools/chrome-devtools/console/">
        Chrome
      </a>
    );
  }

  renderFirefox() {
    return (
      <a href="https://developer.mozilla.org/en-US/docs/Tools/Web_Console/Opening_the_Web_Console">
        Firefox
      </a>
    );
  }

  render() {
    const { renderEdge, renderFirefox, renderChrome } = this;

    return (
      <div>
        <Header as="h2" attached="top">Keyboard Shortcuts</Header>
        <Segment attached>
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
        <Header as="h2" attached="top">Bug Reporting &amp; Help Requests</Header>
        <Segment attached>
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
              Copy-paste everything from the {renderFirefox()}, {renderChrome()}, or {renderEdge()} developer 
              console debugging logs
            </List.Item>
          </List>
        </Segment>
      </div>
    );
  }
}