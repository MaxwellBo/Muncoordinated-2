import * as React from 'react';
import firebase from 'firebase/app';
import {Container, Dropdown, Feed, Form, Grid, Input, Label, Segment, TextArea} from 'semantic-ui-react';
import {Helmet} from 'react-helmet';
import Timer from '../components/timer/Timer';
import {RouteComponentProps} from 'react-router';
import CaucusQueuer from '../components/caucus/CaucusQueuer';
import {dropdownHandler, fieldHandler, textAreaHandler} from '../models/handlers';
import {URLParameters} from '../types';
import {CaucusNextSpeaking} from '../components/caucus/CaucusNextSpeaking';
import {SpeakerFeedEntry} from '../components/caucus/SpeakerFeed';
import {NotFound} from '../components/aux/NotFound';
import {
  CAUCUS_STATUS_OPTIONS,
  CaucusData,
  CaucusID,
  CaucusStatus,
  DEFAULT_CAUCUS,
  recoverDuration,
  recoverUnit
} from "../models/caucus";
import {CommitteeData, recoverCaucus, recoverMembers, recoverSettings} from "../models/committee";
import {TimerData, Unit} from "../models/time";

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  speakerTimer: TimerData;
  caucusTimer: TimerData;
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
  loading: boolean;
}

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
      <>
        <Input
          label={statusDropdown}
          labelPosition="right"
          value={caucus ? caucus.name : ''}
          onChange={fieldHandler<CaucusData>(caucusFref, 'name')}
          loading={!caucus}
          attatched="top"
          size="massive"
          fluid
          placeholder="Set caucus name"
        />
        <Form loading={!caucus}>
          <TextArea
            value={caucus ? caucus.topic : ''}
            autoHeight
            onChange={textAreaHandler<CaucusData>(caucusFref, 'topic')}
            attatched="top"
            rows={1}
            placeholder="Set caucus details"
          />
        </Form>
      </>
    );
  }

  renderNowSpeaking =  (caucus?: CaucusData) => {
    const { speakerTimer } = this.state;
    
    const caucusFref = this.recoverCaucusFref();

    const entryData = caucus ? caucus.speaking : undefined;

    return (
      <Segment loading={!caucus}>
        <Label attached="top left" size="large">Now speaking</Label>
        <Feed size="large">
          <SpeakerFeedEntry data={entryData} fref={caucusFref.child('speaking')} speakerTimer={speakerTimer}/>
        </Feed>
      </Segment>
    );
  }

  setSpeakerTimer = (timer: TimerData) => {
    this.setState({ speakerTimer: timer });
  }

  setCaucusTimer = (timer: TimerData) => {
    this.setState({ caucusTimer: timer });
  }

  renderCaucus = (caucus?: CaucusData) => {
    const { renderNowSpeaking, renderHeader, recoverCaucusFref } = this;
    const { speakerTimer, committee } = this.state;

    const { caucusID } = this.props.match.params;
    const caucusFref = recoverCaucusFref();

    const members = recoverMembers(committee);

    const renderedSpeakerTimer = (
      <Timer
        name="Speaker timer"
        timerFref={caucusFref.child('speakerTimer')}
        key={caucusID + 'speakerTimer'}
        onChange={this.setSpeakerTimer}
        toggleKeyCode={83} // S - if changing this, update Help
        defaultUnit={recoverUnit(caucus)}
        defaultDuration={recoverDuration(caucus) || 60}
      />
    );

    const renderedCaucusTimer = (
      <Timer
        name="Caucus timer"
        timerFref={caucusFref.child('caucusTimer')}
        key={caucusID + 'caucusTimer'}
        onChange={this.setCaucusTimer}
        toggleKeyCode={67} // C - if changing this, update Help
        defaultUnit={Unit.Minutes}
        defaultDuration={10}
      />
    );

    const { 
      autoNextSpeaker, 
      timersInSeparateColumns, 
      moveQueueUp 
    } = recoverSettings(committee);

    const header = (
      <Grid.Row>
        <Grid.Column>
          {renderHeader(caucus)}
        </Grid.Column>
      </Grid.Row>
    );

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
      <Container style={{ 'padding-bottom': '2em' }}>
        <Helmet>
          <title>{`${caucus?.name} - Muncoordinated`}</title>
        </Helmet>
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

    const caucus = recoverCaucus(committee, caucusID);

    if (!loading && !caucus) {
      return (
        <Container text style={{ 'padding-bottom': '2em' }}>
          <NotFound item="caucus" id={caucusID} />
        </Container>
      );
    } else {
      return this.renderCaucus(caucus);
    }
  }
}
