import {makeDropdownOption} from "../utils";
import {DEFAULT_SPEAKER_TIME_SECONDS} from "./caucus";

export enum Unit {
  Minutes = 'min',
  Seconds = 'sec'
}

export function getSeconds(duration: number, unit: Unit): number {
  return duration * (unit === Unit.Minutes ? 60 : 1);
}

export const UNIT_OPTIONS = [
  Unit.Seconds,
  Unit.Minutes
].map(makeDropdownOption);

export interface TimerData {
  elapsed: number;
  remaining: number;
  ticking: boolean | number;
}

export const DEFAULT_TIMER = {
  elapsed: 0,
  remaining: DEFAULT_SPEAKER_TIME_SECONDS,
  ticking: false
};