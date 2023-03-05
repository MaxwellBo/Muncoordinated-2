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
  Responsive,
  Segment,
  Statistic,
  Sidebar,
  Visibility,
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
      content="SISCONFED"
      inverted
      style={{
        fontSize: mobile ? '2em' : '4em',
        fontWeight: 'normal',
        marginBottom: 0,
        marginTop: mobile ? '1.5em' : '3em',
      }}
    />
    <Header
      as="h2"
      content="Sistema Eletrônico do Conselho Federal do Instituto Atlas"
      inverted
      style={{
        fontSize: mobile ? '1.5em' : '1.7em',
        fontWeight: 'normal',
        marginTop: mobile ? '0.5em' : '1.5em',
      }}
    />
    <br />
    <Button as="a" primary size="huge" href="/onboard" onClick={logClickCreateACommitteeButton}>
      Create a committee
      <Icon name="arrow right" />
    </Button>
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
      // @ts-ignore
      <Responsive {...{ minWidth: Responsive.onlyMobile.maxWidth + 1 }}>
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
      </Responsive>
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
      <Responsive {...Responsive.onlyMobile}>
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
                    <Button as="a" inverted href="/onboard" >Log in</Button>
                    <Button as="a" inverted href="/onboard" style={{ marginLeft: '0.5em' }}>Sign Up</Button>
                  </Menu.Item>
                </Menu>
              </Container>
              <HomepageHeading mobile={true} />
            </Segment>

            {children}
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </Responsive>
    );
  }
}

interface ResponsiveContainerProps {
  children?: React.ReactNode;
}

const ResponsiveContainer = ({ children }: ResponsiveContainerProps) => (
  <React.Fragment>
    <DesktopContainer>{children}</DesktopContainer>
    <MobileContainer>{children}</MobileContainer>
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
        <Segment style={{ padding: '3em 0em' }} vertical>
          <Grid container stackable verticalAlign="middle">
            <Grid.Row>
              <Grid.Column width={8}>
                <Header as="h3" style={{ fontSize: '2em' }}>Collaborative</Header>
                <p style={{ fontSize: '1.33em' }}>
                  Using a shareable link delegates can: <br />
                  <ShareCapabilities />
                </p>
                <p style={{ fontSize: '1.33em' }}>
                  Everyone will see all updates in real-time, without needing to refresh the page. It's like Google Docs, but for MUN.
                </p>
                <p style={{ fontSize: '1.33em' }}>
                 For virtual MUNs, we recommend pairing Muncoordinated with <a href="https://discord.com/">Discord</a>, which allows you to speak, pass notes, &amp; share files and links.
                </p>
                <p style={{ fontSize: '1.33em' }}>
                  If you've got a big committee, multiple directors can manage it at the same time, using the same account.
                </p>
                <Header as="h3" style={{ fontSize: '2em' }}>Backed up to the cloud</Header>
                <p style={{ fontSize: '1.33em' }}>
                  You won't have to worry about data loss ever again. All committee activity is automatically saved to the server, 
                  so you can start sessions with all data available from the day before.
                </p>
              </Grid.Column>
              <Grid.Column floated="right" width={8}>
                <Image
                  bordered
                  rounded
                  size="massive"
                  src="/promo.png"
                />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column width={8}>
                <Header as="h3" style={{ fontSize: '2em' }}>A comprehensive feature set</Header>
                <div style={{ fontSize: '1.33em' }}>
                  Muncoordinated supports: <br />
                  <List as="ul">
                    <List.Item as="li">Moderated and unmoderated caucuses</List.Item>
                    <List.Item as="li">Resolutions and amendments</List.Item>
                    <List.Item as="li">Motions</List.Item>
                    <List.Item as="li">Roll-call voting</List.Item>
                    <List.Item as="li">Custom delegations</List.Item>
                    <List.Item as="li">Strawpolls</List.Item>
                    <List.Item as="li">File uploads</List.Item>
                    <List.Item as="li">Delegate performance statistics</List.Item>
                  </List>
                </div>
                <Header as="h3" style={{ fontSize: '2em' }}>Free and open-source</Header>
                <p style={{ fontSize: '1.33em' }}>
                  All of Muncoordinated's features are available for free, not locked behind paywalls.
                </p>
                <p style={{ fontSize: '1.33em' }}>
                  It's also <a href="https://github.com/MaxwellBo/Muncoordinated-2">open-source</a>, so you're free to customize it to your needs and liking.
                </p>
              </Grid.Column>
              <Grid.Column floated="right" width={8}>
                <Image
                  centered
                  bordered
                  rounded
                  size="medium"
                  src="/mobile6.png"
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        <Segment inverted vertical style={{ padding: '5em 0em' }}>
          <Container>
            <Grid divided inverted stackable>
              <Grid.Row>
                <Grid.Column width={3}>
                  <Header inverted as="h4" content="About" />
                  <List link inverted>
                    <List.Item as="a" href={REPO_LINK}>Source</List.Item>
                    <List.Item
                      as="a"
                      href="https://github.com/MaxwellBo/Muncoordinated-2/blob/master/LICENSE"
                    >
                      License
                    </List.Item>
                  </List>
                </Grid.Column>
                <Grid.Column width={3}>
                  <Header inverted as="h4" content="Services" />
                  <List link inverted>
                    <List.Item as="a" href="https://github.com/MaxwellBo/Muncoordinated-2/discussions">Forum</List.Item>
                    <List.Item as="a" href="https://github.com/MaxwellBo/Muncoordinated-2/issues">Support</List.Item>
                    <List.Item as="a" href="https://www.helpmymun.com/">MUN Resources</List.Item>
                  </List>
                </Grid.Column>
                <Grid.Column width={7}>
                  <Header as="h4" inverted>Info</Header>
                  <p>Made with <span role="img" aria-label="love">💖</span> by <a href="https://github.com/MaxwellBo">Max Bo</a>, 
                  with assistance from the <a href="https://www.facebook.com/UQUNSA/">UQ United Nations Student Association</a>
                  </p>
                  <p>Copyright © 2022</p>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </Segment>
      </ResponsiveContainer>
    );
  }
}
