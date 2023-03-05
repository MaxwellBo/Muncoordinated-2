import {makeSentenceCaseDropdownOption} from "../utils";
import {CaucusID} from "./caucus";
import {VoterID} from "../hooks";
import {Unit} from "./time";
import {ResolutionID} from "./resolution";

export type MotionID = string;

export enum MotionType {
  OpenUnmoderatedCaucus = 'Questão de Ordem',
  OpenModeratedCaucus = 'Requerimento de Abertura de Discussão',
  ExtendUnmoderatedCaucus = 'Requerimento de Tempo de Líder',
  ExtendModeratedCaucus = 'Requerimento de Rediscussão',
  CloseModeratedCaucus = 'Requerimento de Encerramento de discussão',
  IntroduceDraftResolution = 'Requerimento de Alteração na Pauta',
  IntroduceAmendment = 'Emenda',
  SuspendDraftResolutionSpeakersList = 'Requerimento de Retirada de Pauta',
  VoteOnResolution = 'Requerimento de Votação Nominal',
  OpenDebate = 'Requerimento de Verificação de Quorum',
  SuspendDebate = 'Requerimento de Adiamento de Sessão',
  ResumeDebate = 'Requerimento de Leitura de Proposição',
  CloseDebate = 'Requerimento de Análise nas Comissões',
  ReorderDraftResolutions = 'Requerimento de Cassação de Cadeira',
  ProposeStrawpoll = 'Requerimento de Voto de Inconfidência / Requerimento de Eleição antecipada',
  AddWorkingPaper = 'Requerimento de Análise de Parecer'
}

export enum MotionVote {
  For = 'SIM',
  Abstain = 'ABSTENÇÃO',
  Against = 'NÃO'
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
  speakerDuration: 30,
  speakerUnit: Unit.Seconds,
  caucusDuration: 60,
  caucusUnit: Unit.Seconds,
  type: MotionType.OpenUnmoderatedCaucus, // this will force it to the top of the list
  votes: {}
  // deleted field must not exist for delegates to be able to propose
  // don't blame me, I didn't write the database.rules (badum-tsh)
};