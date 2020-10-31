import * as firebase from 'firebase/app';
import { MemberID } from '../components/Member';
import { ResolutionID, Vote, ResolutionData } from '../components/Resolution';
import { CommitteeID } from '../components/Committee';
import { AmendmentData } from '../components/Amendment';
import { shortMeetId } from '../utils';

export const voteOnResolution = (
  committeeID: CommitteeID, 
  resolutionID: ResolutionID,
  memberID: MemberID, 
  vote?: Vote
  // tslint:disable-next-line
): Promise<any> => {

  const target = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('resolutions')
    .child(resolutionID)
    .child('votes')
    .child(memberID);

  if (vote) {
    return target.set(vote);
  } else {
    return target.remove();
  }
};

export const putAmendment = (
  committeeID: CommitteeID, 
  resolutionID: ResolutionID,
  amendmentData: AmendmentData, 
): firebase.database.ThenableReference => {

  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('resolutions')
    .child(resolutionID)
    .child('amendments')
    .push();

  ref.set(amendmentData);

  return ref;
};

export const putResolution = 
  (committeeID: CommitteeID, resolutionData: ResolutionData): firebase.database.Reference => {

  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('resolutions')
    .child(shortMeetId());

  ref.set(resolutionData);

  return ref;
};

export const deleteResolution = (
  committeeID: CommitteeID, 
  resolutionID: ResolutionID
  // tslint:disable-next-line
): Promise<any> => {

  return firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('resolutions')
    .child(resolutionID)
    .remove();
};
