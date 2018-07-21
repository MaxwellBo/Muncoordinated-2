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
  
  isInvalid = () => {
    const { durationValue: n } = this.props;

    return !n || isNaN(Number(n)) || Number(n) <= 0;
  }

  handleOnSet = () => {
    const { props, isInvalid } = this;

    if (props.onSet && !isInvalid()) { // defensive, button shouldn't exist if we don't have it
      props.onSet();
    }
  }

  render() {
    const { props, isInvalid, handleOnSet } = this;

    return (
      <Form.Input
        value={props.durationValue || ''}
        placeholder="Duration"
        onChange={props.onDurationChange}
        action
        fluid
        error={isInvalid()}
        label={props.label}
      >
        {/* <input style={{ 'text-align': 'right' }} /> */}
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
        {props.onSet && (<Button onClick={handleOnSet}>Set</Button>)}
      </Form.Input>
    );
  }
}