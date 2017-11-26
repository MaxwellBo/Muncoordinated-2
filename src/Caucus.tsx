import * as React from 'react';
import * as firebase from 'firebase';
import { Timer, TimerData, DEFAULT_TIMER } from './Timer';
import { RouteComponentProps } from 'react-router';
import { MemberID, MemberData, parseCountryOption } from './Member';
import { CommitteeID, CommitteeData } from './Committee';
import * as Utils from './utils';
import {
  Segment, Loader, Dimmer, Header, Dropdown, Input, Button, Icon, Grid, Feed, Flag,
  Label
} from 'semantic-ui-react';
import { COUNTRY_OPTIONS, CountryOption } from './common';

interface URLParameters {
  caucusID: CaucusID;
  committeeID: CommitteeID;
}

interface Props extends RouteComponentProps<URLParameters> {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface State {
  queueCountry: CountryOption;
  speakerTimer: TimerData;
  caucusTimer: TimerData;
}

export type CaucusID = string;

enum CaucusStatus {
  Open = 'Open',
  Closed = 'Closed'
}

enum Stance {
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
}

export interface SpeakerEvent {
  who: MemberID;
  stance: Stance;
  duration: number;
}

const DEFAULT_SPEAKER_EVENT = {
  who: '',
  stance: Stance.Neutral,
  duration: 0
};

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
  const propertyHandler = (field: string) => (e: React.FormEvent<HTMLInputElement>) =>
    props.fref.child(field).set(e.currentTarget.value);

  const statusHandler = (event: any, data: any) => {
    props.fref.child('status').set(data.value);
  };

  const CAUCUS_STATUS_OPTIONS = [
    { key: CaucusStatus.Open, text: CaucusStatus.Open, value: CaucusStatus.Open },
    { key: CaucusStatus.Closed, text: CaucusStatus.Closed, value: CaucusStatus.Closed },
  ];

  return (
    <Segment>
      <Input
        label={<Dropdown value={props.data.status} options={CAUCUS_STATUS_OPTIONS} onChange={statusHandler} />}
        labelPosition="right"
        value={props.data.name}
        onChange={propertyHandler('name')}
        attatched="top"
        size="massive"
        fluid
        placeholder="Caucus Name"
      />
      <Input
        value={props.data.topic}
        onChange={propertyHandler('topic')}
        attatched="top"
        fluid
        placeholder="Caucus Topic"
      />
    </Segment>
  );
}

function CaucusMeta(props: { data: CaucusData, fref: firebase.database.Reference }) {
  const makeHandler = (field: string) => (e: React.FormEvent<HTMLInputElement>) =>
    props.fref.child(field).set(e.currentTarget.value);

  // TODO: Make status either a dropdown or a checkbox / on/off slider
  return (
    <Segment attached>
      <Button
        icon
        negative
        labelPosition="left"
        onClick={() => props.fref.remove()}
      >
        <Icon name="trash" />
        Delete
      </Button>
    </Segment>
  );
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

export class Caucus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      queueCountry: COUNTRY_OPTIONS[0],
      caucusTimer: DEFAULT_CAUCUS.caucusTimer,
      speakerTimer: DEFAULT_CAUCUS.speakerTimer
    };
  }

  CaucusQueuer = (props:
    { data: CaucusData, members: Map<string, MemberData>, fref: firebase.database.Reference }) => {
    const stanceHandler = (stance: Stance) => () => {
      const newEvent: SpeakerEvent = {
        who: this.state.queueCountry.text,
        stance: stance,
        duration: 60
      };

      props.fref.child('queue').push().set(newEvent);
    };

    const countryOptions: CountryOption[] = 
      Utils.objectToList(props.members).map(x => parseCountryOption(x.name));

    const countryHandler = (event: any, data: any) => {
      this.setState({ queueCountry: countryOptions.filter(c => c.value === data.value)[0] });
    };

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

  SpeakerEvent = (local: { 
    data?: SpeakerEvent, 
    speaking?: SpeakerEvent,
    fref: firebase.database.Reference, 
  }) => {
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
        timerData: this.state.speakerTimer,
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
              <Flag name={local.data.who.toLowerCase() as any} />
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

  SpeakerEvents = (props: {
    data?: Map<string, SpeakerEvent>,
    fref: firebase.database.Reference,
    speaking?: SpeakerEvent
  }) => {
    const events = props.data ? props.data : {};

    const eventItems = Object.keys(events).map(key =>
      (
      <this.SpeakerEvent 
        key={key} 
        data={events[key]} 
        fref={props.fref.child(key)} 
        speaking={props.speaking}
      />
      )
    );

    return (
      <Feed size="large">
        {eventItems}
      </Feed>
    );
  }

  CaucusNowSpeaking = (props: { data: CaucusData, fref: firebase.database.Reference }) => {
    return (
      <div>
        <Header as="h3" attached="top">Now Speaking</Header>
        <Segment attached="bottom">
          <Feed size="large">
            <this.SpeakerEvent data={props.data.speaking} fref={props.fref.child('speaking')} />
          </Feed>
        </Segment>
      </div>
    );
  }

  CaucusNextSpeaking = (props: { data: CaucusData, fref: firebase.database.Reference }) => {
    const nextSpeaker = () => {

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
        timerData: this.state.speakerTimer,
        timer: props.fref.child('speakerTimer'),
        yielding: false,
      };

      runLifecycle({ ...lifecycle, ...queueHeadDetails });
    };

    return (
      <div>
        <Header as="h3" attached="top">Next Speaking</Header>
        <Segment attached>
          <this.SpeakerEvents data={props.data.queue} fref={props.fref.child('queue')} speaking={props.data.speaking} />
        </Segment>
        <Segment attached="bottom">
          <Button
            icon
            primary
            labelPosition="left"
            onClick={nextSpeaker}
          >
            <Icon name="arrow up" />
            Next
          </Button>
          <Button
            icon
            negative
            labelPosition="left"
            onClick={() => props.fref.child('queue').remove()}
          >
            <Icon name="refresh" />
            Clear
          </Button>
        </Segment>
      </div>
    );
  }

  CaucusView = (props:
    {
      caucusID: CaucusID, data?: CaucusData, members?: Map<string, MemberData>,
      fref: firebase.database.Reference
    }) => {

    const members = props.members ? props.members : {} as Map<string, MemberData>;

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
            <this.CaucusNextSpeaking data={props.data} fref={props.fref} />
            <this.CaucusQueuer data={props.data} members={members} fref={props.fref} />
          </Grid.Column>
          <Grid.Column>
            <Timer
              value={this.state.speakerTimer}
              name="Speaker Timer"
              fref={props.fref.child('speakerTimer')}
              key={props.caucusID + 'speakerTimer'}
              onChange={(timer) => this.setState({ speakerTimer: timer })}
            />
            <Timer
              value={this.state.caucusTimer}
              name="Caucus Timer"
              fref={props.fref.child('caucusTimer')}
              key={props.caucusID + 'caucusTimer'}
              onChange={(timer) => this.setState({ caucusTimer: timer })}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>

          <Grid.Column>
            <CaucusMeta data={props.data} fref={props.fref} />

          </Grid.Column>
        </Grid.Row>
      </Grid >
    ) : (
        <Loader>Loading</Loader>
      );
  }

  render() {
    const caucusID: CaucusID = this.props.match.params.caucusID;
    const caucuses = this.props.committee.caucuses ? this.props.committee.caucuses : {} as Map<string, CaucusData>;

    return (
      <this.CaucusView
        caucusID={caucusID}
        data={caucuses[caucusID]}
        members={this.props.committee.members}
        fref={this.props.fref.child('caucuses').child(caucusID)}
      />
    );
  }
}
