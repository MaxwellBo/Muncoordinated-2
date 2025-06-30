import { DatabaseReference, child, set } from 'firebase/database';
import {CheckboxProps, DropdownProps, TextAreaProps} from 'semantic-ui-react';
import {MemberOption} from "./member";

// Main field handler using modular Firebase API
export function fieldHandler<T>
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
(fref: DatabaseReference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) => {
    const n: number = Number(e.currentTarget.value);

    set(child(fref, field.toString()), n ? n : {});
  };
}

// Main clearable validated number field handler using modular Firebase API  
export function clearableZeroableValidatedNumberFieldHandler<T>
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
(fref: DatabaseReference, field: keyof T) {
  return (event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) =>
    set(child(fref, field.toString()), data.value);
}

export function stateTextAreaHandler<P, S>
(comp: React.Component<P, S>, field: keyof S, target: string) {
  return (event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) =>
    lens(comp, field, target, data.value);
}

export function dropdownHandler<T>
(fref: DatabaseReference, field: keyof T) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    set(child(fref, field.toString()), data.value);
}

export function stateDropdownHandler<P, S>
(comp: React.Component<P, S>, field: keyof S, target: string) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    lens(comp, field, target, data.value);
}

// Main checkbox handler using modular Firebase API
export function checkboxHandler<T>
(fref: DatabaseReference, field: keyof T) {
  return (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) =>
    set(child(fref, field.toString()), data.checked);
}

export function memberDropdownHandler<T>
(fref: DatabaseReference, field: keyof T, memberOptions: MemberOption[]) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    set(child(fref, field.toString()), memberOptions.filter(c => c.value === data.value)[0].text);
}

export function stateMemberDropdownHandler<P, S>
(comp: React.Component<P, S>, field: keyof S, target: string, memberOptions: MemberOption[]) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    lens(comp, field, target, memberOptions.filter(c => c.value === data.value)[0].text);
}