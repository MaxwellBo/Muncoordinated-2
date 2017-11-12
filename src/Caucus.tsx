import * as React from 'react';
import * as firebase from 'firebase';
import { Timer, TimerData, DEFAULT_TIMER } from './Timer';
import { RouteComponentProps } from 'react-router';
import { MemberID } from './Member';
import { CommitteeID, CommitteeData } from './Committee';

interface URLParameters {
  caucusID: CaucusID;
  committeeID: CommitteeID;
}

interface Props extends RouteComponentProps<URLParameters> {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface State {
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

function CaucusMeta(props: { data: CaucusData, fref: firebase.database.Reference }) {
  const makeHandler = (field: string) => (e: React.FormEvent<HTMLInputElement>) =>
  props.fref.child(field).set(e.currentTarget.value);

  // TODO: Make status either a dropdown or a checkbox / on/off slider
  return props.data ? (
    <div>
      <h1>{props.data.name}</h1>
      <input value={props.data.name} onChange={makeHandler('name')} />
      <h3>Topic</h3>
      <input value={props.data.topic} onChange={makeHandler('topic')} />
      <h3>Status</h3>
      <p>{props.data.status}</p>
    </div>
  ) : <p>Loading</p>;
}

function CaucusView(props: { data: CaucusData, fref: firebase.database.Reference }) {
  return (
    <div>
      <CaucusMeta data={props.data} fref={props.fref} />
      <h3>Caucus Timer</h3>
      {/* <Timer fref={this.state.fref.child('caucusTimer')} /> */}
      <h3>Speaker Timer</h3>
      {/* <Timer fref={this.state.fref.child('speakerTimer')} /> */}
    </div>
  );
}

export class Caucus extends React.Component<Props, State> {
  render() {
    const caucusID: CaucusID = this.props.match.params.caucusID;

    return (
      <CaucusView 
        data={this.props.committee.caucuses[caucusID]} 
        fref={this.props.fref.child('caucuses').child(caucusID)} 
      />
    );
  }
}
