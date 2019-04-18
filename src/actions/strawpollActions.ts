import * as firebase from 'firebase/app';
import { StrawpollData, StrawpollID } from '../components/Strawpoll';
import { CommitteeID } from '../components/Committee';

export const putStrawpoll = 
  (committeeID: CommitteeID, strawpollData: StrawpollData): firebase.database.ThenableReference => {

  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('strawpolls')
    .push();

  ref.set(strawpollData);

  return ref;
};

export const getStrawpollsRef = 
  (committeeID: CommitteeID): firebase.database.Reference => {

  return firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('strawpolls')
};

export const getStrawpollRef = 
  (committeeID: CommitteeID, strawpollID: StrawpollID): firebase.database.Reference => {

  return firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('strawpolls')
    .child(strawpollID);
};