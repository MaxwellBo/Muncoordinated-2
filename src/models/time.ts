import {makeDropdownOption} from "../utils";

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