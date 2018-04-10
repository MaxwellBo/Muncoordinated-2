import * as React from 'react';
import * as firebase from 'firebase';
import { MemberData, nameToCountryOption } from '../Member';
import { CaucusData } from '../Caucus';
import * as Utils from '../../utils';
import { COUNTRY_OPTIONS, CountryOption } from '../../constants';
import { Header, Segment, Dropdown, Button, Form, DropdownProps, Icon, Checkbox } from 'semantic-ui-react';
import { TimerSetter, Unit } from '../TimerSetter';
import { SpeakerEvent, Stance } from '..//caucus/SpeakerFeed';
import { checkboxHandler } from '../../actions/handlers';

interface Props {
  caucus?: CaucusData;
  members?: Map<string, MemberData>;
  caucusFref: firebase.database.Reference;
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

      this.props.caucusFref.child('queue').push().set(newEvent);
    }
  }

  recoverCountryOptions = (): CountryOption[] => {
    const members = this.props.members || {} as Map<string, MemberData>;

    return Utils.objectToList(members).map(x => nameToCountryOption(x.name));
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

    const { members, caucus, caucusFref } = this.props;

    const countryOptions = this.recoverCountryOptions();

    const durationHandler = (e: React.FormEvent<HTMLInputElement>) =>
      this.setState({ durationField: e.currentTarget.value });

    return (
      <div>
        <Header as="h3" attached="top">Queue</Header>
        <Segment attached textAlign="center" loading={!members}>
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
                // labelPosition="left"
                // icon
                onClick={stanceHandler(Stance.For)}
              />
                {/* <Icon name="thumbs outline up" />
                For
              </Button> */}
              <Button.Or />
              <Button 
                content="Neutral"
                onClick={stanceHandler(Stance.Neutral)}
              />
              <Button.Or />
              <Button 
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
      </div>
    );
  }
}