import { TimerData } from "./time";

export type IdlePresentationData = {
  type: "idle";
};

export type UnmodPresentationData = {
  type: "unmod";
  data: TimerData;
};

export type ModPresentationData = {
  type: "unmod";
  data: any;
};

export type PresentationData = IdlePresentationData | UnmodPresentationData;
