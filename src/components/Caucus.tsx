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
}

interface State {
  speakerTimer: TimerData;
  caucusTimer: TimerData;
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
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
}

const CAUCUS_STATUS_OPTIONS = [
  CaucusStatus.Open,
  CaucusStatus.Closed
].map(makeDropdownOption);

export const DEFAULT_CAUCUS: CaucusData = {
  name: 'Genearal Speaker\'s List',
  topic: '',
  status: CaucusStatus.Open,
  speakerTimer: { ...DEFAULT_TIMER, remaining: 60 },
  caucusTimer: { ...DEFAULT_TIMER, remaining: 60 * 10 },
  queue: {} as Map<string, SpeakerEvent>,
  history: {} as Map<string, SpeakerEvent>,
};

export class Caucus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees').child(match.params.committeeID),
      caucusTimer: DEFAULT_CAUCUS.caucusTimer,
      speakerTimer: DEFAULT_CAUCUS.speakerTimer
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
          placeholder="Caucus Name"
        />
        <Form>
          <TextArea
            value={caucus ? caucus.topic : ''}
            autoHeight
            onChange={textAreaHandler<CaucusData>(caucusFref, 'topic')}
            attatched="top"
            rows={1}
            placeholder="Caucus Topic"
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
      <div>
        <Header as="h3" attached="top">Now Speaking</Header>
        <Segment attached="bottom" loading={!caucus}>
          <Feed size="large">
            <SpeakerFeedEntry data={entryData} fref={caucusFref.child('speaking')} speakerTimer={speakerTimer}/>
          </Feed>
        </Segment>
      </div>
    );
  }

  renderCaucus = (caucus?: CaucusData) => {
    const { renderNowSpeaking, renderHeader, recoverCaucusFref } = this;
    const { speakerTimer, committee } = this.state;

    const { caucusID } = this.props.match.params;
    const caucusFref = recoverCaucusFref();

    const members = committee ? committee.members : undefined;

    return (
      <Grid columns="equal">
        <Grid.Row>
          <Grid.Column>
            {renderHeader(caucus)}
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            {renderNowSpeaking(caucus)}
            <CaucusNextSpeaking caucus={caucus} fref={caucusFref} speakerTimer={speakerTimer} />
            <CaucusQueuer members={members} fref={caucusFref} />
          </Grid.Column>
          <Grid.Column>
            <Timer
              name="Speaker Timer"
              fref={caucusFref.child('speakerTimer')}
              key={caucusID + 'speakerTimer'}
              onChange={(timer) => this.setState({ speakerTimer: timer })}
              toggleKeyCode={83} // S
            />
            <Timer
              name="Caucus Timer"
              fref={caucusFref.child('caucusTimer')}
              key={caucusID + 'caucusTimer'}
              onChange={(timer) => this.setState({ caucusTimer: timer })}
              toggleKeyCode={67} // C
            />
          </Grid.Column>
        </Grid.Row>
      </Grid >
    );
  }

  render() {
    const { committee, committeeFref } = this.state;
    const caucusID: CaucusID = this.props.match.params.caucusID;

    const caucuses = committee ? committee.caucuses : {};
    const caucus = (caucuses || {})[caucusID];

    return this.renderCaucus(caucus);
  }
}
