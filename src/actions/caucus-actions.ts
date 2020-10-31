import * as firebase from 'firebase/app';

import { CommitteeID } from '../components/Committee';
import { CaucusData, CaucusID, CaucusStatus } from '../components/Caucus';
import { TimerData } from '../components/Timer';
import { SpeakerEvent } from '../components/caucus/SpeakerFeed';
import { shortMeetId } from '../utils';

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