import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { Route, Link } from 'react-router-dom';
import { MemberData, MemberID } from './Member';
import { Caucus, CaucusData, CaucusID } from './Caucus';
import { ResolutionData, ResolutionID } from './Resolution';
import CommitteeAdmin from './CommitteeAdmin';

interface Props extends RouteComponentProps<any> {
}

interface State {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

export type CommitteeID = string;

export interface CommitteeData {
  name: String;
  chair: String;
  topic: String;
  members: Map<MemberID, MemberData>;
  caucuses: Map<CaucusID, CaucusData>;
  resolutions: Map<ResolutionID, ResolutionData>;
}

function CommitteeMeta(props: { data: CommitteeData }) {
  return (
    <div>
      <p>{`name: ${props.data.name}, chairperson: ${props.data.chair}, topic: ${props.data.topic}`}</p>
    </div>
  );
}

export default class Committee extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const defaultCommittee = {
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
      fref: firebase.database().ref('commitees').child(committeeID)
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

  render() {
    const committeeID: CommitteeID = this.props.match.params.committeeID;

    const CaucusItem = (props: { id: CaucusID, data: CaucusData } ) => {
      return (
        <div>
          <p>{props.data.topic}</p>
          <Link to={`/committees/${committeeID}/caucuses/${props.id}`}><button>Route</button></Link>
        </div>
      );
    };
    
    const CommitteeCaucuses = () => {
      const caucusItems = Object.keys(this.state.committee.caucuses).map(key => 
        <CaucusItem key={key} id={key} data={this.state.committee.caucuses[key]} />
      );

      return (
        <div>
          <h3>Caucuses</h3>
          {caucusItems}
        </div>
      );
    };
    
    const CommitteeNav = () => (
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
        <CommitteeMeta data={this.state.committee} />
        <CommitteeNav />
        <Route exact={true} path="/committees/:committeeID/admin" component={CommitteeAdmin} />
        <Route exact={true} path="/committees/:committeeID/caucuses" render={CommitteeCaucuses} />
        <Route path="/committees/:committeeID/caucuses/:caucusID" component={Caucus} />
      </div>
    );
  }
}
