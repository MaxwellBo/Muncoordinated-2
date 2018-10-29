import * as React from 'react';
import * as firebase from 'firebase';
import { MemberData } from '../Member';
import { CaucusData } from '../Caucus';
import { CountryOption } from '../../constants';
import { Segment, Button, Form, DropdownProps, Label } from 'semantic-ui-react';
import { TimerSetter, Unit } from '../TimerSetter';
import { SpeakerEvent, Stance } from '..//caucus/SpeakerFeed';
import { checkboxHandler } from '../../actions/handlers';
import { membersToOptions } from '../../utils';

interface Props {
  caucus?: CaucusData;
  members?: Map<string, MemberData>;
  caucusFref: firebase.database.Reference;
}

interface State {
  queueCountry?: CountryOption;
  unitDropdown: Unit;
  durationField: string;
}

export default class CaucusQueuer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      unitDropdown: Unit.Seconds,
      durationField: '60'
    };
  }

  stanceHandler = (stance: Stance) => () => {
    const { queueCountry } = this.state;
    const duration = Number(this.state.durationField);

    if (duration && queueCountry) {
      const newEvent: SpeakerEvent = {
        who: queueCountry.text,
        stance: stance,
        duration: this.state.unitDropdown === Unit.Minutes ? duration * 60 : duration,
      };

      this.props.caucusFref.child('queue').push().set(newEvent);
    }
  }

  countryHandler = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    const { members } = this.props;
    const countryOptions = membersToOptions(members);

    this.setState({ queueCountry: countryOptions.filter(c => c.value === data.value)[0] });
  }

  unitHandler = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    this.setState({ unitDropdown: data.value as Unit });
  }

  render() {
    const { stanceHandler, countryHandler, unitHandler } = this;
    const { members, caucus, caucusFref } = this.props;
    const { queueCountry } = this.state;

    const countryOptions = membersToOptions(members);

    const durationHandler = (e: React.FormEvent<HTMLInputElement>) =>
      this.setState({ durationField: e.currentTarget.value });

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
            unitValue={this.state.unitDropdown}
            durationValue={this.state.durationField}
            onDurationChange={durationHandler}
            onUnitChange={unitHandler}
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
              disabled={!queueCountry}
              // labelPosition="left"
              // icon
              onClick={stanceHandler(Stance.For)}
            />
            <Button.Or />
            <Button
              disabled={!queueCountry}
              content="Neutral"
              onClick={stanceHandler(Stance.Neutral)}
            />
            <Button.Or />
            <Button
              disabled={!queueCountry}
              content="Against"
              // labelPosition="right"
              // icon
              onClick={stanceHandler(Stance.Against)}
            />
            {/* <Icon name="thumbs outline down" />
              Against
            </Button> */}
          </Button.Group>
        </Form>
      </Segment>
    );
  }
}