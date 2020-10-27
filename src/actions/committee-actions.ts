import * as firebase from 'firebase/app';
import { CommitteeData, CommitteeID } from '../components/Committee';
import { TimerData, DEFAULT_TIMER } from '../components/Timer';
import { CaucusID } from '../components/Caucus';

export const putCommittee = 
  (committeeID: CommitteeID, committeeData: CommitteeData): firebase.database.Reference => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)

  ref.set(committeeData);

  return ref;
};

// tslint:disable-next-line
export const putUnmodTimer = (committeeID: CommitteeID, timerData: TimerData): Promise<any> => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('timer')
    .set(timerData);

  return ref;
};

// tslint:disable-next-line
const extendTimer = (ref: firebase.database.Reference, seconds: number): Promise<any> => {
  return ref.transaction((timerData: TimerData) => {
      if (timerData) {

        let newRemaining;

        // This is correct, if not a little unclear
        if (timerData.remaining <= 0) {
          newRemaining = seconds;
        } else if (!timerData.ticking) {
          newRemaining = timerData.remaining + seconds;
        } else {
          newRemaining = seconds;
        }

        return { ...DEFAULT_TIMER, remaining: newRemaining };

      } else {
        return timerData;
      }
    });
};

// tslint:disable-next-line
export const extendModTimer = (committeeID: CommitteeID, caucusID: CaucusID, seconds: number): Promise<any> => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('caucuses')
    .child(caucusID)
    .child('caucusTimer');

  return extendTimer(ref, seconds);
};

// tslint:disable-next-line
export const extendUnmodTimer = (committeeID: CommitteeID, seconds: number): Promise<any> => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('timer');

  return extendTimer(ref, seconds);
};