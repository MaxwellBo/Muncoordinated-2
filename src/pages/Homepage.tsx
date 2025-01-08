import * as React from 'react';
import {
  Button,
  Container,
  Grid,
  Header,
  Icon,
  Image,
  List,
  Menu,
  Segment,
  Statistic,
  Sidebar,
  Visibility,
  ListItem,
} from 'semantic-ui-react';
import { logClickCreateACommitteeButton, logClickLogInButton, logClickSignupButton } from '../modules/analytics';
import Loading from '../components/Loading';
import { ShareCapabilities } from '../components/share-hints';

interface HomepageHeadingProps {
  mobile: boolean;
}

const REPO_LINK = 'https://github.com/MaxwellBo/Muncoordinated-2';

/* eslint-disable react/no-multi-comp */
/* Heads up! HomepageHeading uses inline styling, however it's not the best practice. Use CSS or styled components for
 * such things.
 */
const HomepageHeading = ({ mobile }: HomepageHeadingProps) => (
  <Container text>
    <Header
      as="h1"
      content="QMUN"
      inverted
      style={{
        fontSize: mobile ? '2em' : '4em',
        fontWeight: 'bold',
        marginBottom: 0,
        marginTop: mobile ? '1.5em' : '3em',
      }}
    />
    <br />
    <Grid textAlign="center" vertical>
      <Grid.Column width={5} style={{ marginTop: '-3em' }}>
        <Image
          size="massive"
          rounded
          src="src/images/logo_unyc.png"
        />
      </Grid.Column>
      <Grid.Column width={3}>
        <Image
          size="massive"
          rounded
          src="src/images/logo_qmun.png"
        />
      </Grid.Column>
    </Grid>
    <Header
      as="h2"
      content="Quebec Model United Nations Conference 2025"
      inverted
      style={{
        fontSize: mobile ? '0.5em' : '1.7em',
        fontWeight: 'normal',
        marginTop: mobile ? '0.5em' : '0.5em',
      }}
    />

    <br />
    <Button as="a" primary size="huge" href="/committees/-MEZXMLXacUeaJyXM4zR">
      Hub Committee A
    </Button>
    <Button as="a" primary size="huge" href="/committees/-MT2m3_0wvJdSHeKrk4-">
      Hub Committee B
    </Button>
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
  </Container>
);


interface DesktopContainerProps {
  children?: React.ReactNode;
}

interface DesktopContainerState {
  fixed: boolean;
}

/* Heads up!
 * Neither Semantic UI nor Semantic UI React offer a responsive navbar, however, it can be implemented easily.
 * It can be more complicated, but you can create really flexible markup.
 */

class DesktopContainer extends React.Component<DesktopContainerProps, DesktopContainerState> {
  constructor(props: DesktopContainerProps) {
    super(props);

    this.state = {
      fixed: false
    };
  }

  hideFixedMenu = () => {
    this.setState({ fixed: false });
  }

  showFixedMenu = () => {
    this.setState({ fixed: true });
  }

  render() {
    const { children } = this.props;
    const { fixed } = this.state;

    // Semantic-UI-React/src/addons/Responsive/Responsive.js
    return (
      <>
      {/* @ts-ignore */}
        <Visibility once={false} onBottomPassed={this.showFixedMenu} onBottomPassedReverse={this.hideFixedMenu}>
          <Segment inverted textAlign="center" style={{ minHeight: 700, padding: '1em 0em' }} vertical>
            <Menu
              fixed={fixed ? 'top' : undefined}
              inverted={!fixed}
              pointing={!fixed}
              secondary={!fixed}
              size="large"
            >
              <Container>
              <Menu.Item as="a" active>Home</Menu.Item>
                <Menu.Item as="a" href="/committees/-MEZXMLXacUeaJyXM4zR">QMUN Hub</Menu.Item>

                <Menu.Item as="a" href="/guides">Background Guides</Menu.Item>

                <Menu.Item position="right">
                  <Button as="a" href="/onboard" inverted={!fixed} onClick={logClickLogInButton}>
                    Log in
                  </Button>
                  <Button as="a" href="/onboard" inverted={!fixed} primary={fixed} style={{ marginLeft: '0.5em' }} onClick={logClickSignupButton}>
                    Sign up
                  </Button>
                </Menu.Item>
              </Container>
            </Menu>
            <HomepageHeading mobile={false} />
          </Segment>
        </Visibility>
        {children}
        </>
    );
  }
}

interface MobileContainerProps {
  children?: React.ReactNode;
}

interface MobileContainerState {
  sidebarOpened: boolean;
}

class MobileContainer extends React.Component<MobileContainerProps, MobileContainerState> {
  constructor(props: MobileContainerProps) {
    super(props);

    this.state = {
      sidebarOpened: false
    };
  }

  handlePusherClick = () => {
    const { sidebarOpened } = this.state;

    if (sidebarOpened) {
      this.setState({ sidebarOpened: false });
    }
  }

  handleToggle = () => {
    this.setState({ sidebarOpened: !this.state.sidebarOpened });
  }

  render() {
    const { children } = this.props;
    const { sidebarOpened } = this.state;
  
    return (
      <>
        <Sidebar.Pushable>
          <Sidebar as={Menu} animation="push" inverted vertical visible={sidebarOpened}>
            <Menu.Item as="a" active>Home</Menu.Item>
            <Menu.Item as="a" href="/onboard">Log in</Menu.Item>
            <Menu.Item as="a" href="/onboard">Sign up</Menu.Item>
          </Sidebar>
  
          <Sidebar.Pusher dimmed={sidebarOpened} onClick={this.handlePusherClick} style={{ minHeight: '100vh' }}>
            <Segment inverted textAlign="center" style={{ minHeight: 350, padding: '1em 0em' }} vertical>
              <Container>
                <Menu inverted pointing secondary size="large">
                  <Menu.Item onClick={this.handleToggle}>
                    <Icon name="sidebar" />
                  </Menu.Item>
                  <Menu.Item position="right">
                    <Button as="a" inverted href="/onboard">Log in</Button>
                    <Button as="a" inverted href="/onboard" style={{ marginLeft: '0.5em' }}>Sign Up</Button>
                  </Menu.Item>
                </Menu>
              </Container>
              <HomepageHeading mobile={true} />
            </Segment>
  
            {children}
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </>
    );
  }
}

interface ResponsiveContainerProps {
  children?: React.ReactNode;
}

const ResponsiveContainer = ({ children }: ResponsiveContainerProps) => (
  <React.Fragment>
    <DesktopContainer>{children}</DesktopContainer>
  </React.Fragment>
);

export default class Homepage extends React.Component<{}, { 
  committeeNo?: number,
  delegateNo?: number
}> {
  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  renderStatistics() {
    return (
      <Statistic.Group textAlign="center">
        <Statistic>
          <Statistic.Value>{this.state.committeeNo || <Loading small />}</Statistic.Value>
          <Statistic.Label>Committees created</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{this.state.delegateNo || <Loading small />}</Statistic.Value>
          <Statistic.Label>Delegates participating</Statistic.Label>
        </Statistic>
      </Statistic.Group>
    );
  }

  render() {
    return (
      <ResponsiveContainer>
        <Segment inverted vertical style={{ padding: '5em 0em' }}>
          <Container>
            <Grid divided inverted stackable>
              <Grid.Row>
                <Grid.Column width={5}>
                  <Header inverted as="h4" content="About" />
                  <List link inverted>
                    <List.Item as="a" href={REPO_LINK}>
                      Source
                    </List.Item>
                    <List.Item
                      as="a"
                      href="https://github.com/MaxwellBo/Muncoordinated-2/blob/master/LICENSE"
                    >
                      License
                    </List.Item>
                    <List.Item as="a" href="mailto:unyc.contact@gmail.com">
                      unyc.contact@gmail.com
                    </List.Item>
                  </List>
                  <div style={{ display: 'flex', gap: '1em', marginTop: '1em' }}>
                    <a
                      href="https://www.instagram.com/un.yc/?hl=en"
                    >
                      Instagram
                    </a>
                    <a
                      href="https://www.linkedin.com/company/united-nations-youth-of-canada-unyc/posts/?feedView=all"
                    >
                      LinkedIn
                    </a>
                    <a
                      href="https://www.facebook.com/unyc.contact"
                    >
                      Facebook
                    </a>
                  </div>
                </Grid.Column>
                <Grid.Column width={7}>
                  <Header as="h4" inverted>
                    Info
                  </Header>
                  <p>
                    Made by{' '}
                    <a href="https://github.com/mahangel" >
                      Angelique Mah
                    </a>
                    , adapted from Muncoordinated by{' '}
                    <a href="https://github.com/MaxwellBo" >
                      Max Bo
                    </a>
                  </p>
                  <p>Copyright © 2025 - Published under the GNU license.</p>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </Segment>
      </ResponsiveContainer>
    );
  }
}  