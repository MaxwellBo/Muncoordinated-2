import * as firebase from 'firebase';

import { CommitteeID } from '../components/Committee';
import { CaucusData, DEFAULT_CAUCUS } from '../components/Caucus';

export const postCaucus = (committeID: CommitteeID, caucusData: CaucusData): firebase.database.ThenableReference => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeID)
    .child('caucuses')
    .push();

  ref.set(caucusData);

  return ref;
};