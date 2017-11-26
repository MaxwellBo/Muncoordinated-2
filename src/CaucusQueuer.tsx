import * as React from 'react';
import * as firebase from 'firebase';
import { MemberData, parseCountryOption } from './Member';
import { CaucusData, SpeakerEvent, Stance } from './Caucus';
import * as Utils from './utils';
import { COUNTRY_OPTIONS, CountryOption } from './common';
import { Header, Segment, Dropdown, Button } from 'semantic-ui-react';
import { TimeSetter, Unit } from './Timer';

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

  render() {
    const stanceHandler = (stance: Stance) => () => {

      const duration = Number(this.state.durationField);

      if (duration) {
        const newEvent: SpeakerEvent = {
          who: this.state.queueCountry.text,
          stance: stance,
          duration: this.state.unitDropdown === Unit.Minutes ? duration * 60 : duration,
        };

        this.props.fref.child('queue').push().set(newEvent);
      }
    };

    const countryOptions: CountryOption[] =
      Utils.objectToList(this.props.members).map(x => parseCountryOption(x.name));

    const countryHandler = (event: any, data: any) => {
      this.setState({ queueCountry: countryOptions.filter(c => c.value === data.value)[0] });
    };

    const unitHandler = (event: any, data: any) => {
      this.setState({ unitDropdown: data.value });
    };

    const durationHandler = (e: React.FormEvent<HTMLInputElement>) =>
      this.setState({ durationField: e.currentTarget.value });

    return (
      <div>
        <Header as="h3" attached="top">Queue</Header>
        <Segment attached>
          <Dropdown
            value={this.state.queueCountry.value}
            search
            selection
            onChange={countryHandler}
            options={countryOptions}
          />
          <TimeSetter
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
        </Segment>
      </div>
    );
  }
}