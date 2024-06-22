import firebase from 'firebase/compat/app';
import {CheckboxProps, DropdownProps, TextAreaProps} from 'semantic-ui-react';
import {MemberOption} from "./member";
import { DatabaseReference, child, set } from 'firebase/database';

// Ideally we'd be able to give this a type parameter to constrain the field
// This is on its way out as we move away from namespaced firebase API
export function fieldHandler<T>
(fref: firebase.database.Reference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) =>
    fref.child(field.toString()).set(e.currentTarget.value);
}

// This is the same as fieldHandler but for the modular database API
// Eventually everything should be migrated to the modular API and thus use this
export function modularFieldHandler<T>
(fref: DatabaseReference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) =>
  set(child(fref, field.toString()), e.currentTarget.value);
}

function lens<P, S>(comp: React.Component<P, S>, field: keyof S, target: string, value: any) {
  // @ts-ignore
  comp.setState(prevState => {

    // @ts-ignore
    const old: object = prevState[field];

    return {
      [field]: {
        ...old,
        [target]: value
      }
    };
  });
}

export function stateFieldHandler<P, S>
(comp: React.Component<P, S>, field: keyof S, target: string) {
  return (e: React.FormEvent<HTMLInputElement>) =>
    lens(comp, field, target, e.currentTarget.value);
}

export function validatedNumberFieldHandler<T>
(fref: firebase.database.Reference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) => {
    const n: number = Number(e.currentTarget.value);

    fref.child(field.toString()).set(n ? n : {});
  };
}

// Eventually will be fully replaced by modular version
export function clearableZeroableValidatedNumberFieldHandler<T>
(fref: firebase.database.Reference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) => {

    const v = e.currentTarget.value;
    const n: number = Number(e.currentTarget.value);

    let result = {};

    if (v === '') {
      result = {}
    } else if (n) {
      result = n
    } else if (n === 0) {
      result = 0
    }

    fref.child(field.toString()).set(result);
  };
}

// Uses new modular firebase API
export function modularClearableZeroableValidatedNumberFieldHandler<T>
(fref: DatabaseReference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) => {

    const v = e.currentTarget.value;
    const n: number = Number(e.currentTarget.value);

    let result = {};

    if (v === '') {
      result = {}
    } else if (n) {
      result = n
    } else if (n === 0) {
      result = 0
    }

    set(child(fref, field.toString()), result);
  };
}

export function stateValidatedNumberFieldHandler<P, S>
(comp: React.Component<P, S>, field: keyof S, target: string) {
  return (e: React.FormEvent<HTMLInputElement>) => {
    const n: number = Number(e.currentTarget.value);

    lens(comp, field, target, n ? n : null);
  };
}

export function textAreaHandler<T>
(fref: firebase.database.Reference, field: keyof T) {
  return (event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) =>
    fref.child(field.toString()).set(data.value);
}

export function stateTextAreaHandler<P, S>
(comp: React.Component<P, S>, field: keyof S, target: string) {
  return (event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) =>
    lens(comp, field, target, data.value);
}

export function dropdownHandler<T>
(fref: firebase.database.Reference, field: keyof T) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    fref.child(field.toString()).set(data.value);
}

export function stateDropdownHandler<P, S>
(comp: React.Component<P, S>, field: keyof S, target: string) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    lens(comp, field, target, data.value);
}

// Uses new modular firebase API
export function modularCheckboxHandler<T>
(fref: DatabaseReference, field: keyof T) {
  return (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) =>
  set(child(fref, field.toString()), data.checked);
}

// Eventually everything should be migrated to the modular API and this will go
export function checkboxHandler<T>
(fref: firebase.database.Reference, field: keyof T) {
  return (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) =>
    fref.child(field.toString()).set(data.checked);
}

export function memberDropdownHandler<T>
(fref: firebase.database.Reference, field: keyof T, memberOptions: MemberOption[]) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    fref.child(field.toString()).set(memberOptions.filter(c => c.value === data.value)[0].text);
}

export function stateMemberDropdownHandler<P, S>
(comp: React.Component<P, S>, field: keyof S, target: string, memberOptions: MemberOption[]) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    lens(comp, field, target, memberOptions.filter(c => c.value === data.value)[0].text);
}