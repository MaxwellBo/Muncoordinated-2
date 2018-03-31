import * as firebase from 'firebase';
import { CommitteeID } from '../components/Committee';
import { TimerData } from '../components/Timer';

export const putUnmodTimer = (committeeID: CommitteeID, timerData: TimerData): firebase.Promise<any> => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('timer')
    .set(timerData);

  return ref;
};