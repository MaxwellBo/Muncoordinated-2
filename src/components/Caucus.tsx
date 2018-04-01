import * as React from 'react';
import * as firebase from 'firebase';
import { Timer, TimerData, DEFAULT_TIMER } from './Timer';
import { RouteComponentProps } from 'react-router';
import { MemberID, MemberData, nameToCountryOption, parseFlagName } from './Member';
import { CommitteeID, CommitteeData } from './Committee';
import CaucusQueuer from './CaucusQueuer';
import * as Utils from '../utils';
import {
  Segment, Dimmer, Header, Dropdown, TextArea, Input, Button, Icon, Grid, Feed, Flag,
  Label, Form, Message
} from 'semantic-ui-react';
import { COUNTRY_OPTIONS, CountryOption } from '../constants';
import { textAreaHandler, dropdownHandler, fieldHandler } from '../actions/handlers';
import { makeDropdownOption } from '../utils';
import { URLParameters } from '../types';
import { Loading } from './Loading';

interface CaucusProps extends RouteComponentProps<URLParameters> {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface CaucusState {
  speakerTimer: TimerData;
  caucusTimer: TimerData;
}

export type CaucusID = string;

export enum CaucusStatus {
  Open = 'Open',
  Closed = 'Closed'
}

export enum Stance {
  For = 'For',
  Neutral = 'Neutral',
  Against = 'Against'
}

export interface CaucusData {
  name: string;
  topic: string;
  status: CaucusStatus;
  speakerTimer: TimerData;
  caucusTimer: TimerData;
  speaking?: SpeakerEvent;
  queue?: Map<string, SpeakerEvent>;
  history?: Map<string, SpeakerEvent>;
  deleted?: boolean; // FIXME: Needs migration to default false
}

export interface SpeakerEvent {
  who: string; // FIXME: @mbo you dumb fuck, this was meant to be MemberID, not their fucking name
  stance: Stance;
  duration: number;
}

const DEFAULT_SPEAKER_EVENT = {
  who: '',
  stance: Stance.Neutral,
  duration: 0
};

const CAUCUS_STATUS_OPTIONS = [
  CaucusStatus.Open,
  CaucusStatus.Closed
].map(makeDropdownOption);

const StanceIcon = (props: { stance: Stance }) => {
  switch (props.stance) {
    case Stance.For:
      return <Icon name="thumbs outline up" />;
    case Stance.Against:
      return <Icon name="thumbs outline down" />;
    default:
      return <Icon name="hand outline right" />;
  }
};

export const DEFAULT_CAUCUS: CaucusData = {
  name: 'Genearal Speaker\'s List',
  topic: '',
  status: CaucusStatus.Open,
  speakerTimer: { remaining: 60, elapsed: 0, ticking: false },
  caucusTimer: { remaining: 60 * 10, elapsed: 0, ticking: false },
  queue: {} as Map<string, SpeakerEvent>,
  history: {} as Map<string, SpeakerEvent>,
};

function CaucusHeader(props: { data: CaucusData, fref: firebase.database.Reference }) {
  const statusDropdown = (
    <Dropdown 
      value={props.data.status} 
      options={CAUCUS_STATUS_OPTIONS} 
      onChange={dropdownHandler<CaucusData>(props.fref, 'status')} 
    /> 
  );

  return (
    // TODO: Loading spinners
    <Segment>
      <Input
        label={statusDropdown}
        labelPosition="right"
        value={props.data.name}
        onChange={fieldHandler<CaucusData>(props.fref, 'name')}
        attatched="top"
        size="massive"
        fluid
        placeholder="Caucus Name"
      />
      <Form>
        <TextArea
          value={props.data.topic}
          autoHeight
          onChange={textAreaHandler<CaucusData>(props.fref, 'topic')}
          attatched="top"
          fluid
          rows={1}
          placeholder="Caucus Topic"
        />
      </Form>
    </Segment>
  );
}

function CaucusMeta(props: { data: CaucusData, fref: firebase.database.Reference }) {
  // TODO: Make status either a dropdown or a checkbox / on/off slider
  return (
    <Segment attached>
      <Button
        basic
        icon
        negative
        labelPosition="left"
        onClick={() => props.fref.child('deleted').set(true)}
      >
        <Icon name="trash" />
        Delete
      </Button>
    </Segment>
  );
}

function SpeakerEvents(props: {
  data?: Map<string, SpeakerEvent>,
  fref: firebase.database.Reference,
  speaking?: SpeakerEvent,
  speakerTimer: TimerData
}) {
  const events = props.data ? props.data : {};

  const eventItems = Object.keys(events).map(key =>
    (
      <SpeakerEvent
        key={key}
        data={events[key]}
        fref={props.fref.child(key)}
        speaking={props.speaking}
        speakerTimer={props.speakerTimer}
      />
    )
  );

  return (
    <Feed size="large">
      {eventItems}
    </Feed>
  );
}

function SpeakerEvent(local: { 
  data?: SpeakerEvent, 
  speaking?: SpeakerEvent,
  fref: firebase.database.Reference, 
  speakerTimer: TimerData
}) {
  const yieldHandler = () => {
    const queueHeadDetails = {
      queueHeadData: local.data,
      queueHead: local.fref
    };

    // HACK
    // HERE BE DRAGONS
    // The only reason I'm doing this is because I honestly couldn't give a shit about propogating
    // the caucusRef all the way down. Furthermore, the only time this should ever be called is when the 
    // SpeakerEvent is in the "queue" zone, meaning we'll pop up into the "caucus" field.
    const caucusRef = (local.fref.parent as firebase.database.Reference).parent as firebase.database.Reference;

    const lifecycle: Lifecycle = {
      history: caucusRef.child('history'),
      speaking: caucusRef.child('speaking'),
      speakingData: local.speaking,
      timerData: local.speakerTimer,
      timer: caucusRef.child('speakerTimer'),
      yielding: true,
    };

    runLifecycle({ ...lifecycle, ...queueHeadDetails });
  };

  return local.data ? (
    <Feed.Event>
      {/* <Feed.Label image='/assets/images/avatar/small/helen.jpg' /> */}
      <Feed.Content>
        <Feed.Summary>
          <Feed.User>
            <Flag name={parseFlagName(local.data.who) as any} />
            {local.data.who}
          </Feed.User>
          <Feed.Date>{local.data.duration.toString() + ' seconds'}</Feed.Date>
        </Feed.Summary>
        <Feed.Meta>
          <Feed.Like>
            <StanceIcon stance={local.data.stance} />
            {local.data.stance}
          </Feed.Like>
          <Label size="mini" as="a" onClick={() => local.fref.remove()}>
            Remove
          </Label>
          {local.speaking && (<Label size="mini" as="a" onClick={yieldHandler}>
            Yield
          </Label>)}
        </Feed.Meta>
      </Feed.Content>
    </Feed.Event>
  ) : <Feed.Event />;
}

interface Lifecycle {
  history: firebase.database.Reference;
  speakingData?: SpeakerEvent;
  speaking: firebase.database.Reference;
  timerData: TimerData;
  timer: firebase.database.Reference;
  yielding: boolean;
  queueHeadData?: SpeakerEvent;
  queueHead?: firebase.database.Reference;
}

function runLifecycle(lifecycle: Lifecycle) {
  const { history, speakingData, speaking, timerData, timer, yielding, queueHeadData, queueHead } = lifecycle;

  let additionalYieldTime = 0;

  // Move the person currently speaking into history...
  if (speakingData) {
    history.push().set({ ...speakingData, duration: timerData.elapsed });
    speaking.set(null);

    if (yielding) {
      additionalYieldTime = timerData.remaining;
    }

    timer.update({
      elapsed: 0,
      remaining: 60,
      ticking: false // and stop it
    });
  } // do nothing if no-one is currently speaking

  if (queueHead && queueHeadData) {
    speaking.set({
      ...queueHeadData,
      duration: queueHeadData.duration + additionalYieldTime
    });

    timer.update({
      elapsed: 0,
      remaining: queueHeadData.duration + additionalYieldTime, // load the appropriate time 
      ticking: false // and stop it
    });

    queueHead.set(null);
  }
}

interface CaucusNextSpeakingProps {
  data: CaucusData;
  speakerTimer: TimerData;
  fref: firebase.database.Reference;
}

class CaucusNextSpeaking extends React.Component<CaucusNextSpeakingProps, {}> {

  constructor(props: CaucusNextSpeakingProps) {
    super(props);
  }

  handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.keyCode === 78 && ev.altKey) {
      this.nextSpeaker();
    }
  }

  componentDidMount() {
    const { handleKeyDown } = this;
    document.addEventListener<'keydown'>('keydown', handleKeyDown);
  }

  componentWillUnmount() {
    const { handleKeyDown } = this;
    document.removeEventListener('keydown', handleKeyDown);
  }

  nextSpeaker = () => {
    const { props } = this;

    let queue = props.data.queue ? props.data.queue : {};

    const queueHeadKey = Object.keys(queue)[0];

    let queueHeadDetails = {};

    if (queueHeadKey) {
      queueHeadDetails = {
        queueHeadData: queue[queueHeadKey],
        queueHead: props.fref.child('queue').child(queueHeadKey)
      };
    }

    const lifecycle: Lifecycle = {
      history: props.fref.child('history'),
      speakingData: props.data.speaking,
      speaking: props.fref.child('speaking'),
      timerData: props.speakerTimer,
      timer: props.fref.child('speakerTimer'),
      yielding: false,
    };

    runLifecycle({ ...lifecycle, ...queueHeadDetails });
  }

  render() {
    const { nextSpeaker, props } = this;

    return (
      <div>
        <Header as="h3" attached="top">Next Speaking</Header>
        <Segment attached>
          <SpeakerEvents 
            data={props.data.queue} 
            fref={props.fref.child('queue')} 
            speaking={props.data.speaking} 
            speakerTimer={props.speakerTimer} 
          />
        </Segment>
        <Segment attached="bottom" textAlign="center">
          <Button
            basic
            primary
            onClick={nextSpeaker}
          >
            {/* <Icon name="arrow up" /> */}
            Next
          </Button>
          <Button
            basic
            negative
            onClick={() => props.fref.child('queue').remove()}
          >
            {/* <Icon name="refresh" /> */}
            Clear
          </Button>
        </Segment>
      </div>
    );
  }
}

export class Caucus extends React.Component<CaucusProps, CaucusState> {
  constructor(props: CaucusProps) {
    super(props);

    this.state = {
      caucusTimer: DEFAULT_CAUCUS.caucusTimer,
      speakerTimer: DEFAULT_CAUCUS.speakerTimer
    };
  }

  CaucusNowSpeaking = (props: { data: CaucusData, fref: firebase.database.Reference }) => {
    const { speakerTimer } = this.state;

    return (
      <div>
        <Header as="h3" attached="top">Now Speaking</Header>
        <Segment attached="bottom">
          <Feed size="large">
            <SpeakerEvent data={props.data.speaking} fref={props.fref.child('speaking')} speakerTimer={speakerTimer}/>
          </Feed>
        </Segment>
      </div>
    );
  }

  CaucusView = (props:
    {
      caucusID: CaucusID, 
      data: CaucusData, 
      members: Map<MemberID, MemberData>,
      fref: firebase.database.Reference
    }) => {

    const { speakerTimer } = this.state;

    return props.data ? (
      <Grid columns="equal">
        <Grid.Row>
          <Grid.Column>
            <CaucusHeader data={props.data} fref={props.fref} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <this.CaucusNowSpeaking data={props.data} fref={props.fref} />
            <CaucusNextSpeaking data={props.data} fref={props.fref} speakerTimer={speakerTimer} />
            <CaucusQueuer data={props.data} members={props.members} fref={props.fref} />
          </Grid.Column>
          <Grid.Column>
            <Timer
              name="Speaker Timer"
              fref={props.fref.child('speakerTimer')}
              key={props.caucusID + 'speakerTimer'}
              onChange={(timer) => this.setState({ speakerTimer: timer })}
              toggleKeyCode={83} // S
            />
            <Timer
              name="Caucus Timer"
              fref={props.fref.child('caucusTimer')}
              key={props.caucusID + 'caucusTimer'}
              onChange={(timer) => this.setState({ caucusTimer: timer })}
              toggleKeyCode={67} // C
            />
          </Grid.Column>
        </Grid.Row>
        {/* <Grid.Row>

          <Grid.Column>
            <CaucusMeta data={props.data} fref={props.fref} />

          </Grid.Column>
        </Grid.Row> */}
      </Grid >
    ) : (
        <Loading />
      );
  }

  render() {
    const caucusID: CaucusID = this.props.match.params.caucusID;
    const caucuses = this.props.committee.caucuses || {} as Map<CaucusID, CaucusData>;
    const caucus = caucuses[caucusID];

    if (caucus) {

      const members = this.props.committee.members || {} as Map<MemberID, MemberData>;

      if (!caucus.deleted) {
        return (
          <this.CaucusView
            caucusID={caucusID}
            data={caucus}
            members={members}
            fref={this.props.fref.child('caucuses').child(caucusID)}
          />
        );
      } else {
        return (
          <Message negative compact>
            <Message.Header>Caucus deleted</Message.Header>
          </Message>
        );
      }
    } else {
      return <Loading />;
    }
  }
}
