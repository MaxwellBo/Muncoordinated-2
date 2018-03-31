import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { Route, Link } from 'react-router-dom';
import { MemberData, MemberID } from './Member';
import { Caucus, CaucusData, CaucusID, DEFAULT_CAUCUS, CaucusStatus } from './Caucus';
import Resolution, { ResolutionData, ResolutionID, DEFAULT_RESOLUTION } from './Resolution';
import CommitteeAdmin from './CommitteeAdmin';
import { Dropdown, Icon, Input, Menu, Sticky, Grid, Segment, SemanticICONS } from 'semantic-ui-react';
import Stats from './Stats';
import { MotionID, MotionData } from './Motions';
import { TimerData, DEFAULT_TIMER } from './Timer';
import { Unmod } from './Unmod';
import Help from './Help';
import Motions from './Motions';
import { fieldHandler } from '../actions/handlers';
import { postCaucus, postResolution } from '../actions/caucusActions';
import { URLParameters } from '../types';
import { Loading } from './Loading';

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
  timer: TimerData;
}

function CommitteeMeta(props: { data?: CommitteeData, fref: firebase.database.Reference; }) {
  const { data } = props;

  return (
    <Segment>
      <Input
        value={data ? data.name : ''}
        loading={!data}
        onChange={fieldHandler<CommitteeData>(props.fref, 'name')}
        attached="top"
        size="massive"
        fluid
        placeholder="Committee Name"
      />
      <Input 
        value={data ? data.topic : ''} 
        loading={!data}
        onChange={fieldHandler<CommitteeData>(props.fref, 'topic')} 
        attached="bottom" 
        fluid 
        placeholder="Committee Topic" 
      />
    </Segment>
  );
}

export const DEFAULT_COMMITTEE: CommitteeData = {
  name: '',
  chair: '',
  topic: '',
  creatorUid: '',
  members: {} as Map<MemberID, MemberData>,
  caucuses: {} as Map<CaucusID, CaucusData>,
  resolutions: {} as Map<ResolutionID, ResolutionData>,
  timer: DEFAULT_TIMER
};

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

  pushCaucus = () => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;

    const newCaucus: CaucusData = {
      ...DEFAULT_CAUCUS,
      name: 'untitled caucus',
    };

    postCaucus(committeeID, newCaucus);
  }

  pushResolution = () => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;

    const newResolution: ResolutionData = {
      ...DEFAULT_RESOLUTION,
      name: 'untitled resolution',
    };

    postResolution(committeeID, newResolution);
  }

  makeMenuItem = (name: string, icon: SemanticICONS) => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const caucusID: CaucusID = this.props.match.params.committeeID;

    return (
      <Menu.Item
        key={name}
        name={name.toLowerCase()}
        active={false}
        onClick={() => this.props.history.push(`/committees/${committeeID}/${name.toLowerCase()}`)}
      >
        <Icon name={icon} />
        {name}
      </Menu.Item>
    );
  }

  makeSubmenuItem = (id: string, name: string, type: 'caucuses' | 'resolutions') => {
    const { committeeID, caucusID, resolutionID } = this.props.match.params;

    let active = false;

    if (type === 'caucuses') {
      active = (id === caucusID);
    } else if (type === 'resolutions') {
      active = (id === resolutionID);
    }

    return (
      <Menu.Item
        key={id}
        name={name}
        active={active}
        onClick={() => this.props.history.push(`/committees/${committeeID}/${type}/${id}`)}
      >
        {name}
      </Menu.Item>
    );
  }

  renderNav = () => {
    const { makeMenuItem, makeSubmenuItem } = this;
    const { committee } = this.state;

    const caucuses = committee ? committee.caucuses : undefined;
    const resolutions = committee ? committee.resolutions : undefined;

    const caucusItems = Object.keys(caucuses || {}).filter(key =>
      caucuses![key].status === CaucusStatus.Open.toString() && !caucuses![key].deleted
    ).map(key =>
      makeSubmenuItem(key, caucuses![key].name, 'caucuses')
    );

    const resolutionItems = Object.keys(resolutions || {}).map(key =>
      makeSubmenuItem(key, resolutions![key].name, 'resolutions')
    );

    return (
      <Menu fluid vertical size="massive">
        {makeMenuItem('Admin', 'setting')}
        {makeMenuItem('Motions', 'sort numeric ascending')}
        {makeMenuItem('Unmod', 'discussions')}
        <Menu.Item>
          <Icon name="users" />
          Caucuses
            <Menu.Menu>
            {!committee && <Loading />}
            {caucusItems}
            <Menu.Item name="New Caucus" onClick={this.pushCaucus}>
              <Icon name="add" />
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>
        <Menu.Item>
          <Icon name="ordered list" />
          Resolutions
            <Menu.Menu>
            {!committee && <Loading />}
            {resolutionItems}
            <Menu.Item name="New Resolution" onClick={this.pushResolution}>
              <Icon name="add" />
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>
        {makeMenuItem('Stats', 'bar chart')}
        {makeMenuItem('Help', 'help')}
      </Menu>
    );
  }

  Admin = () => {
    return (
      <CommitteeAdmin
        committee={this.state.committee || DEFAULT_COMMITTEE}
        fref={this.state.committeeFref}
      />
    );
  }

  CaucusComponent = (props: RouteComponentProps<URLParameters>) => {
    return (
      <Caucus
        committee={this.state.committee || DEFAULT_COMMITTEE}
        fref={this.state.committeeFref}
        {...props}
      />
    );
  }
    
  render() {
    const { renderNav, Admin, CaucusComponent } = this;

    return (
      <div>
        <CommitteeMeta data={this.state.committee} fref={this.state.committeeFref} />
        <Grid>
          <Grid.Column width={4}>
            {renderNav()}
          </Grid.Column>
          <Grid.Column stretched width={12}>
            <Route exact={true} path="/committees/:committeeID/admin" render={Admin} />
            <Route exact={true} path="/committees/:committeeID/stats" component={Stats} />
            <Route exact={true} path="/committees/:committeeID/unmod" component={Unmod} />
            <Route exact={true} path="/committees/:committeeID/motions" component={Motions} />
            <Route exact={true} path="/committees/:committeeID/help" component={Help} />
            <Route path="/committees/:committeeID/caucuses/:caucusID" render={CaucusComponent} />
            <Route path="/committees/:committeeID/resolutions/:resolutionID" component={Resolution} />
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
