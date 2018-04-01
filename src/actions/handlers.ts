import { TextAreaProps, DropdownProps, CheckboxProps } from 'semantic-ui-react';
import { CountryOption } from '../constants';

// Ideally we'd be able to give this a type parameter to constrain the field
export function fieldHandler<T>
  (fref: firebase.database.Reference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) =>
    fref.child(field).set(e.currentTarget.value);
}

export function validatedNumberFieldHandler<T>
  (fref: firebase.database.Reference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) => {
    const n: number = Number(e.currentTarget.value);

    if (n) {
      fref.child(field).set(n);
    } else {
      fref.child(field).set({});
    }
  };
}

export function textAreaHandler<T>
  (fref: firebase.database.Reference, field: keyof T) {
  return (event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) =>
    fref.child(field).set(data.value);
}

export function dropdownHandler<T>
  (fref: firebase.database.Reference, field: keyof T) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    fref.child(field).set(data.value);
}

export function checkboxHandler<T>
  (fref: firebase.database.Reference, field: keyof T) {
  return (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) =>
    fref.child(field).set(data.checked);
}

export function countryDropdownHandler<T>
  (fref: firebase.database.Reference, field: keyof T, countryOptions: CountryOption[]) {
  return (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) =>
    fref.child(field).set(countryOptions.filter(c => c.value === data.value)[0].text);
}