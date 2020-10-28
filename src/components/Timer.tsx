import * as React from 'react';
import firebase from 'firebase/app';
import { Form, Segment, Button, Progress, DropdownProps, Icon, Label } from 'semantic-ui-react';
import { Unit, TimerSetter, getSeconds } from './TimerSetter';
import _ from 'lodash';
import { DEFAULT_SPEAKER_TIME_SECONDS } from './Caucus';

interface Props {
  name: string;
  timerFref: firebase.database.Reference;
  onChange: (timer: TimerData) => void;
  toggleKeyCode?: number;
  defaultUnit: Unit;
  defaultDuration: number;
}

interface State {
  timer?: TimerData;
  timerId?: NodeJS.Timer;
  skew?: number;
  offsetRef: firebase.database.Reference;
  unitDropdown: Unit;
  durationField: string;
  mute: boolean;
}

export interface TimerData {
  elapsed: number;
  remaining: number;
  ticking: boolean | number;
}

export const DEFAULT_TIMER = {
  elapsed: 0,
  remaining: DEFAULT_SPEAKER_TIME_SECONDS,
  ticking: false
};

export function hhmmss(seconds: number): string {
  let sign = '';

  seconds = seconds || 0;

  if (seconds < 0) {
    sign = '-';
    seconds = Math.abs(seconds);
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const secondsFormatted = _.padStart((seconds % 60).toString(), 2, '0');
  const minutesFormatted = _.padStart((minutes % 60).toString(), 2, '0');

  if (hours !== 0) {
    return sign + hours + ':' + minutesFormatted + ':' + secondsFormatted;
  } else {
    return sign + minutes + ':' + secondsFormatted;
  }
}

export function getTimeWithSkewCorrection(skew: number | undefined) {
  // eslint-disable-next-line new-parens
  const millis =  skew ? skew + (new Date).getTime() : (new Date).getTime();

  return Math.floor(millis / 1000);
}

export function toggleTicking({
  timer, 
  timerFref,
  skew
}: {
  timer?: TimerData,
  timerFref: firebase.database.Reference
  skew?: number,
}) {
  if (timer) {
    const newTimer = {
      elapsed: timer.elapsed,
      remaining: timer.remaining,
      ticking: timer.ticking ? false : getTimeWithSkewCorrection(skew)
    };

    timerFref.set(newTimer);
  }
}

export default class Timer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { defaultUnit, defaultDuration } = this.props;

    this.state = {
      offsetRef: firebase.database().ref('/.info/serverTimeOffset'),
      unitDropdown: defaultUnit || Unit.Minutes,
      durationField: defaultDuration ? defaultDuration.toString() : '1',
      mute: true
    };
  }

  tick = () => {
    const timer = this.state.timer;

    if (timer && timer.ticking) {
      let newTimer = {
        ...timer,
        elapsed: timer.elapsed + 1,
        remaining: timer.remaining - 1,
      };

      this.setState({ timer: newTimer });
      this.props.onChange(newTimer);

      const { mute } = this.state;

      if (newTimer.remaining === 0 && !mute) {
        console.info('[BEEP] Time elapsed');
        this.playSound();
      }
    }
  }

  toggleMute = () => {
    this.setState(prevState => ({ mute: !prevState.mute }));
  }

  localToggleTicking = () => {
    const { timer, skew } = this.state;
    const { timerFref } = this.props;

    toggleTicking({ timer, timerFref, skew });
  }

  handleKeyDown = (ev: KeyboardEvent) => {
    if (this.props.toggleKeyCode === ev.keyCode && ev.altKey) {
      this.localToggleTicking()
    }
  }

  skewCallback = (skew: firebase.database.DataSnapshot | null) => {
    if (skew) {
      console.info('Detected clock skew is', skew.val(), 'millis');
      this.setState({ skew: skew.val() });
    }
  }

  timerCallback = (timer: firebase.database.DataSnapshot | null) => {
    if (timer && timer.val()) {
      let timerData = timer.val();

      const { skew } = this.state;

      const now = getTimeWithSkewCorrection(skew)

      if (timerData.ticking) {
        const remaining = timerData.remaining - (now - timerData.ticking);
        const elapsed = timerData.elapsed + (now - timerData.ticking);
        // HACK: Handle late mounts by checking the difference between when the clock started clicking
        // and when the timer mounted / recieved new info
        timerData = { ...timerData, remaining , elapsed };
      }

      this.setState({ timer: timerData });
      this.props.onChange(timerData);
    }
  }

  componentDidMount() {
    const { handleKeyDown, timerCallback, tick, props, state, skewCallback } = this;

    props.timerFref.on('value', timerCallback);
    state.offsetRef.on('value', skewCallback);

    this.setState({ timerId: setInterval(tick, 1000) });

    document.addEventListener<'keydown'>('keydown', handleKeyDown);
  }

  componentWillUnmount() {
    const { handleKeyDown, timerCallback, skewCallback, props, state } = this;
    const { timerId } = this.state;

    props.timerFref.off('value', timerCallback);
    state.offsetRef.off('value', skewCallback);

    if (timerId) {
      clearInterval(timerId);
    }

    document.removeEventListener('keydown', handleKeyDown);
  }

  increment = () => {
    const num = Number(this.state.durationField);

    if (num) {
      this.setState({ durationField: (num + 1).toString() });
    }
  }
  
  playSound = () => {
    // @ts-ignore
    var context = new (window.audioContext || window.AudioContext || window.webkitAudioContext)();

    var osc = context.createOscillator(); 
    osc.type = 'sine'; // sine, square, sawtooth, triangle
    osc.frequency.value = 440; // Hz

    osc.connect(context.destination); 
    osc.start(); 
    osc.stop(context.currentTime + 0.35); 
  }

  set = () => {
    const duration = Number(this.state.durationField);

    if (duration) {
      const newTimer = {
        elapsed: 0,
        remaining: getSeconds(duration, this.state.unitDropdown),
        ticking: false
      };

      this.props.timerFref.set(newTimer);
    }
  }

  decrement = () => {
    const num = Number(this.state.durationField);

    if (num) {
      this.setState({ durationField: (num - 1).toString() });
    }
  }

  setUnit = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    this.setState({ unitDropdown: data.value as Unit || Unit.Seconds });
  }

  setDuration = (e: React.FormEvent<HTMLInputElement>) =>
    this.setState({ durationField: e.currentTarget.value })

  render() {
    const { setUnit, setDuration } = this;
    const { timer, mute } = this.state;

    const remaining = timer ? timer.remaining : DEFAULT_TIMER.remaining;
    const elapsed = timer ? timer.elapsed : DEFAULT_TIMER.elapsed;

    const formatted = hhmmss(remaining);

    // For use with `indicating` on `Progress`
    const percentage = (remaining / (remaining + elapsed)) * 100;

    return (
      <Segment textAlign="center" >
        <Label attached="top left" size="large">{this.props.name}</Label>
        <Button
          loading={!timer}
          active={timer ? !!timer.ticking : false}
          negative={timer ? timer.remaining < 0 : false}
          size="massive"
          onClick={() => this.localToggleTicking()}
        >
          {formatted}
        </Button>

        <Button
          icon
          active={!mute}
          onClick={this.toggleMute}
          negative={timer ? timer.remaining === 0 && !!timer.ticking : false}
          loading={timer ? timer.remaining === 0 && !!timer.ticking : false}
        >
          <Icon name={mute ? 'alarm mute' : 'alarm'} />
        </Button>

        <Progress percent={percentage} active={false} indicating={true}/>
        <Form>
          <TimerSetter
            unitValue={this.state.unitDropdown}
            durationValue={this.state.durationField}
            onDurationChange={setDuration}
            onUnitChange={setUnit}
            onSet={this.set}
          />
        </Form>
      </Segment>
    );
  }
}