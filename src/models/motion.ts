import {makeSentenceCaseDropdownOption} from "../utils";
import {CaucusID} from "./caucus";
import {VoterID} from "../hooks";
import {Unit} from "./time";
import {ResolutionID} from "./resolution";
import {DropdownItemProps} from "semantic-ui-react";

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

/*export const MOTION_TYPE_OPTIONS = [
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
].map(makeSentenceCaseDropdownOption);*/
export const MOTION_TYPE_OPTIONS: DropdownItemProps[] = [
  {key: MotionType.OpenUnmoderatedCaucus, value: MotionType.OpenUnmoderatedCaucus, text: "Mở phiên thảo luận mở"},
  {key: MotionType.OpenModeratedCaucus, value: MotionType.OpenModeratedCaucus, text: "Mở phiên thảo luận kín"},
  {key: MotionType.ExtendUnmoderatedCaucus, value: MotionType.ExtendUnmoderatedCaucus, text: "Kéo dài thời gian phiên thảo luận mở"},
  {key: MotionType.ExtendModeratedCaucus, value: MotionType.ExtendModeratedCaucus, text: "Kéo dài thời gian phiên thảo luận kín"},
  {key: MotionType.CloseModeratedCaucus, value: MotionType.CloseModeratedCaucus, text: "Đóng phiên thảo luận mở"},
  {key: MotionType.IntroduceDraftResolution, value: MotionType.IntroduceDraftResolution, text: "Giới thiệu dự thảo nghị quyết"},
  {key: MotionType.IntroduceAmendment, value: MotionType.IntroduceAmendment, text: "Giới thiệu chỉnh sửa dự thảo nghị quyết"},
  {key: MotionType.VoteOnResolution, value: MotionType.VoteOnResolution, text: "Biểu quyết thông qua dự thảo nghị quyết"},
  //{key: MotionType.ProposeStrawpoll, value: MotionType.ProposeStrawpoll, text: "Đề xuất Strawpoll"}, // ignored due to unsuitability for Vietnamese MUNs
  //{key: MotionType.SuspendDraftResolutionSpeakersList, value: MotionType.SuspendDraftResolutionSpeakersList, text: "Tạm đóng phiên thảo luận về dự thảo nghị quyết"}, // ignored due to unsuitability for Vietnamese MUNs
  {key: MotionType.OpenDebate, value: MotionType.OpenDebate, text: "Mở phiên họp"},
  {key: MotionType.SuspendDebate, value: MotionType.SuspendDebate, text: "Tạm dừng phiên họp"},
  {key: MotionType.ResumeDebate, value: MotionType.ResumeDebate, text: "Tiếp tục phiên họp"},
  {key: MotionType.CloseDebate, value: MotionType.CloseDebate, text: "Đóng phiên họp"},
  {key: MotionType.ReorderDraftResolutions, value: MotionType.ReorderDraftResolutions, text: "Sắp xếp lại trình tự dự thảo nghị quyết"}, //might not be suitable, kept in anyway
  {key: MotionType.AddWorkingPaper, value: MotionType.AddWorkingPaper, text: "Giới thiệu văn bản làm việc"},
];

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