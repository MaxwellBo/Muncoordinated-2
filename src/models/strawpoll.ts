import firebase from 'firebase/compat/app';
import { shortMeetId } from '../utils';
import { CommitteeID } from './committee';

export enum StrawpollStage {
  Preparing = 'preparing',
  Voting = 'voting',
  Results = 'results',
}

export enum StrawpollType {
  Checkbox = 'checkbox',
  Radio = 'radio',
}

export enum StrawpollMedium {
  Manual = 'manual',
  Link = 'link',
}

export type StrawpollID = string;
export type StrawpollOptionID = string;
export type StrawpollVoteID = string;
export const DEFAULT_STRAWPOLL: StrawpollData = {
  question: 'undefined question',
  stage: StrawpollStage.Preparing,
  type: StrawpollType.Checkbox,
  medium: StrawpollMedium.Link,
  options: {},
  optionsArePublic: false,
};

export interface StrawpollData {
  question: string;
  type: StrawpollType;
  stage: StrawpollStage;
  medium?: StrawpollMedium;
  options?: Record<StrawpollOptionID, StrawpollOptionData>;
  optionsArePublic?: boolean;
}

export interface StrawpollOptionData {
  text: string;
  votes?: Record<StrawpollVoteID, StrawpollVoteData>;
  tally?: number;
}

export const DEFAULT_STRAWPOLL_OPTION: StrawpollOptionData = {
  text: '',
  votes: {},
};

export interface StrawpollVoteData {
  voterID: string;
}

export const putStrawpoll = (
  committeeID: CommitteeID,
  strawpollData: StrawpollData
): firebase.database.Reference => {
  const ref = firebase
    .database()
    .ref('committees')
    .child(committeeID)
    .child('strawpolls')
    .child(shortMeetId());

  ref.set(strawpollData);

  return ref;
};

export const getStrawpollsRef = (committeeID: CommitteeID): firebase.database.Reference => {
  return firebase.database().ref('committees').child(committeeID).child('strawpolls');
};

export const getStrawpollRef = (
  committeeID: CommitteeID,
  strawpollID: StrawpollID
): firebase.database.Reference => {
  return firebase
    .database()
    .ref('committees')
    .child(committeeID)
    .child('strawpolls')
    .child(strawpollID);
};
