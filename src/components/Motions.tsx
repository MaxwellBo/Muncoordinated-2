import * as React from 'react';
import * as firebase from 'firebase';
import Committee, { CommitteeData, CommitteeID, DEFAULT_COMMITTEE } from './Committee';
import { RouteComponentProps } from 'react-router';
import { Icon, Input, Dropdown, Button, Card, Form, Message, Flag, Label, TextArea, 
  Container } from 'semantic-ui-react';
import { stateFieldHandler,
  stateDropdownHandler,
  stateValidatedNumberFieldHandler,
  stateCountryDropdownHandler,
  stateTextAreaHandler
} from '../actions/handlers';
import { makeDropdownOption, recoverCountryOptions } from '../utils';
import { TimerSetter, Unit } from './TimerSetter';
import { nameToCountryOption, parseFlagName } from './Member';
import { DEFAULT_CAUCUS, CaucusData, CaucusID, CaucusStatus } from './Caucus';
import { postCaucus, closeCaucus } from '../actions/caucusActions';
import { TimerData } from './Timer';
import { putUnmodTimer, extendUnmodTimer, extendModTimer } from '../actions/committeeActions';
import { URLParameters } from '../types';
import Loading from './Loading';
import { ResolutionData, DEFAULT_RESOLUTION, ResolutionID } from './Resolution';
import { Stance } from './caucus/SpeakerFeed';
import { AmendmentData, DEFAULT_AMENDMENT } from './Amendment';
import { postAmendment, postResolution } from '../actions/resolutionActions';

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
      return 69; // nice
  }
};

const actionName = (motionType: MotionType): string => {
  switch (motionType) {
    case MotionType.ExtendUnmoderatedCaucus:
    case MotionType.ExtendModeratedCaucus:
      return 'Extend';
    case MotionType.CloseModeratedCaucus:
    case MotionType.CloseDebate:
      return 'Close';
    case MotionType.OpenUnmoderatedCaucus:
    case MotionType.OpenDebate:
    case MotionType.OpenModeratedCaucus:
      return 'Open';
    case MotionType.IntroduceDraftResolution:
    case MotionType.IntroduceAmendment:
      return 'Introduce';
    case MotionType.SuspendDraftResolutionSpeakersList:
    case MotionType.SuspendDebate:
      return 'Suspend';
    case MotionType.ResumeDebate:
      return 'Resume';
    case MotionType.ReorderDraftResolutions:
      return 'Reorder';
    default:
      return 'Enact';
  }
};

const approvable = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.OpenModeratedCaucus:
    case MotionType.OpenUnmoderatedCaucus:
    case MotionType.IntroduceDraftResolution:
    case MotionType.ExtendUnmoderatedCaucus:
    case MotionType.ExtendModeratedCaucus:
    case MotionType.CloseModeratedCaucus:
    case MotionType.IntroduceAmendment:
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

const hasCaucusTarget = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.ExtendModeratedCaucus:
    case MotionType.CloseModeratedCaucus:
      return true;
    default:
      return false;
  }
};

const hasResolutionTarget = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.IntroduceAmendment:
    case MotionType.SuspendDraftResolutionSpeakersList:
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
  caucusTarget: CaucusID;
  resolutionTarget: ResolutionID;
}

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  newMotion: MotionData;
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

const MOTION_TYPE_OPTIONS = [
  MotionType.OpenUnmoderatedCaucus, // implemented
  MotionType.OpenModeratedCaucus, // implemented
  MotionType.ExtendUnmoderatedCaucus, // partially implemented
  MotionType.ExtendModeratedCaucus, // partially implemented
  MotionType.CloseModeratedCaucus, // implemented
  MotionType.IntroduceDraftResolution, // implemented
  MotionType.IntroduceAmendment, // implemented
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
  caucusDuration: 10,
  caucusUnit: Unit.Minutes,
  type: MotionType.OpenUnmoderatedCaucus, // this will force it to the top of the list
  caucusTarget: '',
  resolutionTarget: ''
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

    const { proposer, speakerDuration, speakerUnit, 
      caucusDuration, caucusUnit, seconder, proposal } = motionData;

    if (motionData.type === MotionType.OpenModeratedCaucus && speakerDuration && caucusDuration) {

      const speakerSeconds = speakerDuration * (speakerUnit === Unit.Minutes ? 60 : 1);
      const caucusSeconds = caucusDuration * (caucusUnit === Unit.Minutes ? 60 : 1);

      const newCaucus: CaucusData = {
        ...DEFAULT_CAUCUS,
        name: proposal,
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

      const caucusRef = postCaucus(committeeID, newCaucus);

      this.props.history
        .push(`/committees/${committeeID}/caucuses/${caucusRef.key}`);

    } else if (motionData.type === MotionType.OpenUnmoderatedCaucus && caucusDuration) {

      this.props.history
        .push(`/committees/${committeeID}/unmod`);

      const caucusSeconds = caucusDuration * (caucusUnit === Unit.Minutes ? 60 : 1);

      const newTimer: TimerData = {
        ...DEFAULT_COMMITTEE.timer,
        remaining: caucusSeconds
      };

      putUnmodTimer(committeeID, newTimer);

    } else if (motionData.type === MotionType.IntroduceDraftResolution) {

      const newResolution: ResolutionData = {
        ...DEFAULT_RESOLUTION,
        name: proposal,
        proposer: proposer,
        seconder: seconder
      };

      const resolutionRef = postResolution(committeeID, newResolution);

      this.props.history
        .push(`/committees/${committeeID}/resolutions/${resolutionRef.key}`);

    } else if (motionData.type === MotionType.ExtendUnmoderatedCaucus && caucusDuration) {

      this.props.history
        .push(`/committees/${committeeID}/unmod`);

      const caucusSeconds = caucusDuration * (caucusUnit === Unit.Minutes ? 60 : 1);

      // TODO: Do I wait a second before extending so it looks sexy?

      // FIXME: This has an obvious bug, in that we don't have the actual timer value
      // when this gets fired off
      extendUnmodTimer(committeeID, caucusSeconds);

    } else if (motionData.type === MotionType.ExtendModeratedCaucus && caucusDuration) {

      const caucusID = motionData.caucusTarget;

      this.props.history
        .push(`/committees/${committeeID}/caucuses/${caucusID}`);

      const caucusSeconds = caucusDuration * (caucusUnit === Unit.Minutes ? 60 : 1);
      
      extendModTimer(committeeID, caucusID, caucusSeconds);

    } else if (motionData.type === MotionType.CloseModeratedCaucus) {

      const caucusID = motionData.caucusTarget;

      this.props.history
        .push(`/committees/${committeeID}/caucuses/${caucusID}`);

      closeCaucus(committeeID, caucusID);
    } else if (motionData.type === MotionType.IntroduceAmendment) {

      const resolutionID = motionData.resolutionTarget;

      this.props.history
        .push(`/committees/${committeeID}/resolutions/${resolutionID}`);

      const newAmendment: AmendmentData = {
        ...DEFAULT_AMENDMENT,
        text: proposal,
        proposer: proposer
      };

      postAmendment(committeeID, resolutionID, newAmendment);
    }
    // remember to add the correct enum value to the approvable predicate when adding 
    // new cases

  } 
  renderMotion = (id: MotionID, motionData: MotionData, motionFref: firebase.database.Reference) => {
    const { handleApproveMotion } = this;
    const { committee } = this.state;
    const { proposer, proposal, type, caucusUnit, caucusDuration, speakerUnit, 
      speakerDuration, seconder, caucusTarget, resolutionTarget } = motionData;

    const description = (
      <Card.Description>
        {proposal}
      </Card.Description>
    );

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

    // this is absolutely batshit insane, surely there's a better option here

    let caucusTargetText = caucusTarget;

    if (committee 
      && committee.caucuses 
      && committee.caucuses[caucusTarget] 
      && committee.caucuses[caucusTarget].name
    ) {
      caucusTargetText = committee.caucuses[caucusTarget].name;
    }

    let resolutionTargetText = resolutionTarget;

    if (committee 
      && committee.resolutions 
      && committee.resolutions[resolutionTarget] 
      && committee.resolutions[resolutionTarget].name
    ) {
      resolutionTargetText = committee.resolutions[resolutionTarget].name;
    }

    // TODO: we definately can add links here
    const caucusTargetTree = (
      <div>
        <Label horizontal>
          Target Caucus
        </Label>
        {caucusTargetText}
      </div>
    );

    const resolutionTargetTree = (
      <div>
        <Label horizontal>
          Target Resolution
        </Label>
        {resolutionTargetText}
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
              {hasCaucusTarget(type) && caucusTargetTree}
              {hasResolutionTarget(type) && resolutionTargetTree}
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
              {actionName(type)}
            </Button>}
          </Button.Group>
        </Card.Content>
      </Card>
    );
  }

  renderAdder = (committee?: CommitteeData): JSX.Element => {
    const { newMotion } = this.state;
    const { proposer, proposal, type, caucusUnit, caucusDuration, speakerUnit, 
      speakerDuration, seconder, caucusTarget, resolutionTarget } = newMotion;

    const boxForAmmendments = (
      <Form>
        <TextArea
          value={proposal}
          autoHeight
          onChange={stateTextAreaHandler<Props, State>(this, 'newMotion', 'proposal')}
          rows={1}
          placeholder="Text"
        />
      </Form>
    );

    const boxForNames = (
      <Input 
        value={proposal}
        onChange={stateFieldHandler<Props, State>(this, 'newMotion', 'proposal')} 
        fluid 
      /> 
    );

    const description = (
      <Card.Description>
        {newMotion.type === MotionType.IntroduceAmendment ? boxForAmmendments : boxForNames}
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

    const { caucuses, resolutions } = this.state.committee || { caucuses:  {}, resolutions: {} };

    // BADCODE: Filter predicate shared with menu in Committee, also update when changing
    const caucusOptions = Object.keys(caucuses || {}).filter(key =>
      caucuses![key].status === CaucusStatus.Open.toString() && !caucuses![key].deleted
    ).map(key =>
      ({ key: key, value: key, text: caucuses![key].name })
    );

    const resolutionOptions = Object.keys(resolutions || {}).map(key =>
      ({ key: key, value: key, text: resolutions![key].name })
    );

    const caucusTargetSetter = (
      <Form.Dropdown
        key="caucusTarget"
        value={caucusTarget}
        search
        selection
        fluid
        loading={!committee}
        onChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'caucusTarget')}
        options={caucusOptions}
        label="Target Caucus"
      />
    );

    const resolutionTargetSetter = (
      <Form.Dropdown
        key="resolutionTarget"
        value={resolutionTarget}
        search
        selection
        fluid
        loading={!committee}
        onChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'resolutionTarget')}
        options={resolutionOptions}
        label="Target Resolution"
      />
    );

    const extra = (
      <Card.Content extra>
        <Form error={hasSpeakers(type) && hasDuration(type) && doesNotEvenlyDivide}>
          <Form.Group widths="equal">
            {hasCaucusTarget(type) && caucusTargetSetter}
            {hasResolutionTarget(type) && resolutionTargetSetter}
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
        icon="search"
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
        icon="search"
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
        {(hasSpeakers(type) 
          || hasDuration(type) 
          || hasCaucusTarget(type) 
          || hasResolutionTarget(type) 
          ) && extra}
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

  render() {
    const { renderMotions, renderAdder } = this;

    const { committee } = this.state;

    const renderedMotions = committee 
      ? renderMotions(committee.motions || {} as Map<string, MotionData>)
      : <div />; // TODO: This could probably do with a nice spinner

    return (
      <Container text>
        <Card.Group
          itemsPerRow={1} 
        >
          {renderAdder(committee)}
        </Card.Group>
        <Icon name="sort numeric descending" /> Sorted from most to least disruptive
        <Card.Group
          itemsPerRow={1} 
        >
          {renderedMotions}
        </Card.Group>
      </Container>
    );
  }
}