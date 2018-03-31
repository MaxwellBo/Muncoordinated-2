import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { Route, Link } from 'react-router-dom';
import { MemberData, MemberID } from './Member';
import { Caucus, CaucusData, CaucusID, DEFAULT_CAUCUS, CaucusStatus } from './Caucus';
import { ResolutionData, ResolutionID } from './Resolution';
import CommitteeAdmin from './CommitteeAdmin';
import { Dropdown, Icon, Input, Menu, Sticky, Grid, Segment, SemanticICONS } from 'semantic-ui-react';
import Stats from './Stats';
import { MotionID, MotionData } from './Motions';
import { TimerData, DEFAULT_TIMER } from './Timer';
import { Unmod } from './Unmod';
import Help from './Help';
import Motions from './Motions';
import { fieldHandler } from '../actions/handlers';
import { postCaucus } from '../actions/caucusActions';
import { URLParameters } from '../types';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee: CommitteeData;
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

function CommitteeMeta(props: { data: CommitteeData, fref: firebase.database.Reference; }) {
  return (
    <Segment>
      <Input
        value={props.data.name}
        onChange={fieldHandler<CommitteeData>(props.fref, 'name')}
        attached="top"
        size="massive"
        fluid
        placeholder="Committee Name"
      />
      <Input 
        value={props.data.topic} 
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
      committee: DEFAULT_COMMITTEE,
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

    const newCaucus = {
      ...DEFAULT_CAUCUS,
      name: 'untitled caucus',
    };

    postCaucus(committeeID, newCaucus);
  }

  makeMenuItem = (name: string, icon: SemanticICONS) => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const caucusID: CaucusID = this.props.match.params.committeeID;

    return (
      <Menu.Item
        name={name.toLowerCase()}
        active={false}
        onClick={() => this.props.history.push(`/committees/${committeeID}/${name.toLowerCase()}`)}
      >
        <Icon name={icon} />
        {name}
      </Menu.Item>
    );
  }

  render() {
    const { makeMenuItem } = this;
    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const caucusID: CommitteeID = this.props.match.params.committeeID;

    const caucuses = this.state.committee.caucuses || {} as Map<CaucusID, CaucusData>;

    const CaucusItem = (props: { id: CaucusID, data: CaucusData }) => {
      return (
        <Menu.Item
          name={props.data.name}
          active={props.id === caucusID}
          onClick={() => this.props.history.push(`/committees/${committeeID}/caucuses/${props.id}`)}
        >
          {props.data.name}
        </Menu.Item>
        // onClick={() => this.state.fref.child('caucuses').child(props.id).remove()
      );
    };

    const Nav = () => {
      const caucusItems = Object.keys(caucuses).filter(key =>
        caucuses[key].status === CaucusStatus.Open.toString() && !caucuses[key].deleted
      ).map(key =>
        <CaucusItem key={key} id={key} data={caucuses[key]} />
      );

      return (
        <Menu fluid vertical size="massive">
          {makeMenuItem('Admin', 'setting')}
          {makeMenuItem('Stats', 'bar chart')}
          {makeMenuItem('Unmod', 'discussions')}
          {makeMenuItem('Motions', 'sort numeric ascending')}
          {/* { makeMenuItem('Voting', 'thumbs up') } */}
          {/* { makeMenuItem('Amendments', 'edit') } */}
          <Menu.Item>
            <Icon name="users" />
            Caucuses
            <Menu.Menu>
              {caucusItems}
              <Menu.Item name="New Caucus" onClick={this.pushCaucus}>
                <Icon name="add" />
                New Caucus
              </Menu.Item>
            </Menu.Menu>
          </Menu.Item>
          {makeMenuItem('Help', 'help')}
        </Menu>
      );
    };

    const CaucusComponent = (props: RouteComponentProps<URLParameters>) => (
      <Caucus
        committee={this.state.committee}
        fref={this.state.committeeFref}
        {...props}
      />
    );

    const Admin = () => <CommitteeAdmin committee={this.state.committee} fref={this.state.committeeFref} />;

    return (
      <div>
        <CommitteeMeta data={this.state.committee} fref={this.state.committeeFref} />
        <Grid>
          <Grid.Column width={4}>
            <Nav />
          </Grid.Column>
          <Grid.Column stretched width={12}>
            <Route exact={true} path="/committees/:committeeID/admin" render={Admin} />
            <Route exact={true} path="/committees/:committeeID/stats" component={Stats} />
            <Route exact={true} path="/committees/:committeeID/unmod" component={Unmod} />
            <Route exact={true} path="/committees/:committeeID/motions" component={Motions} />
            <Route exact={true} path="/committees/:committeeID/help" component={Help} />
            <Route path="/committees/:committeeID/caucuses/:caucusID" render={CaucusComponent} />
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
