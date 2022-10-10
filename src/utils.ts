/* eslint-disable no-mixed-operators */

/* eslint-disable eqeqeq */

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