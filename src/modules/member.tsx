import {COUNTRY_OPTIONS, FlagNames} from '../constants';
import {objectToList} from "../utils";
import * as _ from "lodash";

export enum Rank {
  Veto = 'Presidente',
  Standard = 'Titular',
  NGO = 'Suplente',
  Observer = 'Cargos'
}

export const canVote = (x: MemberData) => (x.rank === Rank.Veto || x.rank === Rank.Standard);
export const nonNGO = (x: MemberData) => (x.rank !== Rank.NGO);

export type MemberID = string;

export interface MemberData {
  name: string;
  present: boolean;
  rank: Rank;
  voting: boolean;
}

export interface MemberOption {
  key: string;
  value: string;
  flag: string;
  text: string;
}

export function parseFlagName(name: string): FlagNames {
  if (FLAG_NAME_SET.has(name)) {
    return name.toLowerCase() as FlagNames;
  } else {
    return 'fm';
  }
}

export function membersToOptions(members: Record<MemberID, MemberData> | undefined): MemberOption[] {
  const options = objectToList(members || {})
    .map(x => nameToMemberOption(x.name));

  return _.sortBy(options, (option: MemberOption) => option.text);
}

export function membersToPresentOptions(members: Record<MemberID, MemberData> | undefined): MemberOption[] {
  const options = objectToList(members || {})
    .filter(x => x.present)
    .map(x => nameToMemberOption(x.name));

  return _.sortBy(options, (option: MemberOption) => option.text);
}

export function nameToMemberOption(name: string): MemberOption {
  if (FLAG_NAME_SET.has(name)) {
    return COUNTRY_OPTIONS.filter(c => c.text === name)[0];
  } else {
    return {key: name, value: name, flag: 'fm', text: name};
  }
}

const FLAG_NAME_SET = new Set(COUNTRY_OPTIONS.map(x => x.text));
