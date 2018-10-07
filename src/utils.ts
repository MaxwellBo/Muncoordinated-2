import { CountryOption } from './constants';
import { CommitteeData } from './components/Committee';
import { MemberID, nameToCountryOption, MemberData } from './components/Member';
import * as _ from 'lodash';

export function objectToList<T>(object: Map<string, T>): T[] {
  return Object.keys(object).map(key => object[key]);
}

export function makeDropdownOption<T>(x: T) {
  return { key: x, value: x, text: x };
}

export function recoverCountryOptions(committee: CommitteeData | undefined): CountryOption[] {
  if (committee) {
    return membersToOptions(committee.members);
  } else {
    return [];
  }
}

export function membersToOptions(members: Map<MemberID, MemberData> | undefined): CountryOption[] {
  const options = objectToList(members || {} as Map<MemberID, MemberData>)
    .map( x => nameToCountryOption(x.name));

  return _.sortBy(options, (option: CountryOption) => option.text);
}