import * as firebase from 'firebase';

import { CommitteeID } from '../components/Committee';
import { CaucusData, DEFAULT_CAUCUS } from '../components/Caucus';
import { ResolutionData } from '../components/Resolution';
import { TimerData } from '../components/Timer';
import { SpeakerEvent } from '../components/caucus/SpeakerFeed';

export const postCaucus = (committeID: CommitteeID, caucusData: CaucusData): firebase.database.ThenableReference => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeID)
    .child('caucuses')
    .push();

  ref.set(caucusData);

  return ref;
};

export const postResolution = 
  (committeID: CommitteeID, resolutionData: ResolutionData): 
    firebase.database.ThenableReference => {

  const ref = firebase.database()
    .ref('committees')
    .child(committeID)
    .child('resolutions')
    .push();

  ref.set(resolutionData);

  return ref;
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
}

export const runLifecycle = (lifecycle: Lifecycle) => {
  const { history, speakingData, speaking, timerData, timer, yielding, queueHeadData, queueHead } = lifecycle;

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
      remaining: 60,
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