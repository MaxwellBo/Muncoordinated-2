import { makeDropdownOption } from '../utils';
import { Form, DropdownProps, Select, Button } from 'semantic-ui-react';
import * as React from 'react';

export enum Unit {
  Minutes = 'min',
  Seconds = 'sec'
}

export const UNIT_OPTIONS = [
  Unit.Seconds,
  Unit.Minutes
].map(makeDropdownOption);

interface Props {
  unitValue: Unit;
  durationValue?: string;
  onUnitChange: (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => void;
  onDurationChange: (event: React.FormEvent<HTMLInputElement>) => void;
  onSet?: () => void;
  label?: string;
}

export class TimerSetter extends React.Component<Props, {}> {
  render() {
    const { props } = this;

    return (
      <Form.Input
        value={props.durationValue || ''}
        placeholder="Duration"
        onChange={props.onDurationChange}
        action
        fluid
        error={!props.durationValue}
        label={props.label}
      >
        <input />
        {/* <Button icon="minus" onClick={this.decrement} />
        <Button icon="plus"  onClick={this.increment} /> */}
        <Select 
          value={props.unitValue} 
          options={UNIT_OPTIONS} 
          compact 
          button 
          onChange={props.onUnitChange} 
        />
        {props.onSet && (<Button onClick={props.onSet}>Set</Button>)}
      </Form.Input>
    );
  }
}