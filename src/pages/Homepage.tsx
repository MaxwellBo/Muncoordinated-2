import * as React from 'react';
import { FormattedMessage } from 'react-intl';
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
      inverted
      style={{
        fontSize: mobile ? '2em' : '4em',
        fontWeight: 'normal',
        marginBottom: 0,
        marginTop: mobile ? '1.5em' : '3em',
      }}
    >
      <FormattedMessage id="home.title" defaultMessage="Muncoordinated" />
    </Header>
    <Header
      as="h2"
      inverted
      style={{
        fontSize: mobile ? '1.5em' : '1.7em',
        fontWeight: 'normal',
        marginTop: mobile ? '0.5em' : '1.5em',
      }}
    >
      <FormattedMessage id="home.subtitle" defaultMessage="The collaborative browser-based Model UN committee management app" />
    </Header>
    <br />
    <Button as="a" primary size="huge" href="/onboard" onClick={logClickCreateACommitteeButton}>
      <FormattedMessage id="home.create.committee" defaultMessage="Create a committee" />
      <Icon name="arrow right" />
    </Button>
    <br />
  </Container>
)

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
                <Menu.Item as="a" active>
                  <FormattedMessage id="nav.home" defaultMessage="Home" />
                </Menu.Item>
                <Menu.Item position="right">
                  <Button as="a" href="/onboard" inverted={!fixed} onClick={logClickLogInButton}>
                    <FormattedMessage id="nav.login" defaultMessage="Log in" />
                  </Button>
                  <Button as="a" href="/onboard" inverted={!fixed} primary={fixed} style={{ marginLeft: '0.5em' }} onClick={logClickSignupButton}>
                    <FormattedMessage id="nav.signup" defaultMessage="Sign up" />
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

// class MobileContainer extends React.Component<MobileContainerProps, MobileContainerState> {
//   constructor(props: MobileContainerProps) {
//     super(props);

//     this.state = {
//       sidebarOpened: false
//     };
//   }

//   handlePusherClick = () => {
//     const { sidebarOpened } = this.state;

//     if (sidebarOpened) {
//       this.setState({ sidebarOpened: false });
//     }
//   }

//   handleToggle = () => {
//     this.setState({ sidebarOpened: !this.state.sidebarOpened });
//   }

//   render() {
//     const { children } = this.props;
//     const { sidebarOpened } = this.state;

//     return (
//       <>
//         <Sidebar.Pushable>
//           <Sidebar as={Menu} animation="push" inverted vertical visible={sidebarOpened}>
//             <Menu.Item as="a" active>Home</Menu.Item>
//             <Menu.Item as="a" href="/onboard">Log in</Menu.Item>
//             <Menu.Item as="a" href="/onboard">Sign up</Menu.Item>
//           </Sidebar>

//           <Sidebar.Pusher dimmed={sidebarOpened} onClick={this.handlePusherClick} style={{ minHeight: '100vh' }}>
//             <Segment inverted textAlign="center" style={{ minHeight: 350, padding: '1em 0em' }} vertical>
//               <Container>
//                 <Menu inverted pointing secondary size="large">
//                   <Menu.Item onClick={this.handleToggle}>
//                     <Icon name="sidebar" />
//                   </Menu.Item>
//                   <Menu.Item position="right">
//                     <Button as="a" inverted href="/onboard" >Log in</Button>
//                     <Button as="a" inverted href="/onboard" style={{ marginLeft: '0.5em' }}>Sign Up</Button>
//                   </Menu.Item>
//                 </Menu>
//               </Container>
//               <HomepageHeading mobile={true} />
//             </Segment>

//             {children}
//           </Sidebar.Pusher>
//         </Sidebar.Pushable>
//         </> 
//     );
//   }
// }

interface ResponsiveContainerProps {
  children?: React.ReactNode;
}

const ResponsiveContainer = ({ children }: ResponsiveContainerProps) => (
  <React.Fragment>
    <DesktopContainer>{children}</DesktopContainer>
    {/* <MobileContainer>{children}</MobileContainer> */}
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
          <Statistic.Label>
            <FormattedMessage id="home.stats.committees" defaultMessage="Committees created" />
          </Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{this.state.delegateNo || <Loading small />}</Statistic.Value>
          <Statistic.Label>
            <FormattedMessage id="home.stats.delegates" defaultMessage="Delegates participating" />
          </Statistic.Label>
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
                <Header as="h3" style={{ fontSize: '2em' }}>
                  <FormattedMessage id="home.collaborative.title" defaultMessage="Collaborative" />
                </Header>
                <p style={{ fontSize: '1.33em' }}>
                  <FormattedMessage id="home.collaborative.realtime" defaultMessage="Everyone will see all updates in real-time, without needing to refresh the page. It's like Google Docs, but for MUN." />
                </p>
                <p style={{ fontSize: '1.33em' }}>
                  <FormattedMessage id="home.collaborative.virtual" defaultMessage="For virtual MUNs, we recommend pairing Muncoordinated with Discord, which allows you to speak, pass notes, & share files and links." />
                </p>
                <p style={{ fontSize: '1.33em' }}>
                  <FormattedMessage id="home.collaborative.directors" defaultMessage="If you've got a big committee, multiple directors can manage it at the same time, using the same account." />
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
                <Header as="h3" style={{ fontSize: '2em' }}>
                  <FormattedMessage id="home.features.title" defaultMessage="A comprehensive feature set" />
                </Header>
                <div style={{ fontSize: '1.33em' }}>
                  <FormattedMessage id="home.features.intro" defaultMessage="Muncoordinated supports:" /><br />
                  <List as="ul">
                    <List.Item as="li">
                      <FormattedMessage id="home.features.list.caucuses" defaultMessage="Moderated and unmoderated caucuses" />
                    </List.Item>
                    <List.Item as="li">
                      <FormattedMessage id="home.features.list.resolutions" defaultMessage="Resolutions and amendments" />
                    </List.Item>
                    <List.Item as="li">
                      <FormattedMessage id="home.features.list.motions" defaultMessage="Motions" />
                    </List.Item>
                    <List.Item as="li">
                      <FormattedMessage id="home.features.list.voting" defaultMessage="Roll-call voting" />
                    </List.Item>
                    <List.Item as="li">
                      <FormattedMessage id="home.features.list.delegations" defaultMessage="Custom delegations" />
                    </List.Item>
                    <List.Item as="li">
                      <FormattedMessage id="home.features.list.strawpolls" defaultMessage="Strawpolls" />
                    </List.Item>
                    <List.Item as="li">
                      <FormattedMessage id="home.features.list.files" defaultMessage="File uploads" />
                    </List.Item>
                    <List.Item as="li">
                      <FormattedMessage id="home.features.list.stats" defaultMessage="Delegate performance statistics" />
                    </List.Item>
                  </List>
                </div>
                <Header as="h3" style={{ fontSize: '2em' }}>
                  <FormattedMessage id="home.opensource.title" defaultMessage="Free and open-source" />
                </Header>
                <p style={{ fontSize: '1.33em' }}>
                  <FormattedMessage id="home.opensource.free" defaultMessage="All of Muncoordinated's features are available for free, not locked behind paywalls." />
                </p>
                <p style={{ fontSize: '1.33em' }}>
                  <FormattedMessage 
                    id="home.opensource.customize" 
                    defaultMessage="It's also {openSourceLink}, so you're free to customize it to your needs and liking."
                    values={{
                      openSourceLink: <a href="https://github.com/MaxwellBo/Muncoordinated-2">open-source</a>
                    }}
                  />
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
                  <Header inverted as="h4">
                    <FormattedMessage id="footer.about" defaultMessage="About" />
                  </Header>
                  <List link inverted>
                    <List.Item as="a" href={REPO_LINK}>
                      <FormattedMessage id="footer.source" defaultMessage="Source" />
                    </List.Item>
                    <List.Item as="a" href="https://github.com/MaxwellBo/Muncoordinated-2/blob/master/LICENSE">
                      <FormattedMessage id="footer.license" defaultMessage="License" />
                    </List.Item>
                  </List>
                </Grid.Column>
                <Grid.Column width={3}>
                  <Header inverted as="h4">
                    <FormattedMessage id="footer.services" defaultMessage="Services" />
                  </Header>
                  <List link inverted>
                    <List.Item as="a" href="https://github.com/MaxwellBo/Muncoordinated-2/discussions">
                      <FormattedMessage id="footer.forum" defaultMessage="Forum" />
                    </List.Item>
                    <List.Item as="a" href="https://github.com/MaxwellBo/Muncoordinated-2/issues">
                      <FormattedMessage id="footer.support" defaultMessage="Support" />
                    </List.Item>
                    <List.Item as="a" href="https://www.helpmymun.com/">
                      <FormattedMessage id="footer.resources" defaultMessage="MUN Resources" />
                    </List.Item>
                  </List>
                </Grid.Column>
                <Grid.Column width={7}>
                  <Header as="h4" inverted>
                    <FormattedMessage id="footer.info" defaultMessage="Info" />
                  </Header>
                  <p>
                    <FormattedMessage 
                      id="footer.made.by" 
                      defaultMessage="Made with {heart} by {maxLink}, with assistance from the {uqLink}"
                      values={{
                        heart: <span role="img" aria-label="love">💖</span>,
                        maxLink: <a href="https://github.com/MaxwellBo">Max Bo</a>,
                        uqLink: <a href="https://www.facebook.com/UQUNSA/">UQ United Nations Student Association</a>
                      }}
                    />
                  </p>
                  <p>
                    <FormattedMessage id="footer.copyright" defaultMessage="Copyright © 2024" />
                  </p>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </Segment>
      </ResponsiveContainer>
    );
  }
}

