import * as firebase from 'firebase';

import { CommitteeID } from '../components/Committee';
import { CaucusData, DEFAULT_CAUCUS } from '../components/Caucus';

export const postCaucus = (committeID: CommitteeID, caucusData: CaucusData) => {
  return firebase.database()
    .ref('committees')
    .child(committeID)
    .child('caucuses')
    .push()
    .set(caucusData);
};