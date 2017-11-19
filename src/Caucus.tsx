import * as React from 'react';
import * as firebase from 'firebase';
import { Timer, TimerData, DEFAULT_TIMER } from './Timer';
import { RouteComponentProps } from 'react-router';
import { MemberID, MemberData } from './Member';
import { CommitteeID, CommitteeData } from './Committee';
import * as Utils from './utils';
import { Segment, Loader, Dimmer, Header, Dropdown, Input, Button, Icon, Grid, Feed, Flag } from 'semantic-ui-react';
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

const StanceIcon = (props: {stance: Stance} ) => {
  switch (props.stance) {
    case Stance.For:
      return <Icon name="thumbs outline up" />;
    case Stance.Against:
      return <Icon name="thumbs outline down" />;
    default:
      return <Icon name="hand outline right" />;
  }
};

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

function CaucusNowSpeaking(props: { data: CaucusData, fref: firebase.database.Reference }) {
  return (
    <div>
      <Header as="h3" attached="top">Now Speaking</Header>
      <Segment attached="bottom">
        <Feed size="large">
          <SpeakerEvent data={props.data.speaking} fref={props.fref.child('speaking')} />
        </Feed>
      </Segment>
    </div>
  );
}

function CaucusNextSpeaking(props: { data: CaucusData, fref: firebase.database.Reference }) {
  const nextSpeaker = () => {
    const nowRef = props.fref.child('speaking');
    const nextRef = props.fref.child('queue').limitToFirst(1).ref;
    const historyRef = props.fref.child('history');
    const speakerTimerRef = props.fref.child('speakerTimer');

    // Move the person currently speaking into history...
    nowRef.once('value', (nowEvent) => {
      if (nowEvent) {
        historyRef.push().set(nowEvent.val());
        nowRef.set(null);
      } // do nothing if no-one is currently speaking
    });

    // ...and transfer the person next to speak into the "Speaking" zone
    nextRef.once('child_added', (nextEvent) => {
      if (nextEvent) {
        nowRef.set(nextEvent.val());

        speakerTimerRef.update({
          elapsed: 0,
          remaining: nextEvent.val().duration, // load the appropriate time 
          ticking: false, // and stop it
        });

        nextRef.set(null);
      }
    });
  };

  return (
    <div>
      <Header as="h3" attached="top">Next Speaking</Header>
      <Segment attached>
        <SpeakerEvents data={props.data.queue} fref={props.fref.child('queue')} />
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

const SpeakerEvent = (props: { data?: SpeakerEvent, fref: firebase.database.Reference }) => {
  const makeHandler = (field: string) => (e: React.FormEvent<HTMLInputElement>) =>
    props.fref.child(field).set(e.currentTarget.value);

  return props.data ? (
    <Feed.Event>
      {/* <Feed.Label image='/assets/images/avatar/small/helen.jpg' /> */}
      <Feed.Content>
        <Feed.Summary>
          <Flag name={props.data.who.toLowerCase() as any} />
          {props.data.who}
          <Feed.Date>{props.data.duration.toString() + ' seconds'}</Feed.Date>
        </Feed.Summary>
        <Feed.Meta>
          <Feed.Like>
            <StanceIcon stance={props.data.stance} />
            {props.data.stance}
          </Feed.Like>
        </Feed.Meta>
      </Feed.Content>
    </Feed.Event>
  ) : <Feed.Event />
};

function SpeakerEvents(props: { data?: Map<string, SpeakerEvent>, fref: firebase.database.Reference }) {
  const events = props.data ? props.data : {};

  const eventItems = Object.keys(events).map(key =>
    <SpeakerEvent key={key} data={events[key]} fref={props.fref.child(key)} />
  );

  return (
    <Feed size="large">
      {eventItems}
    </Feed>
  );
}

export class Caucus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      queueCountry: COUNTRY_OPTIONS[0]
    };
  }

  CaucusQueuer = (props:
    { data: CaucusData, members: Map<string, MemberData>, fref: firebase.database.Reference }) => {
    const membersCountrySet = new Set(Utils.objectToList(props.members).map(x => x.name));
    const stanceHandler = (stance: Stance) => () => {
      const newEvent: SpeakerEvent = {
        who: this.state.queueCountry.text,
        stance: stance,
        duration: 60
      };

      props.fref.child('queue').push().set(newEvent);
    };

    const countryHandler = (event: any, data: any) => {
      this.setState({ queueCountry: COUNTRY_OPTIONS.filter(c => c.value === data.value)[0] });
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
            options={COUNTRY_OPTIONS.filter(x => membersCountrySet.has(x.text))}
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

  CaucusView = (props:
    { data?: CaucusData, members?: Map<string, MemberData>, fref: firebase.database.Reference }) => {

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
            <CaucusNowSpeaking data={props.data} fref={props.fref} />
            <CaucusNextSpeaking data={props.data} fref={props.fref} />
            <this.CaucusQueuer data={props.data} members={members} fref={props.fref} />
          </Grid.Column>
          <Grid.Column>
            <Timer name="Speaker Timer" fref={props.fref.child('speakerTimer')} />
            <Timer name="Caucus Timer" fref={props.fref.child('caucusTimer')} />
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
        data={caucuses[caucusID]}
        members={this.props.committee.members}
        fref={this.props.fref.child('caucuses').child(caucusID)}
      />
    );
  }
}
