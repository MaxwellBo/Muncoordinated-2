import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Form } from 'semantic-ui-react';
import { Unit } from '../models/time';

interface Props {
  unit: Unit;
  duration: string;
  onUnitChange: (unit: Unit) => void;
  onDurationChange: (duration: string) => void;
}

export function TimeSetter({ unit, duration, onUnitChange, onDurationChange }: Props) {
  const intl = useIntl();

  const unitOptions = [
    { 
      key: Unit.Seconds, 
      text: intl.formatMessage({ id: 'timer.unit.seconds', defaultMessage: 'Seconds' }), 
      value: Unit.Seconds 
    },
    { 
      key: Unit.Minutes, 
      text: intl.formatMessage({ id: 'timer.unit.minutes', defaultMessage: 'Minutes' }), 
      value: Unit.Minutes 
    }
  ];

  return (
    <>
      <Form.Input
        label={<FormattedMessage id="timer.duration" defaultMessage="Duration" />}
        placeholder={intl.formatMessage({ id: 'timer.duration.placeholder', defaultMessage: 'Enter duration' })}
        value={duration}
        onChange={(e) => onDurationChange(e.currentTarget.value)}
        width={6}
      />
      <Form.Select
        label={<FormattedMessage id="timer.unit" defaultMessage="Unit" />}
        options={unitOptions}
        value={unit}
        onChange={(_, data) => onUnitChange(data.value as Unit)}
        width={6}
      />
    </>
  );
}