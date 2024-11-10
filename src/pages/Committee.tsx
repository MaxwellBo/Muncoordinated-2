import * as React from 'react';
import firebase from 'firebase/compat/app';
import {RouteComponentProps} from 'react-router';
import {Route} from 'react-router-dom';
import Caucus from './Caucus';
import Resolution from './Resolution';
import Admin from './Admin';
import {
  Button,
  Container,
  Dropdown,
  Header,
  Icon,
  Input,
  List,
  Menu,
  Segment,
  SemanticICONS,
  Sidebar
} from 'semantic-ui-react';
import {Helmet} from 'react-helmet';
import Stats from './Stats';
import Motions from './Motions';
import Unmod from './Unmod';
import Notes from './Notes';
import Help from './Help';
import {CaucusStatus, DEFAULT_CAUCUS, putCaucus} from '../models/caucus';
import {URLParameters} from '../types';
import Loading from '../components/Loading';
import Footer from '../components/Footer';
import Settings from './Settings';
import Files from './Files';
import {LoginModal} from '../components/auth';
import {CommitteeShareHint} from '../components/share-hints';
import Notifications from '../components/Notifications';
import {DEFAULT_RESOLUTION, putResolution} from '../models/resolution';
import ConnectionStatus from '../components/ConnectionStatus';
import {fieldHandler} from '../modules/handlers';
import {DEFAULT_STRAWPOLL, putStrawpoll} from '../models/strawpoll';
import Strawpoll from './Strawpoll';
import {logClickSetupCommittee} from '../modules/analytics';
import {CommitteeData, CommitteeID, DEFAULT_COMMITTEE} from "../models/committee";
import { createMedia } from '@artsy/fresnel';

interface DesktopContainerProps {
  menu?: React.ReactNode;
  body?: React.ReactNode;
}

interface DesktopContainerState {}

interface MobileContainerProps {
  menu?: React.ReactNode;
  body?: React.ReactNode;
}

interface MobileContainerState {
  sidebarOpened: boolean;
}

interface Props extends RouteComponentProps<URLParameters> {}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
  showPresentationView?: boolean;
}

const CommitteeMedia = createMedia({
  breakpoints: {
    mobile: 320,
    tablet: 768,
    computer: 992,
    largeScreen: 1200,
    widescreen: 1920,
  },
});

const mediaStyles = CommitteeMedia.createMediaStyle();
const { Media, MediaContextProvider } = CommitteeMedia;



class DesktopContainer extends React.Component<
  DesktopContainerProps,
  DesktopContainerState
> {
  render() {
    const { body, menu } = this.props;
    // Semantic-UI-React/src/addons/Responsive/Responsive.js
    return (
      <>
      <style>{mediaStyles}</style>
      <MediaContextProvider>
          <Segment as={Media} basic greaterThanOrEqual="tablet" style={{padding: 0}}>
            <Menu fluid size="small">
              {menu}
            </Menu>
            {body}
          </Segment>
      </MediaContextProvider>
      </>
    );
  }
}

class MobileContainer extends React.Component<
  MobileContainerProps,
  MobileContainerState
> {
  constructor(props: MobileContainerProps) {
    super(props);

    this.state = {
      sidebarOpened: false,
    };
  }

  handlePusherClick = () => {
    const { sidebarOpened } = this.state;

    if (sidebarOpened) {
      this.setState({ sidebarOpened: false });
    }
  };

  handleToggle = () => {
    this.setState({ sidebarOpened: !this.state.sidebarOpened });
  };

  render() {
    const { body, menu } = this.props;
    const { sidebarOpened } = this.state;

    return (
    <>
    <style>{mediaStyles}</style>
    <MediaContextProvider>
      <Segment as={Media} basic at="mobile">
        <Sidebar.Pushable>
          <Sidebar
            as={Menu}
            animation="uncover"
            stackable
            visible={sidebarOpened}
          >
            {menu}
          </Sidebar>

          <Sidebar.Pusher
            dimmed={sidebarOpened}
            onClick={this.handlePusherClick}
            style={{ minHeight: "100vh" }}
          >
            <Menu size="large">
              <Menu.Item onClick={this.handleToggle}>
                <Icon name="sidebar" />
              </Menu.Item>
            </Menu>
            {body}
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </Segment>
    </MediaContextProvider>
    </>
    );
  }
}

interface ResponsiveContainerProps extends RouteComponentProps<URLParameters> {
  children?: React.ReactNode;
  committee?: CommitteeData;
  createPresentationViewFn?: () => any;
}

function ResponsiveNav(props: ResponsiveContainerProps) {
  const committeeID: CommitteeID = props.match.params.committeeID;

  const makeMenuItem = (name: string, icon: SemanticICONS) => {
    const destination = `/committees/${committeeID}/${name.toLowerCase()}`;

    return (
      <Menu.Item
        key={name}
        name={name.toLowerCase()}
        active={props.location.pathname === destination}
        onClick={() => props.history.push(destination)}
        text={name}
        // icon={icon}
      />
    );
  };

  const makeSubmenuButton = (
    name: string,
    icon: SemanticICONS,
    f: () => void
  ) => {
    return (
      <Dropdown.Item
        key={name}
        name={name.toLowerCase()}
        active={false}
        onClick={f}
        icon={icon}
        text={name}
      />
    );
  };

  const makeMenuIcon = (name: string, icon: SemanticICONS) => {
    const destination = `/committees/${committeeID}/${name.toLowerCase()}`;

    return (
      <Menu.Item
        key={name}
        active={props.location.pathname === destination}
        position="right"
        onClick={() => props.history.push(destination)}
        icon={icon}
      />
    );
  };
  const makePresentationButton = () => {
    if (!props.createPresentationViewFn) return <></>;

    return (
      <Menu.Item
        key={"Presentation View"}
        active={false}
        position="right"
        onClick={props.createPresentationViewFn}
        icon={"external alternate"}
      />
    );
  };

  const makeSubmenuItem = (
    id: string,
    name: string,
    description: string | undefined,
    type: "caucuses" | "resolutions" | "strawpolls"
  ) => {
    const destination = `/committees/${committeeID}/${type}/${id}`;

    return (
      <Dropdown.Item
        key={id}
        name={name}
        active={props.location.pathname === destination}
        onClick={() => props.history.push(destination)}
        text={name}
      />
    );
  };

  const pushCaucus = () => {
    const ref = putCaucus(committeeID, DEFAULT_CAUCUS);

    props.history.push(`/committees/${committeeID}/caucuses/${ref.key}`);
  };

  const pushResolution = () => {
    const ref = putResolution(committeeID, DEFAULT_RESOLUTION);

    props.history.push(`/committees/${committeeID}/resolutions/${ref.key}`);
  };

  const pushStrawpoll = () => {
    const ref = putStrawpoll(committeeID, DEFAULT_STRAWPOLL);

    props.history.push(`/committees/${committeeID}/strawpolls/${ref.key}`);
  };

  const renderMenuItems = () => {
    const { committee } = props;

    const caucuses = committee ? committee.caucuses : undefined;
    const resolutions = committee ? committee.resolutions : undefined;
    const strawpolls = committee ? committee.strawpolls : undefined;

    const caucusItems = Object.keys(caucuses || {})
      .filter((key) => caucuses![key].status !== CaucusStatus.Closed)
      .map((key) =>
        makeSubmenuItem(
          key,
          caucuses![key].name,
          caucuses![key].topic,
          "caucuses"
        )
      );

    const resolutionItems = Object.keys(resolutions || {}).map((key) =>
      makeSubmenuItem(key, resolutions![key].name, undefined, "resolutions")
    );

    const strawpollItems = Object.keys(strawpolls || {}).map((key) =>
      makeSubmenuItem(key, strawpolls![key].question, undefined, "strawpolls")
    );

    return (
      <React.Fragment>
        <Menu.Item
          header
          key="header"
          onClick={() => props.history.push(`/committees/${committeeID}`)}
          active={props.location.pathname === `/committees/${committeeID}`}
        >
          {committee ? committee.name : <Loading small />}
        </Menu.Item>
        {makeMenuItem("Setup", "users")}
        {makeMenuItem("Motions", "sort numeric descending")}
        {makeMenuItem("Unmod", "discussions")}
        <Dropdown key="caucuses" item text="Caucuses" loading={!committee}>
          <Dropdown.Menu>
            {makeSubmenuButton("New caucus", "add", pushCaucus)}
            {caucusItems}
          </Dropdown.Menu>
        </Dropdown>
        <Dropdown
          key="resolutions"
          item
          text="Resolutions"
          loading={!committee}
        >
          <Dropdown.Menu>
            {makeSubmenuButton("New resolution", "add", pushResolution)}
            {resolutionItems}
          </Dropdown.Menu>
        </Dropdown>
        <Dropdown key="strawpolls" item text="Strawpolls" loading={!committee}>
          <Dropdown.Menu>
            {makeSubmenuButton("New strawpoll", "add", pushStrawpoll)}
            {strawpollItems}
          </Dropdown.Menu>
        </Dropdown>
        {makeMenuItem("Notes", "sticky note outline")}
        {makeMenuItem("Posts", "file outline")}
        {makeMenuItem("Stats", "chart bar")}
        <Menu.Menu key="icon-submenu" position="right">
          {makePresentationButton()}
          {makeMenuIcon("Settings", "settings")}
          {makeMenuIcon("Help", "help")}
        </Menu.Menu>
        <Menu.Item key="login">
          <LoginModal />
        </Menu.Item>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <DesktopContainer body={props.children} menu={renderMenuItems()} />
      <MobileContainer body={props.children} menu={renderMenuItems()} />
    </React.Fragment>
  );
}

export default class Committee extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const committeeID: CommitteeID = this.props.match.params.committeeID;

    this.state = {
      committeeFref: firebase.database().ref("committees").child(committeeID),
      showPresentationView: false,
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val() });
    }
  };

  createPresentationView() {
    this.setState({
      showPresentationView: true,
    });
  }

  handlePresentationViewDestroyed() {
    this.setState({
      showPresentationView: false,
    });
  }

  componentDidMount() {
    this.state.committeeFref.on("value", this.firebaseCallback);

    if (!window) return;

    window.addEventListener("beforeunload", (e) => {
      this.setState({ showPresentationView: false });
    });
  }

  componentWillUnmount() {
    this.state.committeeFref.off("value", this.firebaseCallback);
  }

  gotoSetup = () => {
    const { committeeID } = this.props.match.params;

    this.props.history.push(`/committees/${committeeID}/setup`);

    logClickSetupCommittee();
  };

  renderAdmin = () => {
    return (
      <Admin
        {...this.props}
        committee={this.state.committee || DEFAULT_COMMITTEE}
        fref={this.state.committeeFref}
      />
    );
  };

  renderWelcome = () => {
    const { committee, committeeFref } = this.state;

    return (
      <Container text style={{ padding: "1em 0em" }}>
        <Helmet>
          <title>{`${committee?.name} - Muncoordinated`}</title>
        </Helmet>
        <Header as="h1">
          <Input
            value={committee ? committee.name : ""}
            onChange={fieldHandler<CommitteeData>(committeeFref, "name")}
            fluid
            error={committee ? !committee.name : false}
            placeholder="Committee name"
          />
        </Header>
        <List>
          <List.Item>
            <Input
              label="Topic"
              value={committee ? committee.topic : ""}
              onChange={fieldHandler<CommitteeData>(committeeFref, "topic")}
              fluid
              loading={!committee}
              placeholder="Committee topic"
            />
          </List.Item>
          <List.Item>
            <Input
              label="Conference"
              value={committee ? committee.conference || "" : ""}
              onChange={fieldHandler<CommitteeData>(
                committeeFref,
                "conference"
              )}
              fluid
              loading={!committee}
              placeholder="Conference name"
            />
          </List.Item>
        </List>
        <CommitteeShareHint committeeID={this.props.match.params.committeeID} />
        <Segment textAlign="center" basic style={{padding: 0}}>
          <Button as="a" primary size="large" onClick={this.gotoSetup}>
            Setup committee
            <Icon name="arrow right" />
          </Button>
        </Segment>
      </Container>
    );
  };

  render() {
    const { renderAdmin, renderWelcome } = this;

    return (
      <React.Fragment>
        <Notifications {...this.props} />
        <ResponsiveNav
          {...this.props}
          committee={this.state.committee}
          createPresentationViewFn={() => this.createPresentationView()}
        >
          <Container text>
            <ConnectionStatus />
          </Container>
          <Route
            exact={true}
            path="/committees/:committeeID"
            render={renderWelcome}
          />
          <Route
            exact={true}
            path="/committees/:committeeID/setup"
            render={renderAdmin}
          />
          <Route
            exact={true}
            path="/committees/:committeeID/stats"
            component={Stats}
          />
          <Route
            exact={true}
            path="/committees/:committeeID/unmod"
            component={Unmod}
          />
          <Route
            exact={true}
            path="/committees/:committeeID/motions"
            component={Motions}
          />
          <Route
            exact={true}
            path="/committees/:committeeID/notes"
            component={Notes}
          />
          <Route
            exact={true}
            path="/committees/:committeeID/posts"
            component={Files}
          />
          <Route
            exact={true}
            path="/committees/:committeeID/settings"
            component={Settings}
          />
          <Route
            exact={true}
            path="/committees/:committeeID/help"
            component={Help}
          />
          <Route
            path="/committees/:committeeID/caucuses/:caucusID"
            component={Caucus}
          />
          <Route
            path="/committees/:committeeID/resolutions/:resolutionID/:tab?"
            component={Resolution}
          />
          <Route
            path="/committees/:committeeID/strawpolls/:strawpollID"
            component={Strawpoll}
          />
          <Footer />
          {this.state.showPresentationView ? (
            <Presentation
              onCloseCallback={() => this.handlePresentationViewDestroyed()}
            ></Presentation>
          ) : (
            <></>
          )}
        </ResponsiveNav>
      </React.Fragment>
    );
  }
}
