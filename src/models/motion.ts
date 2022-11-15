import {makeSentenceCaseDropdownOption} from "../utils";
import {CaucusID} from "./caucus";
import {VoterID} from "../hooks";
import {Unit} from "./time";
import {ResolutionID} from "./resolution";

export type MotionID = string;

export enum MotionType {
  OpenUnmoderatedCaucus = 'Open Unmoderated Caucus',
  OpenModeratedCaucus = 'Open Moderated Caucus',
  ExtendUnmoderatedCaucus = 'Extend Unmoderated Caucus',
  ExtendModeratedCaucus = 'Extend Moderated Caucus',
  CloseModeratedCaucus = 'Close Moderated Caucus',
  IntroduceDraftResolution = 'Introduce Draft Resolution',
  IntroduceAmendment = 'Introduce Amendment',
  SuspendDraftResolutionSpeakersList = 'Suspend Draft Resolution Speakers List',
  VoteOnResolution = 'Vote On Resolution',
  OpenDebate = 'Open Debate',
  SuspendDebate = 'Suspend Debate',
  ResumeDebate = 'Resume Debate',
  CloseDebate = 'Close Debate',
  ReorderDraftResolutions = 'Reorder Draft Resolutions',
  ProposeStrawpoll = 'Propose Strawpoll',
  AddWorkingPaper = "Introduce Working Paper"
}

export enum MotionVote {
  For = 'For',
  Abstain = 'Abstaining',
  Against = 'Against'
}

export interface MotionData {
  proposal: string;
  proposer?: string;
  seconder?: string;
  speakerDuration?: number;
  speakerUnit: Unit;
  caucusDuration?: number;
  caucusUnit: Unit;
  type: MotionType;
  caucusTarget?: CaucusID;
  resolutionTarget?: ResolutionID;
  deleted?: boolean;
  votes?: Record<VoterID, MotionVote>
}

export const MOTION_TYPE_OPTIONS = [
  MotionType.OpenUnmoderatedCaucus, // implemented
  MotionType.OpenModeratedCaucus, // implemented
  MotionType.ExtendUnmoderatedCaucus, // partially implemented
  MotionType.ExtendModeratedCaucus, // partially implemented
  MotionType.CloseModeratedCaucus, // implemented
  MotionType.IntroduceDraftResolution, // implemented
  MotionType.IntroduceAmendment, // implemented
  MotionType.VoteOnResolution, // implemented
  MotionType.ProposeStrawpoll, // implemented
  MotionType.SuspendDraftResolutionSpeakersList,
  MotionType.OpenDebate,
  MotionType.SuspendDebate,
  MotionType.ResumeDebate,
  MotionType.CloseDebate,
  MotionType.ReorderDraftResolutions,
  MotionType.AddWorkingPaper,
].map(makeSentenceCaseDropdownOption);

export const DEFAULT_MOTION: MotionData = {
  proposal: '',
  speakerDuration: 60,
  speakerUnit: Unit.Seconds,
  caucusDuration: 10,
  caucusUnit: Unit.Minutes,
  type: MotionType.OpenUnmoderatedCaucus, // this will force it to the top of the list
  votes: {}
  // deleted field must not exist for delegates to be able to propose
  // don't blame me, I didn't write the database.rules (badum-tsh)
};