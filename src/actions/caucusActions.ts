import * as firebase from 'firebase';

import { CommitteeID } from '../components/Committee';
import { CaucusData, DEFAULT_CAUCUS } from '../components/Caucus';
import { ResolutionData } from '../components/Resolution';

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