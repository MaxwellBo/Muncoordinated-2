import * as firebase from 'firebase';
import { CommitteeID } from '../components/Committee';
import { TimerData } from '../components/Timer';

// tslint:disable-next-line
export const putUnmodTimer = (committeeID: CommitteeID, timerData: TimerData): Promise<any> => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('timer')
    .set(timerData);

  return ref;
};