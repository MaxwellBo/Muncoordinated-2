import { CountryOption } from './constants';
import { CommitteeData } from './components/Committee';
import { MemberID, nameToCountryOption, MemberData } from './components/Member';

export function objectToList<T>(object: Map<string, T>): T[] {
  return Object.keys(object).map(key => object[key]);
}

export function makeDropdownOption<T>(x: T) {
  return { key: x, value: x, text: x };
}

export function recoverCountryOptions(committee: CommitteeData | undefined): CountryOption[] {
    if (committee) {
      return objectToList(committee.members || {} as Map<MemberID, MemberData>)
        .map(x => nameToCountryOption(x.name));
    }

    return [];
  }