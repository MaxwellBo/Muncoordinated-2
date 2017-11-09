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
  topic: String;
  status: CaucusStatus;
  speakerTimer: TimerData;
  caucusTimer: TimerData;
  speaking?: SpeakerEvent;
  queue: Map<String, SpeakerEvent>;
  history: Map<String, SpeakerEvent>;
}

export interface SpeakerEvent {
  who: MemberID;
  stance: Stance;
  duration: number;
}

export class Caucus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const defaultSpeakerEvent = {
      who: '',
      stance: Stance.Neutral,
      duration: 0
    };

    const defaultCaucus = {
      topic: '',
      status: CaucusStatus.Open,
      speakerTimer: DEFAULT_TIMER,
      caucusTimer: DEFAULT_TIMER,
      speaking: defaultSpeakerEvent,
      queue: {} as Map<String, SpeakerEvent>,
      history: {} as Map<String, SpeakerEvent>,
    };

    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const caucusID: CaucusID = this.props.match.params.caucusID;

    this.state = {
      caucus: defaultCaucus,
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
        <p>{this.state.caucus.topic}</p>
      </div>
    );
  }
}
