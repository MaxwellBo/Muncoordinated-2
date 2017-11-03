import * as React from 'react';
import { Link } from 'react-router-dom';
import * as firebase from 'firebase';
import { MemberData, MemberID } from './Member';
import TimerData from './Timer';

interface Props { }

interface State {
  committees: Map<String, CommitteeData>;
}

type CommitteeID = string;

interface CommitteeData {
  name: String;
  chair: String;
  topic: String;
  members: Map<MemberID, MemberData>;
  caucuses: Map<CaucusID, CaucusData>;
  resolutions: Map<ResolutionID, ResolutionData>;
}

enum CaucusStatus {
  Open = 'Open',
  Closed = 'Closed'
}

type CaucusID = string;

interface CaucusData {
  topic: String;
  status: CaucusStatus;
  speakerTimer: TimerData;
  caucusTimer: TimerData;
  speaking?: SpeakerEvent;
  queue: Map<String, SpeakerEvent>;
  history: Map<String, SpeakerEvent>;
}

enum Stance {
  For = 'For',
  Neutral = 'Neutral',
  Against = 'Against'
}

interface SpeakerEvent {
  who: MemberID;
  stance: Stance;
  duration: number;
}

enum ResolutionStatus {
  Passed = 'Passed',
  Ongoing = 'Ongoing',
  Failed = 'Failed'
}

type ResolutionID = string;

interface ResolutionData {
  proposer: MemberID;
  seconder: MemberID;
  status: ResolutionStatus;
  caucus?: String;
  amendments: Map<AmendmentID, AmendmentData>;
  votes: VotingResults;
}

type AmendmentID = string;

interface AmendmentData {
  proposer: MemberID;
  status: ResolutionStatus;
  text: String;
  caucus: CaucusID;
  votes: VotingResults;
}

interface VotingResults {
  for: Map<String, MemberID>;
  abstaining: Map<String, MemberID>;
  against: Map<String, MemberID>;
}

function CommitteeItem(props: { id: CommitteeID, value: CommitteeData } ) {
  return (
    <div>
      <p>{props.value.name}</p>
      <Link to={'committee/' + props.id}><button>Route</button></Link>
    </div>
  );
}

export default class Welcome extends React.Component<Props, State> {
  // TODO: Rename database field `commitees` to `committees`
  committeesRef = firebase.database().ref('commitees');

  constructor(props: Props) {
    super(props);

    this.state = {
      committees : {} as Map<String, CommitteeData>
    };
  }

  componentDidMount() {
    this.committeesRef.on('value', (committees) => {
      if (committees) {
        this.setState({ committees: committees.val() });
      }
    });
  }

  componentWillUnmount() {
    this.committeesRef.off();
  }

  render() {
    const items = Object.keys(this.state.committees).map(key => 
      <CommitteeItem key={key} id={key} value={this.state.committees[key]} />
    );

    return (
      <div>
        {items}
      </div>
    );
  }
}
