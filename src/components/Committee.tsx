import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { Route } from 'react-router-dom';
import { MemberData, MemberID } from './Member';
import Caucus, { CaucusData, CaucusID, DEFAULT_CAUCUS, CaucusStatus } from './Caucus';
import Resolution, { ResolutionData, ResolutionID, DEFAULT_RESOLUTION } from './Resolution';
import Admin from './Admin';
import { Icon, Menu, SemanticICONS, Dropdown, Container, Responsive, Sidebar, Header } from 'semantic-ui-react';
import Stats from './Stats';
import { MotionID, MotionData } from './Motions';
import { TimerData, DEFAULT_TIMER } from './Timer';
import Unmod from './Unmod';
import Notes from './Notes';
import Help from './Help';
import Motions from './Motions';
import { postCaucus } from '../actions/caucusActions';
import { URLParameters } from '../types';
import Loading from './Loading';
import Footer from './Footer';
import Settings, { SettingsData, DEFAULT_SETTINGS } from './Settings';
import Files, { FileID, FileData } from './Files';
import { ModalLogin } from './Auth';
import ShareHint from './ShareHint';
import Notifications from './Notifications';
import { postResolution } from '../actions/resolutionActions';
import ConnectionStatus from './ConnectionStatus';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

export type CommitteeID = string;

export interface CommitteeData {
  name: string;
  chair: string;
  topic: string;
  creatorUid: firebase.UserInfo['uid'];
  members?: Map<MemberID, MemberData>;
  caucuses?: Map<CaucusID, CaucusData>;
  resolutions?: Map<ResolutionID, ResolutionData>;
  motions?: Map<MotionID, MotionData>;
  files?: Map<FileID, FileData>;
  timer: TimerData;
  notes: string;
  settings: SettingsData;
}

export const DEFAULT_COMMITTEE: CommitteeData = {
  name: '',
  chair: '',
  topic: '',
  creatorUid: '',
  members: {} as Map<MemberID, MemberData>,
  caucuses: {} as Map<CaucusID, CaucusData>,
  resolutions: {} as Map<ResolutionID, ResolutionData>,
  files: {} as Map<FileID, FileData>,
  timer: DEFAULT_TIMER,
  notes: '',
  settings: DEFAULT_SETTINGS
};

interface DesktopContainerProps {
  menu?: any;
  body?: any;
}

interface DesktopContainerState {
}

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
    const { body, menu } = this.props;

    // Semantic-UI-React/src/addons/Responsive/Responsive.js
    return (
      // @ts-ignore
      <Responsive {...{ minWidth: Responsive.onlyMobile.maxWidth + 1 }}>
        <Menu fluid size="small">
          {menu}
        </Menu>
      {body}
      </Responsive>
    );
  }
}

interface MobileContainerProps {
  menu?: any;
  body?: any;
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
    const { body, menu } = this.props;
    const { sidebarOpened } = this.state;

    return (
      <Responsive {...Responsive.onlyMobile}>
        <Sidebar.Pushable>
          <Sidebar as={Menu} animation="uncover" stackable visible={sidebarOpened}>
            {menu}
          </Sidebar>

          <Sidebar.Pusher dimmed={sidebarOpened} onClick={this.handlePusherClick} style={{ minHeight: '100vh' }}>
            <Menu size="large">
              <Menu.Item onClick={this.handleToggle}>
                <Icon name="sidebar" />
              </Menu.Item>
            </Menu>
            {body}
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </Responsive>
    );
  }
}

interface ResponsiveContainerProps extends RouteComponentProps<URLParameters> {
  children?: any;
  committee?: CommitteeData;
}

class ResponsiveNav extends React.Component<ResponsiveContainerProps, {}> {
  makeMenuItem = (name: string, icon: SemanticICONS) => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const destination = `/committees/${committeeID}/${name.toLowerCase()}`;

    return (
      <Menu.Item
        key={name}
        name={name.toLowerCase()}
        active={this.props.location.pathname === destination}
        onClick={() => this.props.history.push(destination)}
      >
        {/* <Icon name={icon} /> */}
        {name}
      </Menu.Item>
    );
  }

  makeSubmenuButton = (name: string, icon: SemanticICONS, f: () => void) => {
    return (
      <Dropdown.Item
        key={name}
        name={name.toLowerCase()}
        active={false}
        onClick={f}
      >
        <Icon name={icon} />
        {name}
      </Dropdown.Item>
    );
  }

  makeMenuIcon = (name: string, icon: SemanticICONS) => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const destination = `/committees/${committeeID}/${name.toLowerCase()}`;

    return (
      <Menu.Item
        key={name}
        name={name.toLowerCase()}
        active={this.props.location.pathname === destination}
        position="right"
        onClick={() => this.props.history.push(destination)}
      >
        <Icon name={icon} />
      </Menu.Item>
    );
  }

  makeSubmenuItem = (id: string, name: string, type: 'caucuses' | 'resolutions') => {
    const { committeeID } = this.props.match.params;
    const destination = `/committees/${committeeID}/${type}/${id}`;

    return (
      <Dropdown.Item
        key={id}
        name={name}
        active={this.props.location.pathname === destination}
        onClick={() => this.props.history.push(destination)}
      >
        {name}
      </Dropdown.Item>
    );
  }

  pushCaucus = () => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;

    const newCaucus: CaucusData = {
      ...DEFAULT_CAUCUS,
      name: 'untitled caucus',
    };

    const ref = postCaucus(committeeID, newCaucus);

    this.props.history
      .push(`/committees/${committeeID}/caucuses/${ref.key}`);
  }

  pushResolution = () => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;

    const newResolution: ResolutionData = {
      ...DEFAULT_RESOLUTION,
      name: 'untitled resolution',
    };

    const ref = postResolution(committeeID, newResolution);

    this.props.history
      .push(`/committees/${committeeID}/resolutions/${ref.key}`);
  }

  renderMenuItems = () => {
    const { makeMenuItem, makeSubmenuItem, makeMenuIcon, makeSubmenuButton } = this;
    const { committee } = this.props;

    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const caucuses = committee ? committee.caucuses : undefined;
    const resolutions = committee ? committee.resolutions : undefined;

    // BADCODE: Filter predicate shared with caucus target in motions, also update when changing
    const caucusItems = Object.keys(caucuses || {}).filter(key =>
      caucuses![key].status === CaucusStatus.Open.toString() && !caucuses![key].deleted
    ).map(key =>
      makeSubmenuItem(key, caucuses![key].name, 'caucuses')
    );

    const resolutionItems = Object.keys(resolutions || {}).map(key =>
      makeSubmenuItem(key, resolutions![key].name, 'resolutions')
    );

    // should really be a React.Fragment, but I couldn't be fucked upgrading to 16.2.0
    return (
      [
        (
          <Menu.Item 
            header 
            key="header"
            onClick={() => this.props.history.push(`/committees/${committeeID}`)}
            active={this.props.location.pathname === `/committees/${committeeID}`}
          >
            {committee ? committee.name : <Loading small />}
          </Menu.Item>
        ),
        makeMenuItem('Admin', 'users'),
        makeMenuItem('Motions', 'sort numeric descending'),
        makeMenuItem('Unmod', 'discussions'),
        (
          <Dropdown key="caucuses" item text="Caucuses" loading={!committee} icon={committee ? 'add' : undefined}>
            <Dropdown.Menu>
              {makeSubmenuButton('New caucus', 'add', this.pushCaucus)}
              {caucusItems}
            </Dropdown.Menu>
          </Dropdown>
        ),
        (
          <Dropdown key="resolutions" item text="Resolutions" loading={!committee} icon={committee ? 'add' : undefined}>
            <Dropdown.Menu>
              {makeSubmenuButton('New resolution', 'add', this.pushResolution)}
              {resolutionItems}
            </Dropdown.Menu>
          </Dropdown>
        ),
        makeMenuItem('Notes', 'sticky note outline'),
        makeMenuItem('Files', 'file outline'),
        makeMenuItem('Stats', 'chart bar'),
        (
          <Menu.Menu key="icon-submenu" position="right">
            {makeMenuIcon('Settings', 'settings')}
            {makeMenuIcon('Help', 'help')}
          </Menu.Menu>
        ),
        (
          <Menu.Item key="login">
            <ModalLogin />
          </Menu.Item>
        )
      ]
    );
  }

  render() {
    return (
      <div>
        <DesktopContainer body={this.props.children} menu={this.renderMenuItems()} />
        <MobileContainer body={this.props.children} menu={this.renderMenuItems()} />
      </div>
    );
  }
}

export default class Committee extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const committeeID: CommitteeID = this.props.match.params.committeeID;

    this.state = {
      committeeFref: firebase.database().ref('committees').child(committeeID),
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val() });
    }
  }

  componentDidMount() {
    this.state.committeeFref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    this.state.committeeFref.off('value', this.firebaseCallback);
  }

  renderAdmin = () => {
    return (
      <Admin
        committee={this.state.committee || DEFAULT_COMMITTEE}
        fref={this.state.committeeFref}
      />
    );
  }

  renderWelcome = () => {
    const { committee } = this.state;

    return committee ? (
      <Container text style={{ padding: '1em 0em' }}>
        <Header as="h1" dividing>
          {committee.name}
        </Header>
        <Header as="h2">
          {committee.topic}
        </Header>
        <Header as="h3">
          {committee.chair}
        </Header>
        <ShareHint committeeID={this.props.match.params.committeeID} />
      </Container>
    ) : <Loading />;
  }
    
  render() {
    const { renderAdmin, renderWelcome } = this;

    return (
      <div>
        <Notifications {...this.props} />
        <ResponsiveNav {...this.props} committee={this.state.committee} >
          <Container text>
            <ConnectionStatus />
          </Container>
          <Route exact={true} path="/committees/:committeeID" render={renderWelcome} />
          <Route exact={true} path="/committees/:committeeID/admin" render={renderAdmin} />
          <Route exact={true} path="/committees/:committeeID/stats" component={Stats} />
          <Route exact={true} path="/committees/:committeeID/unmod" component={Unmod} />
          <Route exact={true} path="/committees/:committeeID/motions" component={Motions} />
          <Route exact={true} path="/committees/:committeeID/notes" component={Notes} />
          <Route exact={true} path="/committees/:committeeID/files" component={Files} />
          <Route exact={true} path="/committees/:committeeID/settings" component={Settings} />
          <Route exact={true} path="/committees/:committeeID/help" component={Help} />
          <Route path="/committees/:committeeID/caucuses/:caucusID" component={Caucus} />
          <Route path="/committees/:committeeID/resolutions/:resolutionID" component={Resolution} />
          <Footer />
        </ResponsiveNav>
      </div>
    );
  }
}
