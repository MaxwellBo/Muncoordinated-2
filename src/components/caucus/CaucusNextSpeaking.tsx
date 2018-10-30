import * as React from 'react';
import { CaucusData, recoverUnit, recoverDuration } from '../Caucus';
import { TimerData } from '../Timer';
import { Segment, Button, Icon, Label, Popup } from 'semantic-ui-react';
import { runLifecycle, Lifecycle } from '../../actions/caucusActions';
import { SpeakerEvent, Stance } from './SpeakerFeed';
import { SpeakerFeed } from './SpeakerFeed';
import * as _ from 'lodash';
import { Unit } from '../TimerSetter';

interface Props {
  caucus?: CaucusData;
  speakerTimer: TimerData;
  fref: firebase.database.Reference;
  autoNextSpeaker: boolean;
}

export class CaucusNextSpeaking extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);
  }

  handleKeyDown = (ev: KeyboardEvent) => {
    // if changing this, update Help
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

  componentDidUpdate(prevProps: Props) {
    const { autoNextSpeaker } = this.props;
    const { remaining, ticking } = prevProps.speakerTimer;

    // FIXME
    if (false) {
    // if (remaining === 0 && ticking && autoNextSpeaker) {
      console.info('Next speaker action triggered due to elapsed time and committee setting');
      this.nextSpeaker();
    }
  }

  interlace = () => {
    const { props } = this;

    if (props.caucus) {
      const q = props.caucus.queue || {};

      const vs: SpeakerEvent[] = _.values(q);

      const fors     = vs.filter((se) => se.stance === Stance.For);
      const againsts = vs.filter((se) => se.stance === Stance.Against);
      const neutrals = vs.filter((se) => se.stance === Stance.Neutral);

      const interlaced = _.flatten(_.zip(fors, againsts, neutrals));

      props.fref.child('queue').set({});

      interlaced.forEach((se: SpeakerEvent) => {
        if (se) {
          props.fref.child('queue').push().set(se);
        }
      });
    }
  }

  nextSpeaker = () => {
    const { props } = this;

    if (props.caucus) {
      const queue = props.caucus.queue || {};

      const queueHeadKey = Object.keys(queue)[0];

      let queueHeadDetails = {};

      if (queueHeadKey) {
        queueHeadDetails = {
          queueHeadData: queue[queueHeadKey],
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
    }
  }

  render() {
    const { nextSpeaker, props, interlace } = this;
    const { caucus } = this.props;

    const queue = caucus ? caucus.queue : {}; 
    const hasNowSpeaking = caucus ? !!caucus.speaking : false;
    const queueLength = _.values(queue).length;
    const hasNextSpeaking = queueLength > 0;
    const interlaceable = queueLength > 1;
    const nextable = hasNowSpeaking || hasNextSpeaking;

    const endButton = (
      <Button
        basic
        icon
        negative
        disabled={!nextable}
        onClick={nextSpeaker}
      >
        <Icon name="hourglass end" />
        End
      </Button>
    );

    const startButton = (
      <Button
        basic
        icon
        positive
        disabled={!nextable}
        onClick={nextSpeaker}
      >
        <Icon name="arrow up" />
        Stage
      </Button>
    );

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
      button = startButton;
    } else if (hasNowSpeaking && !hasNextSpeaking) {
      button = endButton;
    }

    return (
      <Segment textAlign="center" loading={!caucus}>
        <Label attached="top left" size="large">Next Speaking</Label>
        {button}
        <Popup
          trigger={interlaceButton}
          content="Orders the list so that speakers are 
          'For', then 'Against', then 'Neutral', then 'For', etc."
        />
        <SpeakerFeed 
          data={caucus ? caucus.queue : undefined}
          fref={props.fref.child('queue')} 
          speaking={caucus ? caucus.speaking : undefined}
          speakerTimer={props.speakerTimer} 
        />
      </Segment>
    );
  }
}