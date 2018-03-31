import * as React from 'react';
import * as firebase from 'firebase';
import { ResolutionStatus, VotingResults, DEFAULT_VOTES } from './Resolution';
import { CaucusID } from './Caucus';
import { MemberID } from './Member';
import { makeDropdownOption } from '../utils';

export enum AmendmentStatus {
  Proposed = 'Proposed',
  Incorporated = 'Incorporated',
  Rejected = 'Rejected'
}

export const AMENDMENT_STATUS_OPTIONS = [
  AmendmentStatus.Proposed,
  AmendmentStatus.Incorporated,
  AmendmentStatus.Rejected
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
  text: ''
};