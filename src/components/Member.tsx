import * as React from 'react';
import * as firebase from 'firebase';
import { Label, Icon, Flag } from 'semantic-ui-react';
import { COUNTRY_OPTIONS } from '../constants';

interface Props { 
  fref: firebase.database.Reference;
}

interface State {
  member: MemberData;
}

export enum Rank {
    Veto = 'Veto',
    Standard = 'Standard',
    NGO = 'NGO',
    Observer = 'Observer'
}

export type MemberID = string;

export interface MemberData {
  name: string;
  present: boolean;
  rank: Rank;
  voting: boolean;
}

const FLAG_NAME_SET = new Set(COUNTRY_OPTIONS.map(x => x.text));

export function parseFlagName(name: string): string {
  if (FLAG_NAME_SET.has(name)) {
    return name.toLowerCase();
  } else {
    return 'fm';
  }
}

export function nameToCountryOption(name: string) {
  if (FLAG_NAME_SET.has(name)) {
    return COUNTRY_OPTIONS.filter(c => c.text === name)[0];
  } else {
    return { key: name, value: name, flag: 'fm', text: name };
  }
}

export const MemberView = (props: { data: MemberData, fref: firebase.database.Reference }) => {
  const makeHandler = (field: string) => (e: React.FormEvent<HTMLInputElement>) =>
    props.fref.child(field).set(e.currentTarget.value);

  // TODO: Make the yes-no displays tick/checkmarks
  // TODO: Make the Rank display a dropdown for the Rank Enum

  return (
    <Label as="a" image size="large" >
      <Flag as="i" name={props.data.name.toLowerCase() as any} />
      {props.data.name}
      {<Label.Detail>Present</Label.Detail>}
      {props.data.present && <Label.Detail>Present</Label.Detail>}
      {props.data.voting && <Label.Detail>Voting</Label.Detail>}
      <Icon name="delete" onClick={() => props.fref.remove()} />
    </Label>
  );
};

const DEFAULT_MEMBER = {
  name: '',
  present: true,
  rank: Rank.Standard,
  voting: true,
  flag: 'fm' // Federated States of Micronesia
};