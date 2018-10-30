import * as React from 'react';
import * as firebase from 'firebase';
import { MemberData } from '../Member';
import { CaucusData } from '../Caucus';
import { CountryOption } from '../../constants';
import { Segment, Button, Form, DropdownProps, Label } from 'semantic-ui-react';
import { TimerSetter, Unit } from '../TimerSetter';
import { SpeakerEvent, Stance } from '..//caucus/SpeakerFeed';
import { checkboxHandler, validatedNumberFieldHandler, dropdownHandler } from '../../actions/handlers';
import { membersToOptions } from '../../utils';

interface Props {
  caucus?: CaucusData;
  members?: Map<string, MemberData>;
  caucusFref: firebase.database.Reference;
}

interface State {
  queueCountry?: CountryOption;
}

export default class CaucusQueuer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  recoverUnit = () => {
    const { caucus } = this.props;

    return caucus ? (caucus.speakerUnit || Unit.Seconds) : Unit.Seconds;
  }

  recoverDuration = () => {
    const { caucus } = this.props;

    return caucus 
      ? caucus.speakerDuration 
        ? caucus.speakerDuration.toString() 
        : undefined
      : undefined;
  }

  stanceHandler = (stance: Stance) => () => {
    const { queueCountry } = this.state;
    const duration = Number(this.recoverDuration());

    if (duration && queueCountry) {
      const newEvent: SpeakerEvent = {
        who: queueCountry.text,
        stance: stance,
        duration: this.recoverUnit() === Unit.Minutes ? duration * 60 : duration,
      };

      this.props.caucusFref.child('queue').push().set(newEvent);
    }
  }

  countryHandler = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    const { members } = this.props;
    const countryOptions = membersToOptions(members);

    this.setState({ queueCountry: countryOptions.filter(c => c.value === data.value)[0] });
  }

  render() {
    const { stanceHandler, countryHandler } = this;
    const { members, caucus, caucusFref } = this.props;
    const { queueCountry } = this.state;

    const countryOptions = membersToOptions(members);

    const disableButtons = !queueCountry || !this.recoverDuration();

    return (
      <Segment textAlign="center">
        <Label attached="top left" size="large">Queue</Label>
        <Form>
          <Form.Dropdown
            icon="search"
            value={queueCountry ? queueCountry.value : undefined}
            search
            selection
            loading={!caucus}
            error={!queueCountry}
            onChange={countryHandler}
            options={countryOptions}
          />
          <TimerSetter
            loading={!caucus}
            unitValue={this.recoverUnit()}
            durationValue={this.recoverDuration()}
            onDurationChange={validatedNumberFieldHandler(caucusFref, 'speakerDuration')}
            onUnitChange={dropdownHandler(caucusFref, 'speakerUnit')}
          />
          <Form.Checkbox
            label="Delegates can queue"
            indeterminate={!caucus}
            toggle
            checked={caucus ? (caucus.queueIsPublic || false) : false} // zoo wee mama
            onChange={checkboxHandler<CaucusData>(caucusFref, 'queueIsPublic')}
          />
          <Button.Group size="large" fluid>
            <Button
              content="For"
              disabled={disableButtons}
              onClick={stanceHandler(Stance.For)}
            />
            <Button.Or />
            <Button
              disabled={disableButtons}
              content="Neutral"
              onClick={stanceHandler(Stance.Neutral)}
            />
            <Button.Or />
            <Button
              disabled={disableButtons}
              content="Against"
              onClick={stanceHandler(Stance.Against)}
            />
          </Button.Group>
        </Form>
      </Segment>
    );
  }
}