import { MemberOption } from './constants';
import { MemberID, nameToMemberOption, MemberData } from './components/Member';
import * as _ from 'lodash';
import { Dictionary } from './types';

export function implies(a: boolean, b: boolean) {
  return a ? b : true;
}

export function objectToList<T>(object: Dictionary<string, T>): T[] {
  return Object.keys(object).map(key => object[key]);
}

export function makeDropdownOption<T>(x: T) {
  return { key: x, value: x, text: x };
}

export function membersToOptions(members: Dictionary<MemberID, MemberData> | undefined): MemberOption[] {
  const options = objectToList(members || {})
    .map(x => nameToMemberOption(x.name));

  return _.sortBy(options, (option: MemberOption) => option.text);
}