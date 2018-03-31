import * as React from 'react';
import * as firebase from 'firebase';
import { MemberData, nameToCountryOption } from './Member';
import { CaucusData, SpeakerEvent, Stance } from './Caucus';
import * as Utils from '../utils';
import { COUNTRY_OPTIONS, CountryOption } from '../constants';
import { Header, Segment, Dropdown, Button, Form, DropdownProps } from 'semantic-ui-react';
import { TimerSetter, Unit } from './TimerSetter';

interface Props {
  data: CaucusData;
  members: Map<string, MemberData>;
  fref: firebase.database.Reference;
}

interface State {
  queueCountry: CountryOption;
  unitDropdown: Unit;
  durationField: string;
}

export default class CaucusQueuer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      queueCountry: COUNTRY_OPTIONS[0],
      unitDropdown: Unit.Seconds,
      durationField: '60'
    };

  }

  stanceHandler = (stance: Stance) => () => {
    const duration = Number(this.state.durationField);

    if (duration) {
      const newEvent: SpeakerEvent = {
        who: this.state.queueCountry.text,
        stance: stance,
        duration: this.state.unitDropdown === Unit.Minutes ? duration * 60 : duration,
      };

      this.props.fref.child('queue').push().set(newEvent);
    }
  }

  recoverCountryOptions = (): CountryOption[] => {
    return Utils.objectToList(this.props.members).map(x => nameToCountryOption(x.name));
  }

  countryHandler = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    const countryOptions = this.recoverCountryOptions();

    this.setState({ queueCountry: countryOptions.filter(c => c.value === data.value)[0] });
  }

  unitHandler = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    this.setState({ unitDropdown: data.value as Unit });
  }

  render() {
    const { stanceHandler, countryHandler, unitHandler } = this;

    const countryOptions = this.recoverCountryOptions();

    const durationHandler = (e: React.FormEvent<HTMLInputElement>) =>
      this.setState({ durationField: e.currentTarget.value });

    return (
      <div>
        <Header as="h3" attached="top">Queue</Header>
        <Segment attached textAlign="center">
          <Form>
            <Form.Dropdown
              value={this.state.queueCountry.value}
              search
              selection
              onChange={countryHandler}
              options={countryOptions}
            />
            <TimerSetter
              unitValue={this.state.unitDropdown}
              durationValue={this.state.durationField}
              onDurationChange={durationHandler}
              onUnitChange={unitHandler}
            />
            <Button.Group size="large">
              <Button onClick={stanceHandler(Stance.For)}>For</Button>
              <Button.Or />
              <Button onClick={stanceHandler(Stance.Neutral)}>Neutral</Button>
              <Button.Or />
              <Button onClick={stanceHandler(Stance.Against)}>Against</Button>
            </Button.Group>
          </Form>
        </Segment>
      </div>
    );
  }
}