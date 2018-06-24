import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID, DEFAULT_COMMITTEE } from './Committee';
import { RouteComponentProps } from 'react-router';
import { Segment, Input, Dropdown, Button, Card, Form, Message, Flag, Label } from 'semantic-ui-react';
import { fieldHandler, dropdownHandler, validatedNumberFieldHandler, 
  countryDropdownHandler, 
  stateFieldHandler,
  stateDropdownHandler,
  stateValidatedNumberFieldHandler,
  stateCountryDropdownHandler} from '../actions/handlers';
import { makeDropdownOption, objectToList, recoverCountryOptions } from '../utils';
import { TimerSetter, Unit } from './TimerSetter';
import { nameToCountryOption, MemberID, MemberData, parseFlagName } from './Member';
import { CountryOption, COUNTRY_OPTIONS } from '../constants';
import { DEFAULT_CAUCUS, CaucusData } from './Caucus';
import { postCaucus, postResolution } from '../actions/caucusActions';
import { TimerData } from './Timer';
import { putUnmodTimer } from '../actions/committeeActions';
import { URLParameters } from '../types';
import Loading from './Loading';
import { ResolutionData, DEFAULT_RESOLUTION } from './Resolution';
import { Stance } from './caucus/SpeakerFeed';

export type MotionID = string;

enum MotionType {
  OpenUnmoderatedCaucus = 'Open Unmoderated Caucus',
  OpenModeratedCaucus = 'Open Moderated Caucus',
  ExtendUnmoderatedCaucus = 'Extend Unmoderated Caucus',
  ExtendModeratedCaucus = 'Extend Moderated Caucus',
  CloseModeratedCaucus = 'Close Moderated Caucus',
  IntroduceDraftResolution = 'Introduce Draft Resolution',
  IntroduceAmendment = 'Introduce Amendment',
  SuspendDraftResolutionSpeakersList = 'Suspend Draft Resolution Speakers List',
  OpenDebate = 'Open Debate',
  SuspendDebate = 'Suspend Debate',
  ResumeDebate = 'Resume Debate',
  CloseDebate = 'Close Debate',
  ReorderDraftResolutions = 'Reorder Draft Resolutions'
}

const disruptiveness = (motionType: MotionType): number => {
  switch (motionType) {
    case MotionType.ExtendUnmoderatedCaucus:
      return 1;
    case MotionType.ExtendModeratedCaucus:
    case MotionType.CloseModeratedCaucus:
      return 2;
    case MotionType.OpenUnmoderatedCaucus:
      return 4;
    case MotionType.OpenModeratedCaucus:
      return 5;
    case MotionType.IntroduceDraftResolution:
      return 6;
    case MotionType.IntroduceAmendment:
      return 7;
    case MotionType.SuspendDraftResolutionSpeakersList:
      return 8;
    case MotionType.OpenDebate:
    case MotionType.SuspendDebate:
    case MotionType.ResumeDebate:
    case MotionType.CloseDebate:
      return 9;
    case MotionType.ReorderDraftResolutions:
      return 10;
    default:
      return 69;
  }
};

const approvable = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.OpenModeratedCaucus:
    case MotionType.OpenUnmoderatedCaucus:
    case MotionType.IntroduceDraftResolution:
      return true;
    default:
      return false;
  }
};

const hasSpeakers = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.OpenModeratedCaucus:
      return true;
    default:
      return false;
  }
};

const hasSeconder = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.IntroduceDraftResolution:
      return true;
    default:
      return false;
  }
};

const hasDetail = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.OpenModeratedCaucus:
    case MotionType.IntroduceDraftResolution:
    case MotionType.IntroduceAmendment:
      return true;
    default:
      return false;
  }
};

const hasDuration = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.ExtendUnmoderatedCaucus:
    case MotionType.ExtendModeratedCaucus:
    case MotionType.OpenModeratedCaucus:
    case MotionType.OpenUnmoderatedCaucus:
      return true;
    default:
      return false;
  }
};

export interface MotionData {
  proposal: string;
  proposer: string;
  seconder: string;
  speakerDuration?: number;
  speakerUnit: Unit;
  caucusDuration?: number;
  caucusUnit: Unit;
  type: MotionType;
}

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  newMotion: MotionData;
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

const MOTION_TYPE_OPTIONS = [
  MotionType.OpenUnmoderatedCaucus,
  MotionType.OpenModeratedCaucus,
  MotionType.ExtendUnmoderatedCaucus,
  MotionType.ExtendModeratedCaucus,
  MotionType.CloseModeratedCaucus,
  MotionType.IntroduceDraftResolution,
  MotionType.IntroduceAmendment,
  MotionType.SuspendDraftResolutionSpeakersList,
  MotionType.OpenDebate,
  MotionType.SuspendDebate,
  MotionType.ResumeDebate,
  MotionType.CloseDebate,
  MotionType.ReorderDraftResolutions,
].map(makeDropdownOption);

const DEFAULT_MOTION: MotionData = {
  proposal: '',
  proposer: '',
  seconder: '',
  speakerDuration: 60,
  speakerUnit: Unit.Seconds,
  caucusDuration: 15,
  caucusUnit: Unit.Minutes,
  type: MotionType.OpenUnmoderatedCaucus // this will force it to the top of the list
};

export default class Motions extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees').child(match.params.committeeID),
      newMotion: DEFAULT_MOTION
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val() });
    }
  }

  componentDidMount() {
    this.state.committeeFref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    this.state.committeeFref.off('value', this.firebaseCallback);
  }

  handlePushMotion = (): void => {
    const { newMotion } = this.state;

    this.state.committeeFref.child('motions').push().set(newMotion);

    const duration = newMotion.caucusUnit === 'min'
      ? (newMotion.caucusDuration || 0) + 1
      : newMotion.caucusDuration;

    this.setState(prevState => {
      return {
        newMotion: {
          ...prevState.newMotion,
          caucusDuration: duration
        }
      };
    });
  }

  handleClearMotions = (): void => {
    this.state.committeeFref.child('motions').set({});
  }

  handleClearAdder = () => {
    this.setState({
      newMotion: DEFAULT_MOTION
    });
  }

  handleApproveMotion = (motionData: MotionData): void => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;

    const { proposal, proposer, speakerDuration, speakerUnit, 
      caucusDuration, caucusUnit, seconder } = motionData;

    if (motionData.type === MotionType.OpenModeratedCaucus && speakerDuration && caucusDuration) {

      const speakerSeconds = speakerDuration * (speakerUnit === Unit.Minutes ? 60 : 1);
      const caucusSeconds = caucusDuration * (caucusUnit === Unit.Minutes ? 60 : 1);

      const newCaucus: CaucusData = {
        ...DEFAULT_CAUCUS,
        name: motionData.proposal,
        speakerTimer: {
          ...DEFAULT_CAUCUS.speakerTimer,
          remaining: speakerSeconds
        },
        caucusTimer: {
          ...DEFAULT_CAUCUS.caucusTimer,
          remaining: caucusSeconds
        },
        speaking: {
          who: proposer,
          stance: Stance.For,
          duration: speakerSeconds
        }
      };

      const ref = postCaucus(committeeID, newCaucus);

      this.props.history
        .push(`/committees/${committeeID}/caucuses/${ref.key}`);

    } else if (motionData.type === MotionType.OpenUnmoderatedCaucus && caucusDuration) {

      const caucusSeconds = caucusDuration * (caucusUnit === Unit.Minutes ? 60 : 1);

      const newTimer: TimerData = {
        ...DEFAULT_COMMITTEE.timer,
        remaining: caucusSeconds
      };

      putUnmodTimer(committeeID, newTimer);

      this.props.history
        .push(`/committees/${committeeID}/unmod`);
    } else if (motionData.type === MotionType.IntroduceDraftResolution) {

      const newResolution: ResolutionData = {
        ...DEFAULT_RESOLUTION,
        name: motionData.proposal,
        proposer: proposer,
        seconder: seconder
      };

      const ref = postResolution(committeeID, newResolution);

      this.props.history
        .push(`/committees/${committeeID}/resolutions/${ref.key}`);
    }
  }

  renderMotion = (id: MotionID, motionData: MotionData, motionFref: firebase.database.Reference) => {
    const { handleApproveMotion } = this;
    const { proposer, proposal, type, caucusUnit, caucusDuration, speakerUnit, 
      speakerDuration, seconder } = motionData;

    const description = (
      <Card.Description>
        {proposal}
      </Card.Description>
    );

    const countryOptions = recoverCountryOptions(this.state.committee);

    const proposerTree = (
      <div>
        <Label horizontal>
          Proposer
        </Label>
        <Flag name={parseFlagName(proposer)} /> {proposer}
      </div>
    );

    const seconderTree = (
      <div>
        <Label horizontal>
          Seconder
        </Label>
        <Flag name={parseFlagName(seconder)} /> {seconder}
      </div>
    );

    const time = hasDuration(type) ? 
      hasSpeakers(type) 
        ? `${caucusDuration || 0} ${caucusUnit} / ${speakerDuration || 0} ${speakerUnit} `
        : `${caucusDuration || 0} ${caucusUnit} `
      : '';

    return (
      <Card 
        key={id}
      >
        <Card.Content>
          <Card.Header>
            {time}{type}
            {hasDetail(type) && description}
          </Card.Header>
          <Card.Meta>
              {proposerTree}
              {hasSeconder(type) && seconderTree}
          </Card.Meta>
        </Card.Content>
        <Card.Content extra>
          <Button.Group fluid>
            <Button 
              basic 
              negative
              onClick={() => motionFref.remove()}
            >
              Delete
            </Button>
            {approvable(type) && <Button.Or />}
            {approvable(type) && <Button 
              disabled={motionData.proposer === ''}
              basic
              positive
              onClick={() => handleApproveMotion(motionData)}
            >
              Provision
            </Button>}
          </Button.Group>
        </Card.Content>
      </Card>
    );
  }

  renderAdder = (): JSX.Element => {
    const { handleApproveMotion } = this;
    const { newMotion } = this.state;
    const { proposer, proposal, type, caucusUnit, caucusDuration, speakerUnit, 
      speakerDuration, seconder } = newMotion;

    const description = (
      <Card.Description>
        <Input 
          value={proposal}
          onChange={stateFieldHandler<Props, State>(this, 'newMotion', 'proposal')} 
          fluid 
        /> 
      </Card.Description>
    );

    const speakerSetter = (
      <TimerSetter
        unitValue={speakerUnit}
        durationValue={speakerDuration ? speakerDuration.toString() : undefined}
        onUnitChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'speakerUnit')}
        onDurationChange={stateValidatedNumberFieldHandler<Props, State>(this, 'newMotion', 'speakerDuration')}
        label={'Speaker'}
      />
    );

    const durationSetter = (
      <TimerSetter
        unitValue={caucusUnit}
        durationValue={caucusDuration ? caucusDuration.toString() : undefined}
        onUnitChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'caucusUnit')}
        onDurationChange={stateValidatedNumberFieldHandler<Props, State>(this, 'newMotion', 'caucusDuration')}
        label={'Duration'}
      />
    );

    const speakerSeconds = (speakerDuration || 0) * (speakerUnit === Unit.Minutes ? 60 : 1);
    const caucusSeconds = (caucusDuration || 0) * (caucusUnit === Unit.Minutes ? 60 : 1);

    const doesNotEvenlyDivide = (caucusSeconds % speakerSeconds) !== 0;

    const warning = (
      <Card.Content extra>
        <Message
          error
          content="Speaker time does not evenly divide the caucus time"
        />
      </Card.Content>
    );

    const extra = (
      <Card.Content extra>
        <Form error={hasSpeakers(type) && hasDuration(type) && doesNotEvenlyDivide}>
          <Form.Group widths="equal">
            {hasDuration(type) && durationSetter}
            {hasSpeakers(type) && speakerSetter}
          </Form.Group>
          {warning}
        </Form>
      </Card.Content>
    );

    const countryOptions = recoverCountryOptions(this.state.committee);

    const proposerTree = (
      <Form.Dropdown
        key="proposer"
        value={nameToCountryOption(proposer).key}
        search
        selection
        fluid
        onChange={stateCountryDropdownHandler<Props, State>(this, 'newMotion', 'proposer', countryOptions)}
        options={countryOptions}
        label="Proposer"
      />
    );

    const seconderTree = (
      <Form.Dropdown
        key="seconder"
        value={nameToCountryOption(seconder).key}
        search
        selection
        fluid
        onChange={stateCountryDropdownHandler<Props, State>(this, 'newMotion', 'seconder', countryOptions)}
        options={countryOptions}
        label="Seconder"
      />
    );

    return (
      <Card 
        key="adder"
      >
        <Card.Content>
          <Card.Header>
            <Dropdown
              placeholder="Select type"
              search
              selection
              fluid
              options={MOTION_TYPE_OPTIONS}
              onChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'type')}
              value={type}
            />
            {hasDetail(type) && description}
          </Card.Header>
          <Card.Meta>
            <Form>
              <Form.Group widths="equal">
                {proposerTree}
                {hasSeconder(type) && seconderTree}
              </Form.Group>
            </Form>
          </Card.Meta>
        </Card.Content>
        {(hasSpeakers(type) || hasDuration(type)) && extra}
        <Card.Content extra>
          <Button.Group fluid>
            {/* <Button 
              basic 
              onClick={this.handleClearAdder}
            >
              Clear
            </Button> */}
            <Button 
              disabled={proposer === ''}
              icon="plus"
              basic
              primary
              onClick={this.handlePushMotion}
            />
          </Button.Group>
        </Card.Content>
      </Card>
    );
  }

  renderMotions = (motions: Map<MotionID, MotionData>) => {
    const { renderMotion } = this;
    const { committeeFref } = this.state;

    return Object.keys(motions).sort((a, b) => {
      // don't like non-descriptive variable names? suck it
      const ma: MotionData = motions[a];
      const mb: MotionData = motions[b];
      const ca = disruptiveness(ma.type);
      const cb = disruptiveness(mb.type);

      if (ca < cb) {
        return -1; 
      } else if (ca === cb) {

        const sa = (ma.caucusDuration || 0) * (ma.caucusUnit === Unit.Minutes ? 60 : 1);
        const sb = (mb.caucusDuration || 0) * (mb.caucusUnit === Unit.Minutes ? 60 : 1);

        // FIXME: Could be replaced by some sort of comapre function that I know exists
        if (sa < sb) {
          return 1;
        } else if (sa === sb) {
          return 0;
        } else {
          return -1;
        }
      } else {
        return 1;
      }
    }).map(key => {
      return renderMotion(key, motions[key], committeeFref.child('motions').child(key));
    });
  }

  renderTab = (committee: CommitteeData) => {
    const { renderMotions, handlePushMotion, renderAdder } = this;

    const motions = committee.motions || {} as Map<MotionID, MotionData>;

    return (
      <div>
        <Card.Group
          itemsPerRow={1} 
        >
          {renderAdder()}
          {renderMotions(motions)}
        </Card.Group>
      </div>
    );
  }

  render() {
    const { committee } = this.state;

    if (committee) {
      return this.renderTab(committee);
    } else {
      return <Loading />;
    }
  }
}