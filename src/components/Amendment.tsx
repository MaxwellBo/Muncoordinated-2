import * as React from 'react';
import * as firebase from 'firebase';
import { ResolutionStatus, VotingResults, DEFAULT_VOTES } from './Resolution';
import { CaucusID } from './Caucus';
import { MemberID } from './Member';

export enum AmendmentStatus {
  Proposed = 'Proposed',
  Accepted = 'Accepted',
  Denied = 'Denied'
}

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
  text: ''
};