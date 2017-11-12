import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { Route, Link } from 'react-router-dom';
import { MemberData, MemberID } from './Member';
import { Caucus, CaucusData, CaucusID, DEFAULT_CAUCUS } from './Caucus';
import { ResolutionData, ResolutionID } from './Resolution';
import CommitteeAdmin from './CommitteeAdmin';

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
    <div>
      <h1>{props.data.name}</h1>
      <input value={props.data.name} onChange={makeHandler('name')} />
      <h3>Chairperson</h3>
      <input value={props.data.chair} onChange={makeHandler('chair')} />
      <h3>Topic</h3>
      <input value={props.data.topic} onChange={makeHandler('topic')} />
    </div>
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

    this.setState({newCaucusName: '', newCaucusTopic: ''});
  }

  render() {
    const committeeID: CommitteeID = this.props.match.params.committeeID;

    const CaucusItem = (props: { id: CaucusID, data: CaucusData }) => {
      // XXX: Might want to share code with CommitteeItem?
      return (
        <div style={{ border: 'solid' }}>
          <h4>Name</h4>
          <p>{props.data.name}</p>
          <h4>Topic</h4>
          <p>{props.data.topic}</p>
          <Link to={`/committees/${committeeID}/caucuses/${props.id}`}><button>Route</button></Link>
          <button onClick={() => this.state.fref.child('caucuses').child(props.id).remove()}>
            Delete
          </button>
        </div>
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

    const Caucuses = () => {
      const caucusItems = Object.keys(this.state.committee.caucuses).map(key =>
        <CaucusItem key={key} id={key} data={this.state.committee.caucuses[key]} />
      );

      return (
        <div>
          <h3>Caucuses</h3>
          {caucusItems}
          <NewCaucusForm />
        </div>
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

    const Nav = () => (
      <nav>
        <ul>
          <li><Link to={`/committees/${committeeID}/admin`}>Admin</Link></li>
          <li><Link to={`/committees/${committeeID}/caucuses`}>Caucuses</Link></li>
          <li><Link to={`/committees/${committeeID}/report`}>Report</Link></li>
          <li><Link to={`/committees/${committeeID}/resolutions`}>Resolutions</Link></li>
        </ul>
      </nav>
    );

    return (
      <div>
        <CommitteeMeta data={this.state.committee} fref={this.state.fref} />
        <Nav />
        <Route exact={true} path="/committees/:committeeID/admin" render={Admin} />
        <Route path="/committees/:committeeID/caucuses" render={Caucuses} />
        <Route path="/committees/:committeeID/caucuses/:caucusID" render={CaucusComponent} />
      </div>
    );
  }
}
