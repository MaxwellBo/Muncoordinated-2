import firebase from 'firebase/compat/app';

import {makeDropdownOption, shortMeetId} from '../utils';
import {CommitteeID} from "./committee";
import {DEFAULT_TIMER, TimerData, Unit} from "./time";
import {DEFAULT_SPEAKER_TIME_SECONDS, DEFAULT_CAUCUS_TIME_SECONDS} from "./constants";

export function recoverUnit(caucus?: CaucusData): Unit {
  return caucus ? (caucus.speakerUnit || Unit.Seconds) : Unit.Seconds;
}

export function recoverDuration(caucus?: CaucusData): number | undefined {
  return caucus
      ? caucus.speakerDuration
          ? caucus.speakerDuration
          : undefined
      : undefined;
}

export type CaucusID = string;

export enum CaucusStatus {
  Open = 'Open',
  Closed = 'Closed'
}

export interface CaucusData {
  name: string;
  topic: string;
  status: CaucusStatus;
  speakerTimer: TimerData;
  speakerDuration?: number; // TODO: Migrate
  speakerUnit?: Unit; // TODO: Migrate
  caucusTimer: TimerData;
  queueIsPublic?: boolean; // TODO: Migrate
  speaking?: SpeakerEvent;
  queue?: Record<string, SpeakerEvent>;
  history?: Record<string, SpeakerEvent>;
}

export const CAUCUS_STATUS_OPTIONS = [
  CaucusStatus.Open,
  CaucusStatus.Closed
].map(makeDropdownOption);

export enum Stance {
  For = 'For',
  Neutral = 'Neutral',
  Against = 'Against'
}

export interface SpeakerEvent {
  who: string;
  stance: Stance;
  duration: number;
}

export const DEFAULT_CAUCUS: CaucusData = {
  name: 'untitled caucus',
  topic: '',
  status: CaucusStatus.Open,
  speakerTimer: {...DEFAULT_TIMER, remaining: DEFAULT_SPEAKER_TIME_SECONDS},
  speakerDuration: DEFAULT_SPEAKER_TIME_SECONDS,
  speakerUnit: Unit.Seconds,
  caucusTimer: {...DEFAULT_TIMER, remaining: DEFAULT_CAUCUS_TIME_SECONDS},
  queueIsPublic: false,
  queue: {} as Record<string, SpeakerEvent>,
  history: {} as Record<string, SpeakerEvent>,
};
export const putCaucus =
  (committeeID: CommitteeID, caucusData: CaucusData): firebase.database.Reference => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('caucuses')
    .child(shortMeetId());

  ref.set(caucusData);

  return ref;
};

export const putSpeaking =
  (committeeID: CommitteeID, caucusID: CaucusID, speaker: SpeakerEvent): Promise<any> => {

  console.debug(speaker);

  return firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('caucuses')
    .child(caucusID)
    .child('speaking')
    .set(speaker);
}

// tslint:disable-next-line
export const closeCaucus = 
  (committeeID: CommitteeID, caucusID: CaucusID): Promise<any> => {
  return firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('caucuses')
    .child(caucusID)
    .child('status')
    .set(CaucusStatus.Closed);
};

export interface Lifecycle {
  history: firebase.database.Reference;
  speakingData?: SpeakerEvent;
  speaking: firebase.database.Reference;
  timerData: TimerData;
  timer: firebase.database.Reference;
  yielding: boolean;
  queueHeadData?: SpeakerEvent;
  queueHead?: firebase.database.Reference;
  timerResetSeconds: number;
}

export const runLifecycle = (lifecycle: Lifecycle) => {
  const { history, speakingData, speaking, timerData, timer, 
    timerResetSeconds, yielding, queueHeadData, queueHead } = lifecycle;

  let additionalYieldTime = 0;

  // Move the person currently speaking into history...
  if (speakingData) {
    history.push().set({ ...speakingData, duration: timerData.elapsed });
    speaking.set(null);

    if (yielding) {
      additionalYieldTime = timerData.remaining;
    }

    timer.update({
      elapsed: 0,
      remaining: timerResetSeconds,
      ticking: false // and stop it
    });
  } // do nothing if no-one is currently speaking

  if (queueHead && queueHeadData) {
    speaking.set({
      ...queueHeadData,
      duration: queueHeadData.duration + additionalYieldTime
    });

    timer.update({
      elapsed: 0,
      remaining: queueHeadData.duration + additionalYieldTime, // load the appropriate time 
      ticking: false // and stop it
    });

    queueHead.set(null);
  }
};
