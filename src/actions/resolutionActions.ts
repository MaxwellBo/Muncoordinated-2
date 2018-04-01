import * as firebase from 'firebase';
import { MemberData, MemberID } from '../components/Member';
import { ResolutionID, Vote } from '../components/Resolution';
import { CommitteeID } from '../components/Committee';

export const voteOnResolution = (
  committeeID: CommitteeID, 
  resolutionID: ResolutionID,
  memberID: MemberID, 
  vote: Vote
): firebase.Promise<any> => {

  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('resolutions')
    .child(resolutionID)
    .child('votes')
    .child(memberID)
    .set(vote);

  return ref;
};