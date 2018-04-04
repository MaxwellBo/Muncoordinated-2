import * as React from 'react';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import {
  Segment, Dimmer, Header, Dropdown, TextArea, Input, Button, Icon, Grid, Feed, Flag,
  Label, Form, Message
} from 'semantic-ui-react';
import { Timer, TimerData, DEFAULT_TIMER } from './Timer';
import { RouteComponentProps } from 'react-router';
import { MemberID, MemberData, nameToCountryOption, parseFlagName } from './Member';
import { CommitteeID, CommitteeData } from './Committee';
import CaucusQueuer from './caucus/CaucusQueuer';
import * as Utils from '../utils';
import { COUNTRY_OPTIONS, CountryOption } from '../constants';
import { textAreaHandler, dropdownHandler, fieldHandler } from '../actions/handlers';
import { makeDropdownOption } from '../utils';
import { URLParameters } from '../types';
import { Loading } from './Loading';
import { CaucusNextSpeaking } from './caucus/CaucusNextSpeaking';
import { SpeakerEvent, SpeakerFeedEntry } from './caucus/SpeakerFeed';

interface Props extends RouteComponentProps<URLParameters> {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface State {
  speakerTimer: TimerData;
  caucusTimer: TimerData;
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
  caucusTimer: TimerData;
  speaking?: SpeakerEvent;
  queue?: Map<string, SpeakerEvent>;
  history?: Map<string, SpeakerEvent>;
  deleted?: boolean; // FIXME: Needs migration to default false
}

const CAUCUS_STATUS_OPTIONS = [
  CaucusStatus.Open,
  CaucusStatus.Closed
].map(makeDropdownOption);


export const DEFAULT_CAUCUS: CaucusData = {
  name: 'Genearal Speaker\'s List',
  topic: '',
  status: CaucusStatus.Open,
  speakerTimer: { remaining: 60, elapsed: 0, ticking: false },
  caucusTimer: { remaining: 60 * 10, elapsed: 0, ticking: false },
  queue: {} as Map<string, SpeakerEvent>,
  history: {} as Map<string, SpeakerEvent>,
};

export class Caucus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      caucusTimer: DEFAULT_CAUCUS.caucusTimer,
      speakerTimer: DEFAULT_CAUCUS.speakerTimer
    };
  }

  renderMeta = (data: CaucusData, fref: firebase.database.Reference) => {
    // TODO: Make status either a dropdown or a checkbox / on/off slider
    return (
      <Segment attached>
        <Button
          basic
          icon
          negative
          labelPosition="left"
          onClick={() => fref.child('deleted').set(true)}
        >
          <Icon name="trash" />
          Delete
        </Button>
      </Segment>
    );
  }

  renderHeader = (data: CaucusData, fref: firebase.database.Reference) => {
    const statusDropdown = (
      <Dropdown 
        value={data.status} 
        options={CAUCUS_STATUS_OPTIONS} 
        onChange={dropdownHandler<CaucusData>(fref, 'status')} 
      /> 
    );

    return (
      // TODO: Loading spinners
      <Segment>
        <Input
          label={statusDropdown}
          labelPosition="right"
          value={data.name}
          onChange={fieldHandler<CaucusData>(fref, 'name')}
          attatched="top"
          size="massive"
          fluid
          placeholder="Caucus Name"
        />
        <Form>
          <TextArea
            value={data.topic}
            autoHeight
            onChange={textAreaHandler<CaucusData>(fref, 'topic')}
            attatched="top"
            rows={1}
            placeholder="Caucus Topic"
          />
        </Form>
      </Segment>
    );
  }

  renderNowSpeaking =  (data: CaucusData, fref: firebase.database.Reference) => {
    const { speakerTimer } = this.state;

    return (
      <div>
        <Header as="h3" attached="top">Now Speaking</Header>
        <Segment attached="bottom">
          <Feed size="large">
            <SpeakerFeedEntry data={data.speaking} fref={fref.child('speaking')} speakerTimer={speakerTimer}/>
          </Feed>
        </Segment>
      </div>
    );
  }

  renderCaucus = (caucusID: CaucusID, data: CaucusData, 
                  members: Map<MemberID, MemberData>, fref: firebase.database.Reference) => {

    const { renderNowSpeaking, renderHeader } = this;
    const { speakerTimer } = this.state;

    return data ? (
      <Grid columns="equal">
        <Grid.Row>
          <Grid.Column>
            {renderHeader(data, fref)}
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            {renderNowSpeaking(data, fref)}
            <CaucusNextSpeaking data={data} fref={fref} speakerTimer={speakerTimer} />
            <CaucusQueuer data={data} members={members} fref={fref} />
          </Grid.Column>
          <Grid.Column>
            <Timer
              name="Speaker Timer"
              fref={fref.child('speakerTimer')}
              key={caucusID + 'speakerTimer'}
              onChange={(timer) => this.setState({ speakerTimer: timer })}
              toggleKeyCode={83} // S
            />
            <Timer
              name="Caucus Timer"
              fref={fref.child('caucusTimer')}
              key={caucusID + 'caucusTimer'}
              onChange={(timer) => this.setState({ caucusTimer: timer })}
              toggleKeyCode={67} // C
            />
          </Grid.Column>
        </Grid.Row>
      </Grid >
    ) : (
        <Loading />
      );
  }

  render() {
    const { renderCaucus } = this;
    const { fref, committee } = this.props;

    const caucusID: CaucusID = this.props.match.params.caucusID;
    const caucuses = this.props.committee.caucuses || {} as Map<CaucusID, CaucusData>;
    const caucus = caucuses[caucusID];

    if (caucus) {
      const members = committee.members || {} as Map<MemberID, MemberData>;

      if (!caucus.deleted) {
        return renderCaucus(caucusID, caucus, members, fref.child('caucuses').child(caucusID));
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
