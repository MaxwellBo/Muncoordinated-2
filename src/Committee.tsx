import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { Route, Link } from 'react-router-dom';
import { MemberData, MemberID } from './Member';
import { Caucus, CaucusData, CaucusID, DEFAULT_CAUCUS } from './Caucus';
import { ResolutionData, ResolutionID } from './Resolution';
import CommitteeAdmin from './CommitteeAdmin';
import { Dropdown, Icon, Input, Menu, Sticky, Grid, Segment } from 'semantic-ui-react';

// FIXME: This is repeatedly declared in every file where URLParameters are needed
interface URLParameters {
  committeeID: CommitteeID;
  caucusID: CaucusID;
}

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee: CommitteeData;
  fref: firebase.database.Reference;
  newCaucusName: CaucusData['name'];
  newCaucusTopic: CaucusData['topic'];
}

export type CommitteeID = string;

export interface CommitteeData {
  name: string;
  chair: string;
  topic: string;
  members: Map<MemberID, MemberData>;
  caucuses: Map<CaucusID, CaucusData>;
  resolutions: Map<ResolutionID, ResolutionData>;
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
      <Input value={props.data.topic} onChange={makeHandler('topic')} attached="bottom" fluid placeholder="Topic"/>
    </Segment>
  );
}

export default class Committee extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const defaultCommittee: CommitteeData = {
      name: '',
      chair: '',
      topic: '',
      members: {} as Map<MemberID, MemberData>,
      caucuses: {} as Map<CaucusID, CaucusData>,
      resolutions: {} as Map<ResolutionID, ResolutionData>
    };

    const committeeID: CommitteeID = this.props.match.params.committeeID;

    this.state = {
      committee: defaultCommittee,
      fref: firebase.database().ref('commitees').child(committeeID),
      newCaucusName: '',
      newCaucusTopic: ''
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
      name: this.state.newCaucusName,
      topic: this.state.newCaucusTopic
    };

    this.state.fref.child('caucuses').push().set(newCaucus);

    this.setState({ newCaucusName: '', newCaucusTopic: '' });
  }

  render() {
    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const caucusID: CommitteeID = this.props.match.params.committeeID;

    const CaucusItem = (props: { id: CaucusID, data: CaucusData }) => {
      return (
        <Link to={`/committees/${committeeID}/caucuses/${props.id}`}>
          <Menu.Item name={props.data.name} active={props.id === caucusID}>
            {props.data.name}
          </Menu.Item>
        </Link>
        // <button onClick={() => this.state.fref.child('caucuses').child(props.id).remove()}>
      );
    };

    const NewCaucusForm = () => {
      const nameHandler = (e: React.FormEvent<HTMLInputElement>) =>
        this.setState({ newCaucusName: e.currentTarget.value });

      const topicHandler = (e: React.FormEvent<HTMLInputElement>) =>
        this.setState({ newCaucusTopic: e.currentTarget.value });

      return (
        <form onSubmit={this.pushCaucus}>
          <label>
            Name:
          <input type="text" value={this.state.newCaucusName} onChange={nameHandler} />
          </label>
          <label>
            Topic:
          <input type="text" value={this.state.newCaucusTopic} onChange={topicHandler} />
          </label>
          <input type="submit" value="Submit" />
        </form>
      );
    };

    const Nav = () => {
      const caucusItems = Object.keys(this.state.committee.caucuses).map(key =>
        <CaucusItem key={key} id={key} data={this.state.committee.caucuses[key]} />
      );

      return (
        <Menu fluid vertical>
          <Link to={`/committees/${committeeID}/admin`}>
            <Menu.Item name="admin" active={false}>
              Admin
            </Menu.Item>
          </Link>
          <Menu.Item>
            Caucuses
            <Menu.Menu>
              {caucusItems}
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
            <Route path="/committees/:committeeID/caucuses/:caucusID" render={CaucusComponent} />
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
