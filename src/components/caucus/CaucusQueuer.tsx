import * as React from 'react';
import * as firebase from 'firebase';
import { MemberData } from '../Member';
import { CaucusData, recoverDuration, recoverUnit } from '../Caucus';
import { MemberOption } from '../../constants';
import { Segment, Button, Form, DropdownProps, Label } from 'semantic-ui-react';
import { TimerSetter, Unit } from '../TimerSetter';
import { SpeakerEvent, Stance } from '..//caucus/SpeakerFeed';
import { checkboxHandler, validatedNumberFieldHandler, dropdownHandler } from '../../actions/handlers';
import { membersToOptions } from '../../utils';
import { Dictionary } from '../../types';

interface Props {
  caucus?: CaucusData;
  members?: Dictionary<string, MemberData>;
  caucusFref: firebase.database.Reference;
}

interface State {
  queueMember?: MemberOption;
}

export default class CaucusQueuer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  setStance = (stance: Stance) => () => {
    const { queueMember } = this.state;
    const { caucus } = this.props;

    const duration = Number(recoverDuration(caucus));

    if (duration && queueMember) {
      const newEvent: SpeakerEvent = {
        who: queueMember.text,
        stance: stance,
        duration: recoverUnit(caucus) === Unit.Minutes ? duration * 60 : duration,
      };

      this.props.caucusFref.child('queue').push().set(newEvent);
    }
  }

  setMember = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    const { members } = this.props;
    const memberOptions = membersToOptions(members);

    this.setState({ queueMember: memberOptions.filter(c => c.value === data.value)[0] });
  }

  render() {
    const { setStance, setMember } = this;
    const { members, caucus, caucusFref } = this.props;
    const { queueMember } = this.state;

    const memberOptions = membersToOptions(members);

    const duration = recoverDuration(caucus);
    const disableButtons = !queueMember || !duration;

    return (
      <Segment textAlign="center">
        <Label attached="top left" size="large">Queue</Label>
        <Form>
          <Form.Dropdown
            icon="search"
            value={queueMember ? queueMember.value : undefined}
            search
            selection
            loading={!caucus}
            error={!queueMember}
            onChange={setMember}
            options={memberOptions}
          />
          <TimerSetter
            loading={!caucus}
            unitValue={recoverUnit(caucus)}
            placeholder="Speaking time"
            durationValue={duration ? duration.toString() : undefined}
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
              onClick={setStance(Stance.For)}
            />
            <Button.Or />
            <Button
              disabled={disableButtons}
              content="Neutral"
              onClick={setStance(Stance.Neutral)}
            />
            <Button.Or />
            <Button
              disabled={disableButtons}
              content="Against"
              onClick={setStance(Stance.Against)}
            />
          </Button.Group>
        </Form>
      </Segment>
    );
  }
}