import * as React from 'react';
import firebase from 'firebase/app';
import { CaucusData, recoverUnit, recoverDuration } from '../Caucus';
import { TimerData, toggleTicking } from '../Timer';
import { Segment, Button, Icon, Label, Popup } from 'semantic-ui-react';
import { runLifecycle, Lifecycle } from '../../actions/caucus-actions';
import { SpeakerEvent, Stance } from './SpeakerFeed';
import { SpeakerFeed } from './SpeakerFeed';
import _ from 'lodash';
import { Unit } from '../TimerSetter';
import { useObjectVal } from 'react-firebase-hooks/database';
import { useAuthState } from 'react-firebase-hooks/auth';

interface Props {
  caucus?: CaucusData;
  speakerTimer: TimerData;
  fref: firebase.database.Reference;
  autoNextSpeaker: boolean;
}

export function CaucusNextSpeaking(props: Props) {
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

    const fors     = vs.filter((se) => se.stance === Stance.For);
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

    runLifecycle({ ...lifecycle, ...queueHeadDetails });
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

  const { caucus } = props;
  const { ticking } = props.speakerTimer;

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
      <Icon name="arrow up" />
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
      <Icon name="hourglass start" />
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
      <Icon name="arrow up" />
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
      <Icon name="hourglass end" />
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
      <Icon name="random" />
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