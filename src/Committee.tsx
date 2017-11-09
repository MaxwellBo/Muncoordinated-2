import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { Route, Link } from 'react-router-dom';
import { MemberData, MemberID } from './Member';
import { CaucusData, CaucusID } from './Caucus';
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
      <p>Committee Meta</p>
      <p>{props.data.name}</p>
      <p>{props.data.chair}</p>
      <p>{props.data.topic}</p>
    </div>
  );
}

function CaucusItem(props: { id: CaucusID, data: CaucusData } ) {
  return (
    <div>
      <p>{props.data.topic}</p>
      <Link to={'committee/' + props.id}><button>Committees</button></Link>
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

    const CommitteeNav = () => (
      <nav>
        <ul>
          <li><Link to={`/committee/${committeeID}/admin`}>Admin</Link></li>
          <li><Link to={`/committee/${committeeID}/caucuses`}>Caucuses</Link></li>
          <li><Link to={`/committee/${committeeID}/report`}>Report</Link></li>
          <li><Link to={`/committee/${committeeID}/resolutions`}>Resolutions</Link></li>
        </ul>
      </nav>
    );

    return (
      <div>
        <CommitteeMeta data={this.state.committee} />
        <CommitteeNav />
        <Route path="/committee/:committeeID/admin" component={CommitteeAdmin} />
      </div>
    );
  }
}
