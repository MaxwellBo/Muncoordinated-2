import * as React from 'react';
import * as firebase from 'firebase';
import { Timer, TimerData, DEFAULT_TIMER } from './Timer';
import { RouteComponentProps } from 'react-router';
import { MemberID } from './Member';
import { CommitteeID } from './Committee';

interface Props extends RouteComponentProps<any> {
}

interface State {
  caucus: CaucusData;
  fref: firebase.database.Reference;
}

export type CaucusID = string;

enum CaucusStatus {
  Open = 'Open',
  Closed = 'Closed'
}

enum Stance {
  For = 'For',
  Neutral = 'Neutral',
  Against = 'Against'
}

export interface CaucusData {
  name: string;
  topic: string;
  status: CaucusStatus;
  speakerTimer: TimerData;
  caucusTimer: TimerData;
  speaking?: SpeakerEvent;
  queue: Map<string, SpeakerEvent>;
  history: Map<string, SpeakerEvent>;
}

export interface SpeakerEvent {
  who: MemberID;
  stance: Stance;
  duration: number;
}

const DEFAULT_SPEAKER_EVENT = {
  who: '',
  stance: Stance.Neutral,
  duration: 0
};

export const DEFAULT_CAUCUS: CaucusData = {
  name: '',
  topic: '',
  status: CaucusStatus.Open,
  speakerTimer: DEFAULT_TIMER,
  caucusTimer: DEFAULT_TIMER,
  speaking: DEFAULT_SPEAKER_EVENT,
  queue: {} as Map<string, SpeakerEvent>,
  history: {} as Map<string, SpeakerEvent>,
};

function CaucusMeta(props: { data: CaucusData, fref: firebase.database.Reference; }) {
  const makeHandler = (field: string) => (e: React.FormEvent<HTMLInputElement>) =>
  props.fref.child(field).set(e.currentTarget.value);

  // TODO: Make status either a dropdown or a checkbox / on/off slider

  return (
    <div>
      <h1>{props.data.name}</h1>
      <input value={props.data.name} onChange={makeHandler('name')} />
      <h3>Topic</h3>
      <input value={props.data.topic} onChange={makeHandler('topic')} />
      <h3>Status</h3>
      <p>{props.data.status}</p>
    </div>
  );
}

export class Caucus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const caucusID: CaucusID = this.props.match.params.caucusID;

    this.state = {
      caucus: DEFAULT_CAUCUS,
      fref: firebase.database().ref('commitees').child(committeeID).child('caucuses').child(caucusID)
    };
  }

  componentDidMount() {
    this.state.fref.on('value', (caucus) => {
      if (caucus) {
        this.setState({ caucus: caucus.val() });
      }
    });
  }

  componentWillReceiveProps(nextProps: Props) {
    // XXX: This is to ensure that if the component is asked to point at a new
    // committee, it tosses away its old ref and makes a new one
    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const oldID: CaucusID = this.props.match.params.caucusID;
    const newID: CaucusID = nextProps.match.params.caucusID;

    if (newID !== oldID) {
      this.state.fref.off();
      const fref = firebase.database().ref('commitees').child(committeeID).child('caucuses').child(newID);
      
      fref.on('value', (caucus) => {
        if (caucus) {
          this.setState({ caucus: caucus.val() });
        }
      });

      this.setState({ fref: fref });
    }
  }

  componentWillUnmount() {
    this.state.fref.off();
  }

  render() {
    return (
      <div>
        <CaucusMeta data={this.state.caucus} fref={this.state.fref} />
        <h3>Caucus Timer</h3>
        {/* <Timer fref={this.state.fref.child('caucusTimer')} /> */}
        <h3>Speaker Timer</h3>
        {/* <Timer fref={this.state.fref.child('speakerTimer')} /> */}
      </div>
    );
  }
}
