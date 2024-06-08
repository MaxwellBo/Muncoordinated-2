import firebase from 'firebase/compat/app';
import { MemberID } from '../modules/member';
import { makeDropdownOption, shortMeetId } from '../utils';
import { CaucusID } from './caucus';
import { CommitteeID } from './committee';
import { DropdownItemProps } from 'semantic-ui-react';

export enum ResolutionStatus {
  Introduced = 'Introduced',
  Passed = 'Passed',
  Failed = 'Failed',
}

export const RESOLUTION_STATUS_OPTIONS = [
  ResolutionStatus.Introduced,
  ResolutionStatus.Passed,
  ResolutionStatus.Failed,
].map(makeDropdownOption);

export enum Majority {
  Simple = 'Simple majority',
  TwoThirds = 'Two-thirds majority',
  TwoThirdsNoAbstentions = 'Two-thirds majority, ignoring abstentions',
}

export const MAJORITY_OPTIONS: DropdownItemProps[] = [
  { key: Majority.Simple, value: Majority.Simple, text: 'Simple (50%) majority required' },
  { key: Majority.TwoThirds, value: Majority.TwoThirds, text: 'Two-thirds majority required' },
  {
    key: Majority.TwoThirdsNoAbstentions,
    value: Majority.TwoThirdsNoAbstentions,
    text: 'Two-thirds majority required, ignoring abstentions',
  },
];
export type ResolutionID = string;

export interface ResolutionData {
  name: string;
  link: string;
  proposer?: MemberID;
  seconder?: MemberID;
  status: ResolutionStatus;
  caucus?: CaucusID;
  amendments?: Record<AmendmentID, AmendmentData>;
  votes?: Votes;
  amendmentsArePublic?: boolean; // TODO: Migrate
  requiredMajority?: Majority; // TODO: Migrate
}

export enum Vote {
  For = 'For',
  Abstaining = 'Abstaining',
  Against = 'Against',
}

type Votes = Record<string, Vote>;
export const DEFAULT_RESOLUTION: ResolutionData = {
  name: 'untitled resolution',
  link: '',
  status: ResolutionStatus.Introduced,
  amendments: {} as Record<AmendmentID, AmendmentData>,
  votes: {} as Votes,
  amendmentsArePublic: false,
  requiredMajority: Majority.Simple,
};

export const voteOnResolution = (
  committeeID: CommitteeID,
  resolutionID: ResolutionID,
  memberID: MemberID,
  vote?: Vote
  // tslint:disable-next-line
): Promise<any> => {
  const target = firebase
    .database()
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

export enum AmendmentStatus {
  Proposed = 'Proposed',
  Incorporated = 'Incorporated',
  Rejected = 'Rejected',
}

export const AMENDMENT_STATUS_OPTIONS = [
  AmendmentStatus.Proposed,
  AmendmentStatus.Incorporated,
  AmendmentStatus.Rejected,
].map(makeDropdownOption);
export type AmendmentID = string;

export interface AmendmentData {
  proposer: string;
  status: AmendmentStatus;
  text: string;
  caucus?: CaucusID;
}

export const DEFAULT_AMENDMENT = {
  proposer: '',
  status: AmendmentStatus.Proposed,
  text: '',
};

export function recoverLinkedCaucus(amendment?: AmendmentData) {
  return amendment ? amendment.caucus : undefined;
}

export const putAmendment = (
  committeeID: CommitteeID,
  resolutionID: ResolutionID,
  amendmentData: AmendmentData
): firebase.database.ThenableReference => {
  const ref = firebase
    .database()
    .ref('committees')
    .child(committeeID)
    .child('resolutions')
    .child(resolutionID)
    .child('amendments')
    .push();

  ref.set(amendmentData);

  return ref;
};

export const putResolution = (
  committeeID: CommitteeID,
  resolutionData: ResolutionData
): firebase.database.Reference => {
  const ref = firebase
    .database()
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
  return firebase
    .database()
    .ref('committees')
    .child(committeeID)
    .child('resolutions')
    .child(resolutionID)
    .remove();
};
