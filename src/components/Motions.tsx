import * as React from 'react';
import firebase from 'firebase/app';
import { CommitteeData, CommitteeID, DEFAULT_COMMITTEE, recoverCaucus, recoverResolution, recoverPresentMemberOptions, recoverSettings } from './Committee';
import { RouteComponentProps } from 'react-router';
import {
  Icon, Button, Card, Form, Message, Flag, Label,
  Container, Divider, Checkbox, Popup
} from 'semantic-ui-react';
import {
  stateFieldHandler,
  stateDropdownHandler,
  stateValidatedNumberFieldHandler,
  stateMemberDropdownHandler,
  stateTextAreaHandler,
  checkboxHandler
} from '../actions/handlers';
import { implies, sentenceCase, makeSentenceCaseDropdownOption, } from '../utils';
import { TimerSetter, Unit, getSeconds } from './TimerSetter';
import { nameToMemberOption, parseFlagName } from './Member';
import { DEFAULT_CAUCUS, CaucusData, CaucusID, CaucusStatus, DEFAULT_SPEAKER_TIME_SECONDS } from './Caucus';
import { putCaucus, closeCaucus, putSpeaking } from '../actions/caucus-actions';
import { TimerData } from './Timer';
import { putUnmodTimer, extendUnmodTimer, extendModTimer } from '../actions/committee-actions';
import { URLParameters } from '../types';
import { ResolutionData, DEFAULT_RESOLUTION, ResolutionID, IDENTITCAL_PROPOSER_SECONDER } from './Resolution';
import { Stance } from './caucus/SpeakerFeed';
import { AmendmentData, DEFAULT_AMENDMENT } from './Amendment';
import { putAmendment, putResolution } from '../actions/resolution-actions';
import { putStrawpoll } from '../actions/strawpoll-actions';
import { DEFAULT_STRAWPOLL } from './Strawpoll';
import { makeCommitteeStats } from './Admin';
import { SettingsData } from './Settings';
import { MotionsShareHint } from './ShareHint';
import { useVoterID, VoterID } from '../hooks';
import _ from 'lodash';

export type MotionID = string;

const DIVISIBILITY_ERROR = (
  <Message
    error
    content="Speaker time does not evenly divide the caucus time"
  />
);

enum MotionType {
  OpenUnmoderatedCaucus = 'Open Unmoderated Caucus',
  OpenModeratedCaucus = 'Open Moderated Caucus',
  ExtendUnmoderatedCaucus = 'Extend Unmoderated Caucus',
  ExtendModeratedCaucus = 'Extend Moderated Caucus',
  CloseModeratedCaucus = 'Close Moderated Caucus',
  IntroduceDraftResolution = 'Introduce Draft Resolution',
  IntroduceAmendment = 'Introduce Amendment',
  SuspendDraftResolutionSpeakersList = 'Suspend Draft Resolution Speakers List',
  VoteOnResolution = 'Vote On Resolution',
  OpenDebate = 'Open Debate',
  SuspendDebate = 'Suspend Debate',
  ResumeDebate = 'Resume Debate',
  CloseDebate = 'Close Debate',
  ReorderDraftResolutions = 'Reorder Draft Resolutions',
  ProposeStrawpoll = 'Propose Strawpoll'
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
    case MotionType.ProposeStrawpoll:
      return 6;
    case MotionType.IntroduceDraftResolution:
      return 7;
    case MotionType.IntroduceAmendment:
      return 8;
    case MotionType.SuspendDraftResolutionSpeakersList:
      return 9;
    case MotionType.OpenDebate:
    case MotionType.SuspendDebate:
    case MotionType.ResumeDebate:
    case MotionType.CloseDebate:
    case MotionType.VoteOnResolution:
      return 10;
    case MotionType.ReorderDraftResolutions:
      return 11;
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
    case MotionType.ProposeStrawpoll:
      return 'Create';
    case MotionType.VoteOnResolution:
      return 'Vote';
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
    case MotionType.ProposeStrawpoll:
    case MotionType.VoteOnResolution:
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
    case MotionType.ProposeStrawpoll:
      return true;
    default:
      return false;
  }
};

const hasTextArea = (motionType: MotionType): boolean => {
  switch (motionType) {
    case MotionType.IntroduceAmendment:
      return true;
    default:
      return false;
  }
};

const detailLabel = (motionType: MotionType): string => {
  switch (motionType) {
    case MotionType.OpenModeratedCaucus:
      return 'Topic';
    case MotionType.IntroduceDraftResolution:
      return 'Name';
    case MotionType.IntroduceAmendment:
      return 'Text';
    case MotionType.ProposeStrawpoll:
      return 'Question';
    default:
      return '';
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

const showMotionType = (motionType: MotionType, time: string): string => {
  switch (motionType) {
    case MotionType.ExtendUnmoderatedCaucus:
      return `Extend unmoderated caucus by ${time}`;
    case MotionType.ExtendModeratedCaucus:
      return `Extend moderated caucus by ${time}`;
    case MotionType.OpenModeratedCaucus:
      return `${time} moderated caucus`;
    case MotionType.OpenUnmoderatedCaucus:
      return `${time} unmoderated caucus`;
    default:
      return sentenceCase(motionType ?? 'Unknown type');
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
    case MotionType.VoteOnResolution:
      return true;
    default:
      return false;
  }
};

enum MotionVote {
  For = 'For',
  Abstain = 'Abstaining',
  Against = 'Against'
}

export interface MotionData {
  proposal: string;
  proposer?: string;
  seconder?: string;
  speakerDuration?: number;
  speakerUnit: Unit;
  caucusDuration?: number;
  caucusUnit: Unit;
  type: MotionType;
  caucusTarget?: CaucusID;
  resolutionTarget?: ResolutionID;
  deleted?: boolean;
  votes?: Record<VoterID, MotionVote>
}

interface Props extends RouteComponentProps<URLParameters> {
}

interface Hooks {
  voterID: VoterID
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
  MotionType.VoteOnResolution,
  MotionType.ProposeStrawpoll,
  MotionType.SuspendDraftResolutionSpeakersList,
  MotionType.OpenDebate,
  MotionType.SuspendDebate,
  MotionType.ResumeDebate,
  MotionType.CloseDebate,
  MotionType.ReorderDraftResolutions,
].map(makeSentenceCaseDropdownOption);

const DEFAULT_MOTION: MotionData = {
  proposal: '',
  speakerDuration: 60,
  speakerUnit: Unit.Seconds,
  caucusDuration: 10,
  caucusUnit: Unit.Minutes,
  type: MotionType.OpenUnmoderatedCaucus, // this will force it to the top of the list
  votes: {}
};

export class MotionsComponent extends React.Component<Props & Hooks, State> {
  constructor(props: Props & Hooks) {
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
      const { proposer, seconder, ...rest } = {
        ...prevState.newMotion,
        caucusDuration: duration,
        proposal: ''
      };

      return {
        newMotion: rest
      };
    });
  }

  handleClearMotions = (): void => {
    const { committee } = this.state;

    const { committeeFref } = this.state;

    const motions = committee
      ? committee.motions || {} as Record<string, MotionData>
      : {} as Record<string, MotionData>;

    Object.keys(motions).forEach(key => {
      committeeFref
        .child('motions')
        .child(key)
        .child('deleted')
        .set(true)
    })
  }

  handleClearAdder = () => {
    this.setState({
      newMotion: DEFAULT_MOTION
    });
  }

  handleApproveMotion = (
    motionFref: firebase.database.Reference,
    motionData: MotionData
  ): void => {
    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const { committee } = this.state;

    const { proposer, speakerDuration, speakerUnit,
      caucusDuration, caucusUnit, seconder, proposal } = motionData;

    const caucusID = motionData.caucusTarget;
    const resolutionID = motionData.resolutionTarget;

    motionFref.child('deleted').set(true);

    if (motionData.type === MotionType.OpenModeratedCaucus && speakerDuration && caucusDuration && proposer) {

      const speakerSeconds = getSeconds(speakerDuration, speakerUnit);
      const caucusSeconds = getSeconds(caucusDuration, caucusUnit);

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
        },
        speakerDuration: speakerDuration,
        speakerUnit: speakerUnit
      };

      const caucusRef = putCaucus(committeeID, newCaucus);

      this.props.history
        .push(`/committees/${committeeID}/caucuses/${caucusRef.key}`);

    } else if (motionData.type === MotionType.OpenUnmoderatedCaucus && caucusDuration) {
      this.props.history
        .push(`/committees/${committeeID}/unmod`);

      const caucusSeconds = getSeconds(caucusDuration, caucusUnit);

      const newTimer: TimerData = {
        ...DEFAULT_COMMITTEE.timer,
        remaining: caucusSeconds
      };

      putUnmodTimer(committeeID, newTimer);

    } else if (motionData.type === MotionType.IntroduceDraftResolution && proposer && seconder) {
      const newResolution: ResolutionData = {
        ...DEFAULT_RESOLUTION,
        name: proposal,
        proposer: proposer,
        seconder: seconder
      };

      const resolutionRef = putResolution(committeeID, newResolution);

      this.props.history
        .push(`/committees/${committeeID}/resolutions/${resolutionRef.key}`);

    } else if (motionData.type === MotionType.ExtendUnmoderatedCaucus && caucusDuration) {
      this.props.history
        .push(`/committees/${committeeID}/unmod`);

      const caucusSeconds = getSeconds(caucusDuration, caucusUnit);

      // TODO: Do I wait a second before extending so it looks sexy?

      // FIXME: This has an obvious bug, in that we don't have the actual timer value
      // when this gets fired off
      extendUnmodTimer(committeeID, caucusSeconds);

    } else if (motionData.type === MotionType.ExtendModeratedCaucus && caucusDuration && caucusID && proposer && committee) {
      this.props.history
        .push(`/committees/${committeeID}/caucuses/${caucusID}`);

      const caucusSeconds = getSeconds(caucusDuration, caucusUnit);

      extendModTimer(committeeID, caucusID, caucusSeconds);

      // @ts-ignore Assert that this exists
      const caucus: CaucusData = committee.caucuses[caucusID];
      const speakerSeconds = !caucus.speakerDuration || !caucus.speakerUnit ?
        DEFAULT_SPEAKER_TIME_SECONDS
        : getSeconds(caucus.speakerDuration, caucus.speakerUnit);

      putSpeaking(committeeID, caucusID, {
        who: proposer,
        stance: Stance.For,
        duration: speakerSeconds
      });

    } else if (motionData.type === MotionType.CloseModeratedCaucus && caucusID) {
      this.props.history
        .push(`/committees/${committeeID}/caucuses/${caucusID}`);

      closeCaucus(committeeID, caucusID);
    } else if (motionData.type === MotionType.IntroduceAmendment && resolutionID && proposer) {
      this.props.history
        .push(`/committees/${committeeID}/resolutions/${resolutionID}`);

      const newAmendment: AmendmentData = {
        ...DEFAULT_AMENDMENT,
        text: proposal,
        proposer: proposer
      };

      putAmendment(committeeID, resolutionID, newAmendment);
    } else if (motionData.type === MotionType.VoteOnResolution && resolutionID) {
      this.props.history
        .push(`/committees/${committeeID}/resolutions/${resolutionID}/voting`);

    } else if (motionData.type === MotionType.ProposeStrawpoll) {
      const strawpollRef = putStrawpoll(committeeID, {
        ...DEFAULT_STRAWPOLL,
        question: proposal
      });

      this.props.history
        .push(`/committees/${committeeID}/strawpolls/${strawpollRef.key}`);
    }
  }

  renderMotion = (id: MotionID, motionData: MotionData, motionFref: firebase.database.Reference) => {
    const { handleApproveMotion } = this;
    const { committee } = this.state;
    const { proposer, proposal, type, caucusUnit, caucusDuration, speakerUnit,
      speakerDuration, seconder, caucusTarget, resolutionTarget } = motionData;

    const caucus = recoverCaucus(committee, caucusTarget || '');
    const caucusTargetText = caucus ? caucus.name : caucusTarget;

    const resolution = recoverResolution(committee, resolutionTarget || '');
    const resolutionTargetText = resolution ? resolution.name : resolutionTarget;


    const renderVoteCount = () => {
      const { voterID } = this.props;
      const votes = motionData.votes ?? {};

      // Remove vote if same vote, otherwise change vote
      const vote = (vote: MotionVote) => {
        if (votes[voterID] === vote) {
          motionFref.child('votes').child(voterID).remove();
        } else {
          motionFref.child('votes').child(voterID).set(vote);
        }
      }

      const counts = _.countBy(Object.values(votes))

      return (
        <Button.Group>
          <Popup
            content="Against"
            trigger={
              <Button
                color='red'
                active={votes[voterID] === MotionVote.Against}
                onClick={() => vote(MotionVote.Against)}
              >
                <Icon name={
                  votes[voterID] === MotionVote.Against
                    ? "thumbs down"
                    : "thumbs down outline"}
                />
                {counts[MotionVote.Against] ?? 0}
              </Button>
            }
          />
          <Popup
            content="Abstain"
            trigger={
              <Button
                color='yellow'
                active={votes[voterID] === MotionVote.Abstain}
                onClick={() => vote(MotionVote.Abstain)}
              >
                <Icon name={
                  votes[voterID] === MotionVote.Abstain
                    ? "circle"
                    : "circle outline"}
                />
                {counts[MotionVote.Abstain] ?? 0}
              </Button>
            } />
          <Popup
            content="In favour"
            trigger={
              <Button
                color='green'
                active={votes[voterID] === MotionVote.For}
                onClick={() => vote(MotionVote.For)}
              >
                <Icon name={
                  votes[voterID] === MotionVote.For
                    ? "thumbs up"
                    : "thumbs up outline"}
                />
                {counts[MotionVote.For] ?? 0}
              </Button>
            } />
        </Button.Group>
      )
    }

    const descriptionTree = (
      <Card.Description>
        <Label horizontal>
          {detailLabel(type)}
        </Label>
        {proposal}
      </Card.Description>
    );

    // TODO: we definately can add links here
    const proposerTree = (
      <div>
        <Label horizontal>
          Proposer
        </Label>
        <Flag name={parseFlagName(proposer || '')} /> {proposer}
      </div>
    );

    const seconderTree = (
      <div>
        <Label horizontal>
          Seconder
        </Label>
        <Flag name={parseFlagName(seconder || '')} /> {seconder}
      </div>
    );

    const caucusTargetTree = (
      <div>
        <Label horizontal>
          Target caucus
        </Label>
        {caucusTargetText}
      </div>
    );

    const resolutionTargetTree = (
      <div>
        <Label horizontal>
          Target resolution
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
        className="motion"
        key={id}
      >
        <Card.Content>
          <Card.Header>
            {showMotionType(type, time)}
          </Card.Header>
          <Card.Meta>
            {proposerTree}
            {hasSeconder(type) && seconderTree}
            {hasCaucusTarget(type) && caucusTargetTree}
            {hasResolutionTarget(type) && resolutionTargetTree}
          </Card.Meta>
          {hasDetail(type) && descriptionTree}
        </Card.Content>
        <Button.Group fluid attached="bottom">
          <Button
            basic
            negative
            onClick={() => motionFref.child('deleted').set(true)}
          >
            Delete
          </Button>
          {recoverSettings(committee).motionVotes && renderVoteCount()}
          {approvable(type) && <Button
            disabled={motionData.proposer === ''}
            basic
            positive
            onClick={() => handleApproveMotion(motionFref, motionData)}
          >
            {actionName(type)}
          </Button>}
        </Button.Group>
      </Card>
    );
  }

  hasDivisiblityError = () => {
    const { type, caucusDuration, caucusUnit, speakerDuration, speakerUnit } = this.state.newMotion;

    const caucusSeconds = getSeconds(caucusDuration || 0, caucusUnit);
    const speakerSeconds = getSeconds(speakerDuration || 0, speakerUnit);

    const doesNotEvenlyDivide = (caucusSeconds % speakerSeconds) !== 0;

    return hasSpeakers(type) && hasDuration(type) && doesNotEvenlyDivide;
  }

  hasIdenticalProposerSeconder = () => {
    const { proposer, seconder } = this.state.newMotion;

    return proposer && seconder ? proposer === seconder : false;
  }

  renderAdder = (committee?: CommitteeData): JSX.Element => {
    const { newMotion } = this.state;
    const { proposer, proposal, type, caucusUnit, caucusDuration, speakerUnit,
      speakerDuration, seconder, caucusTarget, resolutionTarget } = newMotion;

    const boxForAmmendments = (
      <Form.TextArea
        value={proposal}
        autoHeight
        onChange={stateTextAreaHandler<Props, State>(this, 'newMotion', 'proposal')}
        rows={2}
        label={detailLabel(newMotion.type)}
        placeholder={detailLabel(newMotion.type)}
      />
    );

    const boxForNames = (
      <Form.Input
        label="Name"
        placeholder="Name"
        value={proposal}
        onChange={stateFieldHandler<Props, State>(this, 'newMotion', 'proposal')}
        fluid
      />
    );

    const description = (
      <Form.Group widths="equal">
        {hasTextArea(newMotion.type)
          ? boxForAmmendments
          : boxForNames
        }
      </Form.Group>
    );

    const speakerSetter = (
      <TimerSetter
        error={this.hasDivisiblityError()}
        unitValue={speakerUnit}
        durationValue={speakerDuration ? speakerDuration.toString() : undefined}
        onUnitChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'speakerUnit')}
        onDurationChange={stateValidatedNumberFieldHandler<Props, State>(this, 'newMotion', 'speakerDuration')}
        label="Speaking time"
      />
    );

    const durationSetter = (
      <TimerSetter
        error={this.hasDivisiblityError()}
        unitValue={caucusUnit}
        durationValue={caucusDuration ? caucusDuration.toString() : undefined}
        onUnitChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'caucusUnit')}
        onDurationChange={stateValidatedNumberFieldHandler<Props, State>(this, 'newMotion', 'caucusDuration')}
        label="Duration"
      />
    );

    const { caucuses, resolutions } = this.state.committee || { caucuses: {}, resolutions: {} };

    // BADCODE: Filter predicate shared with menu in Committee, also update when changing
    // Prioritize recency
    const caucusOptions = Object.keys(caucuses || {}).filter(key =>
      caucuses![key].status === CaucusStatus.Open.toString()
    ).map(key =>
      ({ key: key, value: key, text: caucuses![key].name })
    );

    // Prioritize recency
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
        error={!caucusTarget}
        loading={!committee}
        onChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'caucusTarget')}
        options={caucusOptions}
        icon="search"
        label="Target caucus"
      />
    );

    const resolutionTargetSetter = (
      <Form.Dropdown
        key="resolutionTarget"
        value={resolutionTarget}
        search
        selection
        fluid
        error={!resolutionTarget}
        loading={!committee}
        onChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'resolutionTarget')}
        options={resolutionOptions}
        icon="search"
        label="Target resolution"
      />
    );

    const setters = (
      <Form.Group widths="equal">
        {hasCaucusTarget(type) && caucusTargetSetter}
        {hasResolutionTarget(type) && resolutionTargetSetter}
        {hasDuration(type) && durationSetter}
        {hasSpeakers(type) && speakerSetter}
      </Form.Group>
    );

    const memberOptions = recoverPresentMemberOptions(this.state.committee);

    const proposerTree = (
      <Form.Dropdown
        icon="search"
        key="proposer"
        value={proposer ? nameToMemberOption(proposer).key : false}
        search
        error={!proposer || this.hasIdenticalProposerSeconder()}
        loading={!committee}
        selection
        fluid
        onChange={stateMemberDropdownHandler<Props, State>(this, 'newMotion', 'proposer', memberOptions)}
        options={memberOptions}
        label="Proposer"
      />
    );

    const seconderTree = (
      <Form.Dropdown
        icon="search"
        key="seconder"
        error={!seconder || this.hasIdenticalProposerSeconder()}
        value={seconder ? nameToMemberOption(seconder).key : false}
        loading={!committee}
        search
        selection
        fluid
        onChange={stateMemberDropdownHandler<Props, State>(this, 'newMotion', 'seconder', memberOptions)}
        options={memberOptions}
        label="Seconder"
      />
    );

    const hasError = this.hasDivisiblityError() || this.hasIdenticalProposerSeconder();

    return (
      <Form
        error={hasError}
      >
        <Form.Dropdown
          placeholder="Select type"
          search
          selection
          fluid
          label="Type"
          icon="search"
          options={MOTION_TYPE_OPTIONS}
          onChange={stateDropdownHandler<Props, State>(this, 'newMotion', 'type')}
          value={type}
        />
        {hasDetail(type) && description}
        <Form.Group widths="equal">
          {proposerTree}
          {hasSeconder(type) && seconderTree}
        </Form.Group>
        {(hasSpeakers(type)
          || hasDuration(type)
          || hasCaucusTarget(type)
          || hasResolutionTarget(type)
        ) && setters}
        {this.hasDivisiblityError() && DIVISIBILITY_ERROR}
        {this.hasIdenticalProposerSeconder() && IDENTITCAL_PROPOSER_SECONDER}
        <Button
          icon="plus"
          basic
          primary
          fluid
          disabled={!proposer
            || !implies(hasSeconder(type), !!seconder)
            || !implies(hasCaucusTarget(type), !!caucusTarget)
            || !implies(hasResolutionTarget(type), !!resolutionTarget)
            || hasError
          }
          onClick={this.handlePushMotion}
        />
      </Form>
    );
  }

  renderMotions = (motions: Record<MotionID, MotionData>) => {
    const { renderMotion } = this;
    const { committeeFref } = this.state;

    return Object.keys(motions)
      .filter(key => !motions[key].deleted)
      .sort((a, b) => {
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
    const { committee, committeeFref } = this.state;
    const { committeeID } = this.props.match.params;
    const { operative } = makeCommitteeStats(this.state.committee);

    const renderedMotions = committee
      ? renderMotions(committee.motions || {} as Record<string, MotionData>)
      : []; // TODO: This could probably do with a nice spinner

    return (
      <Container text style={{ padding: '1em 0em' }}>
        {renderAdder(committee)}
        <Divider hidden />
        <Checkbox
          label="Delegates can vote on motions"
          toggle
          checked={recoverSettings(committee).motionVotes}
          onChange={
            checkboxHandler<SettingsData>(
              committeeFref.child('settings'),
              'motionVotes')}
        />
        {recoverSettings(committee).motionVotes
          && <MotionsShareHint committeeID={committeeID} />}
        <Divider />
        <Icon name="sort numeric ascending" /> Sorted from most to least disruptive. {operative} votes required to pass a motion
        <Button
          negative
          disabled={renderedMotions.length <= 0}
          floated="right"
          icon="eraser"
          content="Clear"
          compact
          basic
          onClick={this.handleClearMotions}
        />
        <Divider hidden />
        <Card.Group
          itemsPerRow={1}
        >
          {renderedMotions}
        </Card.Group>
      </Container>
    );
  }
}

export default function Motions(props: Props) {
  const [voterID] = useVoterID();

  return <MotionsComponent {...props} voterID={voterID} />
}
