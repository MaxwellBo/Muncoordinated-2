import * as React from 'react';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import {
  Segment, Dropdown, TextArea, Input, Grid, Feed,
  Label, Form, Container
} from 'semantic-ui-react';
import Timer, { TimerData, DEFAULT_TIMER } from './Timer';
import { RouteComponentProps } from 'react-router';
import { MemberData } from './Member';
import { CommitteeData } from './Committee';
import CaucusQueuer from './caucus/CaucusQueuer';
import { textAreaHandler, dropdownHandler, fieldHandler } from '../actions/handlers';
import { makeDropdownOption } from '../utils';
import { URLParameters } from '../types';
import { CaucusNextSpeaking } from './caucus/CaucusNextSpeaking';
import { SpeakerEvent, SpeakerFeedEntry } from './caucus/SpeakerFeed';
import { DEFAULT_SETTINGS } from './Settings';
import { NotFound } from './NotFound';
import { Unit } from './TimerSetter';

export const recoverUnit = (caucus?: CaucusData): Unit => {
  return caucus ? (caucus.speakerUnit || Unit.Seconds) : Unit.Seconds;
};

export const recoverDuration = (caucus?: CaucusData): number | undefined => {
  return caucus
    ? caucus.speakerDuration
      ? caucus.speakerDuration
      : undefined
    : undefined;
};

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  speakerTimer: TimerData;
  caucusTimer: TimerData;
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
  loading: boolean;
}

export type CaucusID = string;

export enum CaucusStatus {
  Open = 'Open',
  Closed = 'Closed'
}

export interface CaucusData {
  name: string;
  topic: string;
  status: CaucusStatus;
  speakerTimer: TimerData;
  speakerDuration?: number; // TODO: Migrate
  speakerUnit?: Unit; // TODO: Migrate
  caucusTimer: TimerData;
  queueIsPublic?: boolean; // TODO: Migrate
  speaking?: SpeakerEvent;
  queue?: Map<string, SpeakerEvent>;
  history?: Map<string, SpeakerEvent>;
}

const CAUCUS_STATUS_OPTIONS = [
  CaucusStatus.Open,
  CaucusStatus.Closed
].map(makeDropdownOption);

export const DEFAULT_CAUCUS: CaucusData = {
  name: 'untitled caucus',
  topic: '',
  status: CaucusStatus.Open,
  speakerTimer: { ...DEFAULT_TIMER, remaining: 60 },
  speakerDuration: 60,
  speakerUnit: Unit.Seconds,
  caucusTimer: { ...DEFAULT_TIMER, remaining: 60 * 10 },
  queueIsPublic: false,
  queue: {} as Map<string, SpeakerEvent>,
  history: {} as Map<string, SpeakerEvent>,
};

export default class Caucus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees').child(match.params.committeeID),
      caucusTimer: DEFAULT_CAUCUS.caucusTimer,
      speakerTimer: DEFAULT_CAUCUS.speakerTimer,
      loading: true
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val(), loading: false });
    }
  }

  // XXX: I'm worried that this might be the source of a bug that I'm yet to observe
  // Say our route changes the committeeID, _but does not unmount the caucus component_
  // Will these listeners be purged?
  componentDidMount() {
    this.state.committeeFref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    this.state.committeeFref.off('value', this.firebaseCallback);
  }

  recoverCaucusFref = () => {
    const caucusID: CaucusID = this.props.match.params.caucusID;

    return this.state.committeeFref
      .child('caucuses')
      .child(caucusID);
  }

  renderHeader = (caucus?: CaucusData) => {
    const caucusFref = this.recoverCaucusFref();

    const statusDropdown = (
      <Dropdown 
        value={caucus ? caucus.status : CaucusStatus.Open} 
        options={CAUCUS_STATUS_OPTIONS} 
        onChange={dropdownHandler<CaucusData>(caucusFref, 'status')} 
      /> 
    );

    return (
      <Segment loading={!caucus}>
        <Input
          label={statusDropdown}
          labelPosition="right"
          value={caucus ? caucus.name : ''}
          onChange={fieldHandler<CaucusData>(caucusFref, 'name')}
          attatched="top"
          size="massive"
          fluid
          placeholder="Set caucus name"
        />
        <Form>
          <TextArea
            value={caucus ? caucus.topic : ''}
            autoHeight
            onChange={textAreaHandler<CaucusData>(caucusFref, 'topic')}
            attatched="top"
            rows={1}
            placeholder="Set caucus details"
          />
        </Form>
      </Segment>
    );
  }

  renderNowSpeaking =  (caucus?: CaucusData) => {
    const { speakerTimer } = this.state;
    
    const caucusFref = this.recoverCaucusFref();

    const entryData = caucus ? caucus.speaking : undefined;

    return (
      <Segment loading={!caucus}>
        <Label attached="top left" size="large">Now Speaking</Label>
        <Feed size="large">
          <SpeakerFeedEntry data={entryData} fref={caucusFref.child('speaking')} speakerTimer={speakerTimer}/>
        </Feed>
      </Segment>
    );
  }

  renderCaucus = (caucus?: CaucusData) => {
    const { renderNowSpeaking, renderHeader, recoverCaucusFref } = this;
    const { speakerTimer, committee } = this.state;

    const { caucusID } = this.props.match.params;
    const caucusFref = recoverCaucusFref();

    const members = committee ? (committee.members || {} as Map<string, MemberData>) : undefined;

    const renderedSpeakerTimer = (
      <Timer
        name="Speaker Timer"
        timerFref={caucusFref.child('speakerTimer')}
        key={caucusID + 'speakerTimer'}
        onChange={(timer) => this.setState({ speakerTimer: timer })}
        toggleKeyCode={83} // S - if changing this, update Help
        defaultUnit={recoverUnit(caucus)}
        defaultDuration={recoverDuration(caucus) || 60}
      />
    );

    const renderedCaucusTimer = (
      <Timer
        name="Caucus Timer"
        timerFref={caucusFref.child('caucusTimer')}
        key={caucusID + 'caucusTimer'}
        onChange={(timer) => this.setState({ caucusTimer: timer })}
        toggleKeyCode={67} // C - if changing this, update Help
        defaultUnit={Unit.Minutes}
        defaultDuration={10}
      />
    );

    const header = (
      <Grid.Row>
        <Grid.Column>
          {renderHeader(caucus)}
        </Grid.Column>
      </Grid.Row>
    );

    let timersInSeparateColumns: boolean = DEFAULT_SETTINGS.timersInSeparateColumns;
    let moveQueueUp: boolean = DEFAULT_SETTINGS.moveQueueUp;
    let autoNextSpeaker: boolean = DEFAULT_SETTINGS.autoNextSpeaker;

    if (committee) {
      if (committee.settings.timersInSeparateColumns !== undefined) {
        timersInSeparateColumns = committee.settings.timersInSeparateColumns;
      }

      if (committee.settings.moveQueueUp !== undefined) {
        moveQueueUp = committee.settings.moveQueueUp;
      }

      if (committee.settings.autoNextSpeaker !== undefined) {
        autoNextSpeaker = committee.settings.autoNextSpeaker;
      }
    }

    const renderedCaucusQueuer = (
      <CaucusQueuer 
        caucus={caucus} 
        members={members} 
        caucusFref={caucusFref} 
      />
    );

    const renderedCaucusNextSpeaking = (
      <CaucusNextSpeaking 
        caucus={caucus} 
        fref={caucusFref} 
        speakerTimer={speakerTimer} 
        autoNextSpeaker={autoNextSpeaker}
      />
    );

    const body = !timersInSeparateColumns ? (
      <Grid.Row>
        <Grid.Column>
          {renderNowSpeaking(caucus)}
          {moveQueueUp && renderedCaucusQueuer}
          {renderedCaucusNextSpeaking}
          {!moveQueueUp && renderedCaucusQueuer}
        </Grid.Column>
        <Grid.Column>
          {renderedSpeakerTimer}
          {renderedCaucusTimer}
        </Grid.Column>
      </Grid.Row>
    ) : (
      <Grid.Row>
        <Grid.Column>
          {renderedSpeakerTimer}
          {renderNowSpeaking(caucus)}
          {renderedCaucusNextSpeaking}
        </Grid.Column>
        <Grid.Column>
          {renderedCaucusTimer}
          {renderedCaucusQueuer}
        </Grid.Column>
      </Grid.Row>
    );

    return (
      <Container>
        <Grid columns="equal" stackable>
          {header}
          {body}
        </Grid >
      </Container>
    );
  }

  render() {
    const { committee, loading } = this.state;
    const caucusID: CaucusID = this.props.match.params.caucusID;

    const caucuses = committee ? committee.caucuses : {};
    const caucus = (caucuses || {})[caucusID];

    if (!loading && !caucus) {
      return (
        <Container text>
          <NotFound item="caucus" id={caucusID} />
        </Container>
      );
    } else {
      return this.renderCaucus(caucus);
    }
  }
}
