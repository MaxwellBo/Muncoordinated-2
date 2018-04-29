import * as React from 'react';
import {
  Button,
  Container,
  Divider,
  Grid,
  Header,
  Icon,
  Image,
  List,
  Menu,
  Responsive,
  Segment,
  Sidebar,
  Visibility,
  Popup
} from 'semantic-ui-react';

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
      content="Muncoordinated"
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
      content="The real-time browser-based Model UN management app"
      inverted
      style={{
        fontSize: mobile ? '1.5em' : '1.7em',
        fontWeight: 'normal',
        marginTop: mobile ? '0.5em' : '1.5em',
      }}
    />
    <Button as="a" primary size="huge" href="/onboard">
      Create a committee
      <Icon name="arrow right" />
    </Button>
  </Container>
);

interface DesktopContainerProps {
  children?: any;

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

    return (
      <Responsive {...Responsive.onlyComputer}>
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
                  <Button as="a" href="/onboard" inverted={!fixed}>Log in</Button>
                  <Button as="a" href="/onboard" inverted={!fixed} primary={fixed} style={{ marginLeft: '0.5em' }}>
                    Sign Up
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
  children?: any;
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
          <Sidebar as={Menu} animation="uncover" inverted vertical visible={sidebarOpened}>
            <Menu.Item as="a" active>Home</Menu.Item>
            <Menu.Item as="a">Log in</Menu.Item>
            <Menu.Item as="a">Sign Up</Menu.Item>
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
  children?: any;
}

const ResponsiveContainer = ({ children }: ResponsiveContainerProps) => (
  <div>
    <DesktopContainer>{children}</DesktopContainer>
    <MobileContainer>{children}</MobileContainer>
  </div>
);

export default class Homepage extends React.Component<{}, {}> {
  render() {
    return (
      <ResponsiveContainer>
        <Segment style={{ padding: '8em 0em' }} vertical>
          <Grid container stackable verticalAlign="middle">
            <Grid.Row>
              <Grid.Column width={8}>
                <Header as="h3" style={{ fontSize: '2em' }}>Real-time</Header>
                <p style={{ fontSize: '1.33em' }}>
                  Muncoordinated tracks and distributes all updates in real-time&nbsp;(like&nbsp;Google&nbsp;Docs),
                  allowing directors to pass delegates a shared link.< br />
                  Delegates may then add themselves to selected speaker's lists.
              </p>
                <Header as="h3" style={{ fontSize: '2em' }}>A stunning feature set</Header>
                <p style={{ fontSize: '1.33em' }}>
                  Muncoordinated supports <br />

                  <List as="ul">
                    <List.Item as="li">Custom delegations</List.Item>
                    <List.Item as="li">Committee statistics</List.Item>
                    <List.Item as="li">Motions</List.Item>
                    <List.Item as="li">Moderated and unmoderated caucuses</List.Item>
                    <Popup
                      trigger={<List.Item as="li">Useful hotkeys</List.Item>}
                      content="Currently implemented hotkeys include 'Next Speaker', 'Toggle Caucus Timer' and 'Toggle Speaker Timer'"
                    />
                    <List.Item as="li">Resolution amendments</List.Item>
                    <List.Item as="li">Roll-call voting</List.Item>
                    <List.Item as="li">Notes</List.Item>
                  </List>
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
            {/* <Grid.Row>
              <Grid.Column textAlign="center">
                <Button size="huge">Check Them Out</Button>
              </Grid.Column>
            </Grid.Row> */}
          </Grid>
        </Segment>
        <Divider
          as="h4"
          className="header"
          horizontal
          style={{ margin: '3em 0em', textTransform: 'uppercase' }}
        >
          Conferences using Muncoordinated
        </Divider>
        <Segment style={{ padding: '0em' }} vertical>
          <Grid celled="internally" columns="equal" stackable>
            <Grid.Row textAlign="center">
              <Grid.Column style={{ paddingBottom: '5em', paddingTop: '5em' }}>
                <Header as="h3" style={{ fontSize: '2em' }}><a href="https://brismun18.com/">Brismun 2018</a></Header>
                {/* <p style={{ fontSize: '1.33em' }}>That is what they all say about us</p> */}
                <Image centered size="small" rounded src="https://scontent-syd2-1.xx.fbcdn.net/v/t1.0-9/22519205_1627627783924172_998223643884382844_n.jpg?_nc_cat=0&oh=ad7fc767f42fcf2d57865c7b927943c1&oe=5B51EFF0" />
              </Grid.Column>
              <Grid.Column style={{ paddingBottom: '5em', paddingTop: '5em' }}>
                <Header as="h3" style={{ fontSize: '2em' }}><a href="https://www.facebook.com/SYDMUN2017/">SydMUN 2017</a></Header>
                <Image centered size="small" rounded src="https://scontent-syd2-1.xx.fbcdn.net/v/t31.0-8/22426346_1760899207277524_7600392921986087577_o.jpg?_nc_cat=0&oh=4b155461263996442285cd325e5ef0c1&oe=5B979DC8" />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        {/* <Segment style={{ padding: '8em 0em' }} vertical>
          <Container text>
            <Header as="h3" style={{ fontSize: '2em' }}>Breaking The Grid, Grabs Your Attention</Header>
            <p style={{ fontSize: '1.33em' }}>
              Instead of focusing on content creation and hard work, we have learned how to master the art of doing
              nothing by providing massive amounts of whitespace and generic content that can seem massive, monolithic
              and worth your attention.
          </p>
            <Button as="a" size="large">Read More</Button>
            <Divider
              as="h4"
              className="header"
              horizontal
              style={{ margin: '3em 0em', textTransform: 'uppercase' }}
            >
              Case Studies
            </Divider>
            <Header as="h3" style={{ fontSize: '2em' }}>Did We Tell You About Our Bananas?</Header>
            <p style={{ fontSize: '1.33em' }}>
              Yes I know you probably disregarded the earlier boasts as non-sequitur filler content, but it's really
              true.
              It took years of gene splicing and combinatory DNA research, but our bananas can really dance.
          </p>
            <Button as="a" size="large">I'm Still Quite Interested</Button>
          </Container>
        </Segment> */}
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
                    {/* <List.Item as="a">Contact Us</List.Item> TODO */}
                  </List>
                </Grid.Column>
                <Grid.Column width={3}>
                  <Header inverted as="h4" content="Services" />
                  <List link inverted>
                    <List.Item as="a" href="https://github.com/MaxwellBo/Muncoordinated-2/issues">Support</List.Item>
                    {/* <List.Item as="a">FAQ</List.Item> TODO*/}
                  </List>
                </Grid.Column>
                <Grid.Column width={7}>
                  <Header as="h4" inverted>Info</Header>
                  <p>Made with 💖 by <a href="https://github.com/MaxwellBo">Max Bo</a></p>
                  <p>Copyright © 2018</p>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </Segment>
      </ResponsiveContainer>
    );
  }
}