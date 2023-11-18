import { CaucusData } from "./caucus";
import { TimerData } from "./time";

export type IdlePresentationData = {
  type: "idle";
};

export type UnmodPresentationData = {
  type: "unmod";
  data: TimerData;
};

export type ModCaucusPresentationData = {
  type: "mod";
  data?: CaucusData | undefined;
};

export type PresentationData = IdlePresentationData | UnmodPresentationData | ModCaucusPresentationData;
