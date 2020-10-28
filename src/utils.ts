/* eslint-disable no-mixed-operators */
/* eslint-disable eqeqeq */
import { MemberOption } from './constants';
import { MemberID, nameToMemberOption, MemberData } from './components/Member';
import * as _ from 'lodash';
import * as React from 'react';

export function implies(a: boolean, b: boolean) {
  return a ? b : true;
}

export function objectToList<T>(object: Record<string, T>): T[] {
  return Object.keys(object).map(key => object[key]);
}

export function makeDropdownOption(label: string) {
  return { key: label, value: label, text: label };
}

export function makeSentenceCaseDropdownOption(label: string) {
  return { key: label, value: label, text: sentenceCase(label) };
}

export function sentenceCase(CC: string): string {
  const cc = CC.toLowerCase();
  return cc.charAt(0).toUpperCase() + cc.slice(1);
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

export function useLocalStorage(key: any, initialValue: any) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: any) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz"

function randomCharacter() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
} 

export function meetId() {
  return 'xxx-xxx-xxx'.replace(/[x]/g, function(c) {
    return randomCharacter();
  });
}

export function shortMeetId() {
  return 'xxx-xxx'.replace(/[x]/g, function(c) {
    return randomCharacter();
  });
}