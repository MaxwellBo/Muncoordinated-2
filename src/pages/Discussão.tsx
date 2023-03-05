import * as React from 'react';
import {
  Button,
  Container,
  Dropdown,
  DropdownProps,
  Feed,
  FeedEvent,
  Flag,
  Form,
  Grid,
  Icon,
  Input,
  Label,
  Popup,
  Segment,
  TextArea
} from 'semantic-ui-react';
import {Helmet} from 'react-helmet';
import Timer, {toggleTicking} from '../components/Timer';
import {RouteComponentProps} from 'react-router';
import {
  checkboxHandler,
  dropdownHandler,
  fieldHandler,
  textAreaHandler,
  validatedNumberFieldHandler
} from '../modules/handlers';
import {URLParameters} from '../types';
import {NotFound} from '../components/NotFound';
import {
  CAUCUS_STATUS_OPTIONS,
  CaucusData,
  CaucusID,
  CaucusStatus,
  DEFAULT_CAUCUS,
  Lifecycle,
  recoverDuration,
  recoverUnit,
  runLifecycle,
  SpeakerEvent,
  Stance
} from "../models/caucus";
import {CommitteeData, recoverCaucus, recoverMembers, recoverSettings} from "../models/committee";
import {TimerData, Unit} from "../models/time";
import {useAuthState} from "react-firebase-hooks/auth";
import _ from "lodash";
import {useObjectVal} from "react-firebase-hooks/database";
import {MemberData, MemberOption, membersToPresentOptions, parseFlagName} from "../modules/member";
import {TimeSetter} from "../components/TimeSetter";
import * as firebase from "firebase";
import {DragDropContext, Draggable, DraggableProvided, Droppable, DropResult} from "react-beautiful-dnd";

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  speakerTimer: TimerData;
  caucusTimer: TimerData;
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
  loading: boolean;
}


export function NextSpeaking(props: {
  caucus?: CaucusData;
  speakerTimer: TimerData;
  fref: firebase.database.Reference;
  autoNextSpeaker: boolean;
}) {
  const [user] = useAuthState(firebase.auth());

  const handleKeyDown = (ev: KeyboardEvent) => {
    // if changing this, update Help
    if (ev.keyCode === 78 && ev.altKey) {
      nextSpeaker();
    }
  };

  const interlace = () => {
    if (!props.caucus) {
      return;
    }

    if (!user) {
      return;
    }

    const q = props.caucus.queue || {};

    const vs: SpeakerEvent[] = _.values(q);

    const fors = vs.filter((se) => se.stance === Stance.For);
    const againsts = vs.filter((se) => se.stance === Stance.Against);
    const neutrals = vs.filter((se) => se.stance === Stance.Neutral);

    const interlaced = _.flatten(_.zip(fors, againsts, neutrals));

    props.fref.child('queue').set({});

    interlaced.forEach((se: SpeakerEvent | undefined) => {
      if (se) {
        props.fref.child('queue').push().set(se);
      }
    });
  };

  const nextSpeaker = () => {
    if (!props.caucus) {
      return;
    }

    const q = props.caucus.queue || {};

    const queueHeadKey = Object.keys(q)[0];

    let queueHeadDetails = {};

    if (queueHeadKey) {
      queueHeadDetails = {
        queueHeadData: q[queueHeadKey],
        queueHead: props.fref.child('queue').child(queueHeadKey)
      };
    }

    const duration = recoverDuration(props.caucus);

    const speakerSeconds: number = duration
      ? duration * (recoverUnit(props.caucus) === Unit.Minutes ? 60 : 1)
      : 60;

    const lifecycle: Lifecycle = {
      history: props.fref.child('history'),
      speakingData: props.caucus.speaking,
      speaking: props.fref.child('speaking'),
      timerData: props.speakerTimer,
      timer: props.fref.child('speakerTimer'),
      yielding: false,
      timerResetSeconds: speakerSeconds
    };

    runLifecycle({...lifecycle, ...queueHeadDetails});
  };

  // TODO: Improve this dirty fix
  let skew: any
  skew = useObjectVal<number>(firebase.database().ref('/.info/serverTimeOffset'));

  const startTimer = () => {
    toggleTicking({
      timerFref: props.fref.child('speakerTimer'),
      timer: props.speakerTimer,
      skew: skew.value
    });
  };

  const {caucus} = props;
  const {ticking} = props.speakerTimer;

  const queue = caucus ? caucus.queue : {};
  const hasNowSpeaking = caucus ? !!caucus.speaking : false;
  const queueLength = _.values(queue).length;
  const hasNextSpeaking = queueLength > 0;
  const interlaceable = queueLength > 1;
  const nextable = hasNowSpeaking || hasNextSpeaking;

  const stageButton = (
    <Button
      basic
      icon
      primary
      disabled={!nextable}
      onClick={nextSpeaker}
    >
      <Icon name="arrow up"/>
      Stage
    </Button>
  );

  const startButton = (
    <Button
      basic
      icon
      positive
      disabled={!nextable}
      onClick={startTimer}
    >
      <Icon name="hourglass start"/>
      Start
    </Button>
  )

  const nextButton = (
    <Button
      basic
      icon
      primary
      disabled={!nextable}
      onClick={nextSpeaker}
    >
      <Icon name="arrow up"/>
      Next
    </Button>
  );

  const stopButton = (
    <Button
      basic
      icon
      negative
      disabled={!nextable}
      onClick={nextSpeaker}
    >
      <Icon name="hourglass end"/>
      Stop
    </Button>
  );

  const interlaceButton = (
    <Button
      icon
      disabled={!interlaceable}
      basic
      color="purple"
      onClick={interlace}
    >
      <Icon name="random"/>
      Order
    </Button>
  );

  let button = nextButton;

  if (!hasNowSpeaking) {
    button = stageButton;
  } else if (hasNowSpeaking && !ticking) {
    button = startButton;
  } else if (hasNowSpeaking && ticking && hasNextSpeaking) {
    button = nextButton;
  } else if (hasNowSpeaking && ticking && !hasNextSpeaking) {
    button = stopButton;
  }

  React.useEffect(() => {
    document.addEventListener<'keydown'>('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <Segment textAlign="center" loading={!caucus}>
      <Label attached="top left" size="large">Next speaking</Label>
      {button}
      <Popup
        trigger={interlaceButton}
        content="Orders the list so that speakers are
        'For', then 'Against', then 'Neutral', then 'For', etc."
      />
      <SpeakerFeed
        data={caucus ? caucus.queue : undefined}
        queueFref={props.fref.child('queue')}
        speaking={caucus ? caucus.speaking : undefined}
        speakerTimer={props.speakerTimer}
      />
    </Segment>
  );
}

function StanceIcon(props: { stance: Stance }) {
  switch (props.stance) {
    case Stance.For:
      return <Icon name="thumbs up outline"/>;
    case Stance.Against:
      return <Icon name="thumbs down outline"/>;
    default:
      return <Icon name="hand point right outline"/>;
  }
}

class SpeakerFeedEntry extends React.PureComponent<{
  data?: SpeakerEvent,
  speaking?: SpeakerEvent,
  fref: firebase.database.Reference,
  speakerTimer: TimerData,
  draggableProvided?: DraggableProvided
}> {

  yieldHandler = () => {
    const {fref, data, speakerTimer, speaking} = this.props;

    const queueHeadDetails = {
      queueHeadData: data,
      queueHead: fref
    };

    // HACK
    // HERE BE DRAGONS
    // The only reason I'm doing this is because I honestly couldn't give a shit about propogating
    // the caucusRef all the way down. Furthermore, the only time this should ever be called is when the
    // SpeakerEvent is in the "queue" zone, meaning we'll pop up into the "caucus" field.
    const caucusRef = (fref.parent as firebase.database.Reference).parent as firebase.database.Reference;

    const lifecycle: Lifecycle = {
      history: caucusRef.child('history'),
      speaking: caucusRef.child('speaking'),
      speakingData: speaking,
      timerData: speakerTimer,
      timer: caucusRef.child('speakerTimer'),
      yielding: true,
      timerResetSeconds: 0 // this shouldn't ever be used when yielding
    };

    runLifecycle({...lifecycle, ...queueHeadDetails});
  };

  renderContent() {
    const {data, speaking, fref} = this.props;

    return (
      <Feed.Content>
        <Feed.Summary>
          <Feed.User>
            {data && <Flag name={parseFlagName(data.who)}/>}
            {data ? data.who : ''}
          </Feed.User>
          <Feed.Date>{data ? data.duration.toString() + ' seconds' : ''}</Feed.Date>
        </Feed.Summary>
        <Feed.Meta>
          <Feed.Like>
            {data && <StanceIcon stance={data.stance}/>}
            {data ? data.stance : ''}
          </Feed.Like>
          {data && <Label size="mini" as="a" onClick={() => fref.remove()}>
              Remove
          </Label>}
          {data && speaking && (<Label size="mini" as="a" onClick={this.yieldHandler}>
            Yield
          </Label>)}
        </Feed.Meta>
      </Feed.Content>
    )
  }

  render() {
    const {draggableProvided} = this.props;

    return draggableProvided ? (
      <div
        className="event" // XXX: quite possibly the most bullshit hack known to man
        ref={draggableProvided.innerRef}
        {...draggableProvided.draggableProps}>
        {this.renderContent()}
        <div {...draggableProvided.dragHandleProps}
             style={{paddingLeft: '120px'}
             }> ⠿
        </div>
      </div>
    ) : <FeedEvent>
      {this.renderContent()}
    </FeedEvent>
  }
}

function SpeakerFeed(props: {
  data?: Record<string, SpeakerEvent>,
  queueFref: firebase.database.Reference,
  speaking?: SpeakerEvent,
  speakerTimer: TimerData
}) {
  const {data, queueFref, speaking, speakerTimer} = props;
  const [user] = useAuthState(firebase.auth());

  const events = data || {};

  const eventItems = Object.keys(events).map((key, index) =>
    (
      <Draggable key={key} draggableId={key} index={index}>
        {(provided, snapshot) =>
          <SpeakerFeedEntry
            draggableProvided={provided}
            key={key}
            data={events[key]}
            fref={queueFref.child(key)}
            speaking={speaking}
            speakerTimer={speakerTimer}
          />
        }
      </Draggable>
    )
  );

  const reorder = <T,>(list: T[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  }

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    // no auth
    if (!user) {
      return;
    }

    const events = data || {};

    const reorderedKeys = reorder(
      Object.keys(events),
      result.source.index,
      result.destination.index
    );

    queueFref.set({});

    reorderedKeys.forEach(key => {
      const se = (data || {})[key]

      if (se) {
        queueFref.push().set(se);
      }
    });
  }

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
    >
      <Droppable droppableId="droppable">
        {(provided, snapshot) =>
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <Feed
              size="large"
            >
              {eventItems}
              {provided.placeholder}
            </Feed>
          </div>
        }
      </Droppable>
    </DragDropContext>
  );
};

function Queuer(props: {
  caucus?: CaucusData;
  members?: Record<string, MemberData>;
  caucusFref: firebase.database.Reference;
}) {
  const {members, caucus, caucusFref} = props;
  const [queueMember, setQueueMember] = React.useState<MemberOption | undefined>(undefined);
  const memberOptions = membersToPresentOptions(members);

  const setStance = (stance: Stance) => () => {
    const {caucus} = props;

    const duration = Number(recoverDuration(caucus));

    if (duration && queueMember) {
      const newEvent: SpeakerEvent = {
        who: queueMember.text,
        stance: stance,
        duration: recoverUnit(caucus) === Unit.Minutes ? duration * 60 : duration,
      };

      props.caucusFref.child('queue').push().set(newEvent);
    }
  }

  const setMember = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    setQueueMember(memberOptions.filter(c => c.value === data.value)[0]);
  }

  const duration = recoverDuration(caucus);
  const disableButtons = !queueMember || !duration;

  return (
    <Segment textAlign="center">
      <Label attached="top left" size="large">Queue</Label>
      <Form>
        <Form.Dropdown
          icon="search"
          value={queueMember ? queueMember.value : undefined}
          search
          selection
          loading={!caucus}
          error={!queueMember}
          onChange={setMember}
          options={memberOptions}
        />
        <TimeSetter
          loading={!caucus}
          unitValue={recoverUnit(caucus)}
          placeholder="Tempo da Fala"
          durationValue={duration ? duration.toString() : undefined}
          onDurationChange={validatedNumberFieldHandler(caucusFref, 'speakerDuration')}
          onUnitChange={dropdownHandler(caucusFref, 'speakerUnit')}
        />
        <Form.Checkbox
          label="Fila para Conselheiros"
          indeterminate={!caucus}
          toggle
          checked={caucus ? (caucus.queueIsPublic || false) : false} // zoo wee mama
          onChange={checkboxHandler<CaucusData>(caucusFref, 'queueIsPublic')}
        />
        <Button.Group size="large" fluid>
          <Button
            content="Favoravel"
            disabled={disableButtons}
            onClick={setStance(Stance.For)}
          />
          <Button.Or/>
          <Button
            disabled={disableButtons}
            content="Neutro"
            onClick={setStance(Stance.Neutral)}
          />
          <Button.Or/>
          <Button
            disabled={disableButtons}
            content="Contrario"
            onClick={setStance(Stance.Against)}
          />
        </Button.Group>
      </Form>
    </Segment>
  );
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
        name="Tempo do Orador"
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
        name="Tempo da Discussao"
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
      <Queuer
        caucus={caucus} 
        members={members} 
        caucusFref={caucusFref} 
      />
    );

    const renderedCaucusNextSpeaking = (
      <NextSpeaking
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
          <title>{`${caucus?.name} - SISCONFED`}</title>
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
