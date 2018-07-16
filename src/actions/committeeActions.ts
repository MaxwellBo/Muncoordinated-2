import * as firebase from 'firebase';
import { CommitteeID } from '../components/Committee';
import { TimerData, DEFAULT_TIMER } from '../components/Timer';

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
export const extendUnmodTimer = (committeeID: CommitteeID, seconds: number): Promise<any> => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('timer')
    .transaction((timerData: TimerData) => {
      if (timerData) {

        let newRemaining;

        if (timerData.remaining <= 0) {
          newRemaining = seconds;
        } else {
          // newRemaining = timerData.remaining + seconds;
          newRemaining = seconds;
        }

        return { ...DEFAULT_TIMER, remaining: newRemaining };

      } else {
        return timerData;
      }
    });

  return ref;
};