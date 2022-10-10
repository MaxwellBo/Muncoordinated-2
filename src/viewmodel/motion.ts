import {MotionType} from "../models/motion";
import {sentenceCase} from "../utils";

/**
 * Whether the motion is considered 'procedural' or not.
 *
 * Motions that are procedural cannot be abstained on.
 */
export const procedural = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.OpenUnmoderatedCaucus:
    case MotionType.OpenModeratedCaucus:
    case MotionType.ExtendUnmoderatedCaucus:
    case MotionType.ExtendModeratedCaucus:
    case MotionType.CloseModeratedCaucus:
    case MotionType.OpenDebate:
    case MotionType.SuspendDebate:
    case MotionType.ResumeDebate:
    case MotionType.CloseDebate:
      return true;
    default:
      return false;
  }
};
export const disruptiveness = (motionType: MotionType): number => {
  switch (motionType) {
    case MotionType.ExtendUnmoderatedCaucus:
      return 1;
    case MotionType.ExtendModeratedCaucus:
    case MotionType.CloseModeratedCaucus:
      return 2;
    case MotionType.OpenUnmoderatedCaucus:
      return 4;
    case MotionType.OpenModeratedCaucus:
      return 5;
    case MotionType.ProposeStrawpoll:
      return 6;
    case MotionType.IntroduceDraftResolution:
      return 7;
    case MotionType.IntroduceAmendment:
      return 8;
    case MotionType.SuspendDraftResolutionSpeakersList:
      return 9;
    case MotionType.OpenDebate:
    case MotionType.SuspendDebate:
    case MotionType.ResumeDebate:
    case MotionType.CloseDebate:
    case MotionType.VoteOnResolution:
      return 10;
    case MotionType.ReorderDraftResolutions:
      return 11;
    default:
      return 69; // nice
  }
};
export const actionName = (motionType: MotionType): string => {
  switch (motionType) {
    case MotionType.ExtendUnmoderatedCaucus:
    case MotionType.ExtendModeratedCaucus:
      return 'Extend';
    case MotionType.CloseModeratedCaucus:
    case MotionType.CloseDebate:
      return 'Close';
    case MotionType.OpenUnmoderatedCaucus:
    case MotionType.OpenDebate:
    case MotionType.OpenModeratedCaucus:
      return 'Open';
    case MotionType.IntroduceDraftResolution:
    case MotionType.IntroduceAmendment:
      return 'Introduce';
    case MotionType.SuspendDraftResolutionSpeakersList:
    case MotionType.SuspendDebate:
      return 'Suspend';
    case MotionType.ResumeDebate:
      return 'Resume';
    case MotionType.ReorderDraftResolutions:
      return 'Reorder';
    case MotionType.ProposeStrawpoll:
      return 'Create';
    case MotionType.VoteOnResolution:
      return 'Vote';
    default:
      return 'Enact';
  }
};
export const approvable = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.OpenModeratedCaucus:
    case MotionType.OpenUnmoderatedCaucus:
    case MotionType.IntroduceDraftResolution:
    case MotionType.ExtendUnmoderatedCaucus:
    case MotionType.ExtendModeratedCaucus:
    case MotionType.CloseModeratedCaucus:
    case MotionType.IntroduceAmendment:
    case MotionType.ProposeStrawpoll:
    case MotionType.VoteOnResolution:
      return true;
    default:
      return false;
  }
};
export const hasSpeakers = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.OpenModeratedCaucus:
      return true;
    default:
      return false;
  }
};
export const hasSeconder = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.IntroduceDraftResolution:
      return true;
    default:
      return false;
  }
};
export const hasDetail = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.OpenModeratedCaucus:
    case MotionType.IntroduceDraftResolution:
    case MotionType.IntroduceAmendment:
    case MotionType.ProposeStrawpoll:
      return true;
    default:
      return false;
  }
};
export const hasTextArea = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.IntroduceAmendment:
      return true;
    default:
      return false;
  }
};
export const detailLabel = (motionType: MotionType): string => {
  switch (motionType) {
    case MotionType.OpenModeratedCaucus:
      return 'Topic';
    case MotionType.IntroduceDraftResolution:
      return 'Name';
    case MotionType.IntroduceAmendment:
      return 'Text';
    case MotionType.ProposeStrawpoll:
      return 'Question';
    default:
      return '';
  }
};
export const hasDuration = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.ExtendUnmoderatedCaucus:
    case MotionType.ExtendModeratedCaucus:
    case MotionType.OpenModeratedCaucus:
    case MotionType.OpenUnmoderatedCaucus:
      return true;
    default:
      return false;
  }
};
export const showMotionType = (motionType: MotionType, time: string): string => {
  switch (motionType) {
    case MotionType.ExtendUnmoderatedCaucus:
      return `Extend unmoderated caucus by ${time}`;
    case MotionType.ExtendModeratedCaucus:
      return `Extend moderated caucus by ${time}`;
    case MotionType.OpenModeratedCaucus:
      return `${time} moderated caucus`;
    case MotionType.OpenUnmoderatedCaucus:
      return `${time} unmoderated caucus`;
    default:
      return sentenceCase(motionType ?? 'Unknown type');
  }
};
export const hasCaucusTarget = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.ExtendModeratedCaucus:
    case MotionType.CloseModeratedCaucus:
      return true;
    default:
      return false;
  }
};
export const hasResolutionTarget = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.IntroduceAmendment:
    case MotionType.SuspendDraftResolutionSpeakersList:
    case MotionType.VoteOnResolution:
      return true;
    default:
      return false;
  }
};