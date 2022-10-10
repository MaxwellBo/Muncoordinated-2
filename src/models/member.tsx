import { COUNTRY_OPTIONS, FlagNames } from '../constants';

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

const FLAG_NAME_SET = new Set(COUNTRY_OPTIONS.map(x => x.text));

export const parseFlagName = (name: string): FlagNames => {
  if (FLAG_NAME_SET.has(name)) {
    return name.toLowerCase() as FlagNames;
  } else {
    return 'fm';
  }
};

export const nameToMemberOption = (name: string) => {
  if (FLAG_NAME_SET.has(name)) {
    return COUNTRY_OPTIONS.filter(c => c.text === name)[0];
  } else {
    return { key: name, value: name, flag: 'fm', text: name };
  }
};