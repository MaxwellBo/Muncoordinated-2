import * as React from 'react';
import * as firebase from 'firebase';
import { TimerData, DEFAULT_TIMER } from './Timer';
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

  return (
    <div>
      <h1>{props.data.name}</h1>
      <input value={props.data.name} onChange={makeHandler('name')} />
      <h3>Topic</h3>
      <input value={props.data.topic} onChange={makeHandler('topic')} />
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

  componentWillUnmount() {
    this.state.fref.off();
  }

  render() {
    return (
      <div>
        <CaucusMeta data={this.state.caucus} fref={this.state.fref} />
      </div>
    );
  }
}
