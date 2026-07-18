import {
  COUNTRY_NAME_ALIASES,
  COUNTRY_OPTIONS,
  FlagNames,
  LEGACY_COUNTRY_OPTIONS
} from '../constants';
import {objectToList} from "../utils";
import * as _ from "lodash";

export enum Rank {
  Veto = 'Veto',
  Standard = 'Standard',
  NGO = 'NGO',
  Observer = 'Observer'
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

const COUNTRY_BY_CODE = new Map(
  [...COUNTRY_OPTIONS, ...LEGACY_COUNTRY_OPTIONS].map(option => [option.value, option])
);
const COUNTRY_BY_NAME = new Map(
  [...COUNTRY_OPTIONS, ...LEGACY_COUNTRY_OPTIONS].map(option => [option.text, option])
);

export function nameToCountryOption(name: string): MemberOption | undefined {
  const exactMatch = COUNTRY_BY_NAME.get(name);
  if (exactMatch) {
    return exactMatch;
  }

  const aliasedCode = COUNTRY_NAME_ALIASES[name];
  return aliasedCode ? COUNTRY_BY_CODE.get(aliasedCode) : undefined;
}

export function canonicalCountryName(name: string): string {
  return nameToCountryOption(name)?.text ?? name;
}

export function nameToFlagCode(name: string): FlagNames {
  const option = nameToCountryOption(name);
  if (option) {
    return option.flag as FlagNames;
  }

  // Federated States of Micronesia looks kinda like the UN flag?
  return 'fm';
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
  return nameToCountryOption(name)
    ?? {key: name, value: name, flag: 'fm', text: name};
}
