import {DropdownItemProps} from "semantic-ui-react";
import {DEFAULT_SPEAKER_TIME_SECONDS} from "./constants";

export enum Unit {
  Minutes = 'min',
  Seconds = 'sec'
}

export function getSeconds(duration: number, unit: Unit): number {
  return duration * (unit === Unit.Minutes ? 60 : 1);
}

/*export const UNIT_OPTIONS = [
  Unit.Seconds,
  Unit.Minutes
].map(makeDropdownOption);*/
export const UNIT_OPTIONS: DropdownItemProps[] = [
  {key: Unit.Seconds, value: Unit.Seconds, text: "giây"},
  {key: Unit.Minutes, value: Unit.Minutes, text: "phút"},
];

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

export function unitLabel(unit?: Unit): string {
  switch (unit) {
    case Unit.Seconds:
      return 'giây';

    case Unit.Minutes:
      return 'phút';

    default:
      return '';
  }
}