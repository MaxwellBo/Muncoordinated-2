import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { Route, Link } from 'react-router-dom';
import { MemberData, MemberID } from './Member';
import { Caucus, CaucusData, CaucusID, DEFAULT_CAUCUS } from './Caucus';
import { ResolutionData, ResolutionID } from './Resolution';
import CommitteeAdmin from './CommitteeAdmin';
import { Dropdown, Icon, Input, Menu, Sticky, Grid, Segment } from 'semantic-ui-react';
import Stats from './Stats';
import { MotionID, MotionData } from './Motions';

// FIXME: This is repeatedly declared in every file where URLParameters are needed
export interface URLParameters {
  committeeID: CommitteeID;
  caucusID: CaucusID;
}

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee: CommitteeData;
  fref: firebase.database.Reference;
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
}

function CommitteeMeta(props: { data: CommitteeData, fref: firebase.database.Reference; }) {
  const makeHandler = (field: string) => (e: React.FormEvent<HTMLInputElement>) =>
    props.fref.child(field).set(e.currentTarget.value);

  return (
    <Segment>
      <Input
        value={props.data.name}
        onChange={makeHandler('name')}
        attached="top"
        size="massive"
        fluid
        placeholder="Committee Name"
      />
      <Input 
        value={props.data.topic} 
        onChange={makeHandler('topic')} 
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
  resolutions: {} as Map<ResolutionID, ResolutionData>
};

export default class Committee extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const committeeID: CommitteeID = this.props.match.params.committeeID;

    this.state = {
      committee: DEFAULT_COMMITTEE,
      fref: firebase.database().ref('committees').child(committeeID),
    };
  }

  componentDidMount() {
    this.state.fref.on('value', (committee) => {
      if (committee) {
        this.setState({ committee: committee.val() });
      }
    });
  }

  componentWillUnmount() {
    this.state.fref.off();
  }

  pushCaucus = () => {
    const newCaucus = {
      ...DEFAULT_CAUCUS,
      name: 'Default',
    };

    this.state.fref.child('caucuses').push().set(newCaucus);
  }

  render() {
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
        !caucuses[key].deleted
      ).map(key =>
        <CaucusItem key={key} id={key} data={caucuses[key]} />
      );

      return (
        <Menu fluid vertical size="massive">
          <Menu.Item
            name="admin"
            active={false}
            onClick={() => this.props.history.push(`/committees/${committeeID}/admin`)}
          >
            <Icon name="setting" />
            Admin
          </Menu.Item>
          <Menu.Item
            name="stats"
            active={false}
            onClick={() => this.props.history.push(`/committees/${committeeID}/stats`)}
          >
            <Icon name="bar chart" />
            Stats
          </Menu.Item>
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
        </Menu>
      );
    };

    const CaucusComponent = (props: RouteComponentProps<URLParameters>) => (
      <Caucus
        committee={this.state.committee}
        fref={this.state.fref}
        {...props}
      />
    );

    const Admin = () => <CommitteeAdmin committee={this.state.committee} fref={this.state.fref} />;

    return (
      <div>
        <CommitteeMeta data={this.state.committee} fref={this.state.fref} />
        <Grid>
          <Grid.Column width={4}>
            <Nav />
          </Grid.Column>
          <Grid.Column stretched width={12}>
            <Route exact={true} path="/committees/:committeeID/admin" render={Admin} />
            <Route exact={true} path="/committees/:committeeID/stats" component={Stats} />
            <Route path="/committees/:committeeID/caucuses/:caucusID" render={CaucusComponent} />
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
