import * as React from 'react';
import { FormattedMessage, injectIntl, type IntlShape } from 'react-intl';
import { Button, DropdownProps, Form, Icon, Label, Progress, Segment, Header } from 'semantic-ui-react';
import { TimeSetter } from './TimeSetter';
import _ from 'lodash';
import { DEFAULT_TIMER, getSeconds, TimerData, Unit } from "../models/time";
import firebase from 'firebase/compat/app';

interface Props {
  name: string;
  timerFref: firebase.database.Reference;
  onChange: (timer: TimerData) => void;
  toggleKeyCode?: number;
  defaultUnit: Unit;
  defaultDuration: number;
  totalSeconds: number;
  onFinish?: () => void;
  onTick?: (secondsRemaining: number) => void;
  canEdit?: boolean;
  intl: IntlShape;
}

interface State {
  timer?: TimerData;
  timerId?: NodeJS.Timeout;
  skew?: number;
  offsetRef: firebase.database.Reference;
  unitDropdown: Unit;
  durationField: string;
  mute: boolean;
  secondsRemaining: number;
  isRunning: boolean;
  startedAt?: number;
  pausedAt?: number;
}

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

class Timer extends React.Component<Props, State> {
  private interval?: number;

  constructor(props: Props) {
    super(props);

    const { defaultUnit, defaultDuration } = props;

    this.state = {
      offsetRef: firebase.database().ref('/.info/serverTimeOffset'),
      unitDropdown: defaultUnit || Unit.Minutes,
      durationField: defaultDuration ? defaultDuration.toString() : '1',
      mute: true,
      secondsRemaining: props.totalSeconds,
      isRunning: false
    };
  }

  componentDidMount() {
    const { handleTimerUpdate, props, state } = this;

    props.timerFref.on('value', handleTimerUpdate);
    state.offsetRef.on('value', this.skewCallback);

    this.setState({ timerId: setInterval(this.tick, 1000) });

    document.addEventListener<'keydown'>('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    const { handleTimerUpdate, skewCallback, props, state } = this;
    const { timerId } = this.state;

    props.timerFref.off('value', handleTimerUpdate);
    state.offsetRef.off('value', skewCallback);

    if (timerId) {
      clearInterval(timerId);
    }

    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleTimerUpdate = (snapshot: firebase.database.DataSnapshot) => {
    const timerData = snapshot.val();
    if (timerData) {
      const { startedAt, pausedAt } = timerData;
      const now = Date.now();

      if (startedAt && !pausedAt) {
        // Timer is running
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        const secondsRemaining = Math.max(0, this.props.totalSeconds - elapsedSeconds);

        this.setState({
          secondsRemaining,
          isRunning: true,
          startedAt,
          pausedAt: undefined
        });

        if (secondsRemaining === 0) {
          this.props.onFinish?.();
        } else {
          this.startTicking();
        }
      } else if (startedAt && pausedAt) {
        // Timer is paused
        const elapsedSeconds = Math.floor((pausedAt - startedAt) / 1000);
        const secondsRemaining = Math.max(0, this.props.totalSeconds - elapsedSeconds);

        this.setState({
          secondsRemaining,
          isRunning: false,
          startedAt,
          pausedAt
        });

        this.stopTicking();
      } else {
        // Timer is reset
        this.setState({
          secondsRemaining: this.props.totalSeconds,
          isRunning: false,
          startedAt: undefined,
          pausedAt: undefined
        });

        this.stopTicking();
      }
    }
  };

  startTicking = () => {
    if (!this.interval) {
      this.interval = window.setInterval(() => {
        const { secondsRemaining } = this.state;
        if (secondsRemaining > 0) {
          this.setState({ secondsRemaining: secondsRemaining - 1 });
          this.props.onTick?.(secondsRemaining - 1);
        } else {
          this.stopTicking();
          this.props.onFinish?.();
        }
      }, 1000);
    }
  };

  stopTicking = () => {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = undefined;
    }
  };

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
    this.setState({ unitDropdown: data.value as Unit });
  }

  setDuration = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({ durationField: e.currentTarget.value });
  }

  formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  render() {
    const { props: { intl } } = this;
    const { timer, mute } = this.state;

    const remaining = timer ? timer.remaining : DEFAULT_TIMER.remaining;
    const elapsed = timer ? timer.elapsed : DEFAULT_TIMER.elapsed;

    const formatted = hhmmss(remaining);

    // For use with `indicating` on `Progress`
    const percentage = (remaining / (remaining + elapsed)) * 100;

    return (
      <Segment textAlign="center">
        <Header as="h3">
          <FormattedMessage id="timer.time.remaining" defaultMessage="Time remaining" />
        </Header>
        <Header as="h1">{formatted}</Header>
        {this.props.canEdit && (
          <Button.Group>
            <Button 
              primary 
              icon 
              labelPosition="left" 
              onClick={this.handleStart}
            >
              <Icon name="play" />
              <FormattedMessage 
                id="timer.start" 
                defaultMessage="Start" 
              />
            </Button>
            <Button icon labelPosition="right" onClick={this.handleReset}>
              <Icon name="redo" />
              <FormattedMessage id="timer.reset" defaultMessage="Reset" />
            </Button>
          </Button.Group>
        )}
        <Button
          icon
          active={!mute}
          onClick={this.toggleMute}
          negative={timer ? timer.remaining === 0 && !!timer.ticking : false}
          loading={timer ? timer.remaining === 0 && !!timer.ticking : false}
          title={intl.formatMessage({ 
            id: mute ? 'timer.unmute' : 'timer.mute', 
            defaultMessage: mute ? 'Unmute alarm' : 'Mute alarm' 
          })}
        >
          <Icon name={mute ? 'alarm mute' : 'alarm'} />
        </Button>
        <Progress percent={percentage} active={false} indicating={true} />
        <Form>
          <Form.Group>
            <TimeSetter
              unit={this.state.unitDropdown}
              duration={this.state.durationField}
              onUnitChange={(unit: Unit) => this.setState({ unitDropdown: unit })}
              onDurationChange={(duration: string) => this.setState({ durationField: duration })}
            />
            <Form.Button
              primary
              disabled={!this.state.durationField}
              onClick={this.set}
            >
              <FormattedMessage id="timer.set" defaultMessage="Set" />
            </Form.Button>
          </Form.Group>
        </Form>
      </Segment>
    );
  }

  handleStart = () => {
    const now = Date.now();
    this.props.timerFref.update({
      startedAt: now,
      pausedAt: null
    });
  };

  handleReset = () => {
    this.props.timerFref.update({
      startedAt: null,
      pausedAt: null
    });
  };
}

export default injectIntl(Timer);