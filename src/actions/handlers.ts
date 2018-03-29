import { TextAreaProps, DropdownProps } from 'semantic-ui-react';

// Ideally we'd be able to give this a type parameter to constrain the field
export function fieldHandler<T>
  (fref: firebase.database.Reference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) =>
    fref.child(field).set(e.currentTarget.value);
}

// oof owie my defensive programming
export function numberFieldHandler<T>
  (fref: firebase.database.Reference, field: keyof T) {
  return (e: React.FormEvent<HTMLInputElement>) => {
    if (Number(e.currentTarget.value)) {
      fref.child(field).set(e.currentTarget.value);
    } else {
      fref.child(field).set(0);
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