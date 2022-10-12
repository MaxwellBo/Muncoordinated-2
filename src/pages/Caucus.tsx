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
  CaucusStatus,
  DEFAULT_CAUCUS,
  Lifecycle,
  runLifecycle,
  SpeakerEvent,
  Stance,
  useCaucusCompanion
} from "../models/caucus";
import {TimerData, Unit} from "../models/time";
import {useAuthState} from "react-firebase-hooks/auth";
import _ from "lodash";
import {useObjectVal} from "react-firebase-hooks/database";
import {MemberOption, parseFlagName} from "../modules/member";
import {TimeSetter} from "../components/TimeSetter";
import * as firebase from "firebase";
import {DragDropContext, Draggable, DraggableProvided, Droppable, DropResult} from "react-beautiful-dnd";
import { useCommitteeCompanion } from '../models/committee';

export function NextSpeaking(props: {
  speakerTimer: TimerData;
}) {
  const caucusCompanion = useCaucusCompanion();
  const { caucus, loading, ref: caucusFref } = caucusCompanion;
  const [user] = useAuthState(firebase.auth());

  const handleKeyDown = (ev: KeyboardEvent) => {
    // if changing this, update Help
    if (ev.keyCode === 78 && ev.altKey) {
      nextSpeaker();
    }
  };

  const interlace = () => {
    if (!caucus) {
      return;
    }

    if (!user) {
      return;
    }

    const q = caucus.queue || {};

    const vs: SpeakerEvent[] = _.values(q);

    const fors = vs.filter((se) => se.stance === Stance.For);
    const againsts = vs.filter((se) => se.stance === Stance.Against);
    const neutrals = vs.filter((se) => se.stance === Stance.Neutral);

    const interlaced = _.flatten(_.zip(fors, againsts, neutrals));

    caucusFref.child('queue').set({});

    interlaced.forEach((se: SpeakerEvent | undefined) => {
      if (se) {
        caucusFref.child('queue').push().set(se);
      }
    });
  };

  const nextSpeaker = () => {
    if (!caucus) {
      return;
    }

    const q = caucus.queue || {};

    const queueHeadKey = Object.keys(q)[0];

    let queueHeadDetails = {};

    if (queueHeadKey) {
      queueHeadDetails = {
        queueHeadData: q[queueHeadKey],
        queueHead: caucusFref.child('queue').child(queueHeadKey)
      };
    }

    const duration = caucusCompanion.getDuration()

    const speakerSeconds: number = duration
      ? duration * (caucusCompanion.getUnit() === Unit.Minutes ? 60 : 1)
      : 60;

    const lifecycle: Lifecycle = {
      history: caucusFref.child('history'),
      speakingData: caucus?.speaking,
      speaking: caucusFref.child('speaking'),
      timerData: props.speakerTimer,
      timer: caucusFref.child('speakerTimer'),
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
      timerFref: caucusFref.child('speakerTimer'),
      timer: props.speakerTimer,
      skew: skew.value
    });
  };

  const {ticking} = props.speakerTimer;

  const queue = caucus ? caucus.queue : {};
  const hasNowSpeaking = caucus ? !!caucus.speaking : false;
  const queueLength = _.values(queue).length;
  const hasNextSpeaking = queueLength > 0;
  const interlaceable = queueLength > 1;
  const nextable = hasNowSpeaking || hasNextSpeaking;

  const StageButton = () => (
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

  const StartButton = () => (
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

  const NextButton = () => (
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

  const StopButton = () => (
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

  const InterlaceButton = () => (
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

  let button = <NextButton/>;

  if (!hasNowSpeaking) {
    button = <StageButton />;
  } else if (hasNowSpeaking && !ticking) {
    button = <StartButton />;
  } else if (hasNowSpeaking && ticking && hasNextSpeaking) {
    button = <NextButton />;
  } else if (hasNowSpeaking && ticking && !hasNextSpeaking) {
    button = <StopButton />;
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
        trigger={<InterlaceButton />}
        content="Orders the list so that speakers are
        'For', then 'Against', then 'Neutral', then 'For', etc."
      />
      <SpeakerFeed
        data={caucus ? caucus.queue : undefined}
        queueFref={caucusFref.child('queue')}
        speaking={caucus?.speaking}
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
  memberOptions: MemberOption[];
}) {
  const { memberOptions } = props;
  const caucusCompanion = useCaucusCompanion();
  const { caucus, loading, ref: caucusFref } = caucusCompanion;

  const [queueMember, setQueueMember] = React.useState<MemberOption | undefined>(undefined);

  const setStance = (stance: Stance) => () => {
    const duration = Number(caucusCompanion.getDuration());

    if (duration && queueMember) {
      const newEvent: SpeakerEvent = {
        who: queueMember.text,
        stance: stance,
        duration: caucusCompanion.getUnit() === Unit.Minutes ? duration * 60 : duration,
      };

      caucusCompanion.ref.child('queue').push().set(newEvent);
    }
  }

  const setMember = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    setQueueMember(memberOptions.filter(c => c.value === data.value)[0]);
  }

  const duration = caucusCompanion.getDuration()
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
          loading={loading}
          error={!queueMember}
          onChange={setMember}
          options={memberOptions}
        />
        <TimeSetter
          loading={loading}
          unitValue={caucusCompanion.getUnit()}
          placeholder="Speaking time"
          durationValue={duration ? duration.toString() : undefined}
          onDurationChange={validatedNumberFieldHandler(caucusFref, 'speakerDuration')}
          onUnitChange={dropdownHandler(caucusFref, 'speakerUnit')}
        />
        <Form.Checkbox
          label="Delegates can queue"
          indeterminate={loading}
          toggle
          checked={caucus?.queueIsPublic ?? false}
          onChange={checkboxHandler<CaucusData>(caucusFref, 'queueIsPublic')}
        />
        <Button.Group size="large" fluid>
          <Button
            content="For"
            disabled={disableButtons}
            onClick={setStance(Stance.For)}
          />
          <Button.Or/>
          <Button
            disabled={disableButtons}
            content="Neutral"
            onClick={setStance(Stance.Neutral)}
          />
          <Button.Or/>
          <Button
            disabled={disableButtons}
            content="Against"
            onClick={setStance(Stance.Against)}
          />
        </Button.Group>
      </Form>
    </Segment>
  );
}


function NowSpeaking(props: {
  speakerTimer: TimerData;
}) {
  const { speakerTimer } = props;
  const { caucus, loading, ref: caucusFref } = useCaucusCompanion();

  return (
    <Segment loading={loading}>
      <Label attached="top left" size="large">Now speaking</Label>
      <Feed size="large">
        <SpeakerFeedEntry data={caucus?.speaking} fref={caucusFref.child('speaking')} speakerTimer={speakerTimer}/>
      </Feed>
    </Segment>
  );
}

export default function Caucus(props: {} & RouteComponentProps<URLParameters>) {
  const caucusCompanion = useCaucusCompanion();
  const committeeCompanion = useCommitteeCompanion();
  const { caucus, loading, ref: caucusFref, caucusID } = caucusCompanion;

  const [caucusTimer, setCaucusTimer] = React.useState(DEFAULT_CAUCUS.caucusTimer);
  const [speakerTimer, setSpeakerTimer] = React.useState(DEFAULT_CAUCUS.speakerTimer);


  if (!caucusCompanion.loading && !caucusCompanion.caucus) {
    return (
      <Container text style={{ 'padding-bottom': '2em' }}>
        <NotFound item="caucus" id={caucusCompanion.caucusID} />
      </Container>
    );
  }

  return (
    <Container style={{ 'padding-bottom': '2em' }}>
      <Helmet>
        <title>{`${caucus?.name} - Muncoordinated`}</title>
      </Helmet>
      <Grid columns="equal" stackable>
        <Grid.Row>
          <Grid.Column>
            <Input
              label={<Dropdown
                value={caucus?.status ?? CaucusStatus.Open}
                options={CAUCUS_STATUS_OPTIONS}
                onChange={dropdownHandler<CaucusData>(caucusFref, 'status')}
              />}
              labelPosition="right"
              value={caucus?.name ?? ''}
              onChange={fieldHandler<CaucusData>(caucusFref, 'name')}
              loading={loading}
              attatched="top"
              size="massive"
              fluid
              placeholder="Set caucus name"
            />
            <Form loading={!caucus}>
              <TextArea
                value={caucus?.topic ?? ''}
                autoHeight
                onChange={textAreaHandler<CaucusData>(caucusFref, 'topic')}
                attatched="top"
                rows={1}
                placeholder="Set caucus details"
              />
            </Form>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <NowSpeaking speakerTimer={speakerTimer}/>
            <Queuer
              memberOptions={committeeCompanion.getMemberOptions()}
            />
            <NextSpeaking
              speakerTimer={speakerTimer}
            />
          </Grid.Column>
          <Grid.Column>
            <Timer
              name="Speaker timer"
              timerFref={caucusFref.child('speakerTimer')}
              key={caucusID + 'speakerTimer'}
              onChange={setSpeakerTimer}
              toggleKeyCode={83} // S - if changing this, update Help
              defaultUnit={caucusCompanion.getUnit()}
              defaultDuration={caucusCompanion.getDuration() || 60}
            />
            <Timer
              name="Caucus timer"
              timerFref={caucusFref.child('caucusTimer')}
              key={caucusID + 'caucusTimer'}
              onChange={setCaucusTimer}
              toggleKeyCode={67} // C - if changing this, update Help
              defaultUnit={Unit.Minutes}
              defaultDuration={10}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid >
    </Container>)
}
