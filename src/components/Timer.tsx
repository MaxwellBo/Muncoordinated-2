import * as React from 'react';
import * as firebase from 'firebase';
import { Form, Checkbox, Segment, Header, Statistic, Button, Input, Select, 
  Divider, Progress, DropdownProps } from 'semantic-ui-react';
import { makeDropdownOption } from '../utils';
import { Unit, TimerSetter } from './TimerSetter';

interface Props {
  name: string;
  fref: firebase.database.Reference;
  onChange: (timer: TimerData) => any;
  toggleKeyCode?: number;
}

interface State {
  timer?: TimerData;
  timerId?: NodeJS.Timer;
  unitDropdown: Unit;
  durationField: string;
}

export interface TimerData {
  elapsed: number;
  remaining: number;
  ticking: boolean | number;
}

export const DEFAULT_TIMER = {
  elapsed: 0,
  remaining: 60,
  ticking: false
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
function padStart(xs: string, targetLength: number, padString?: string) {
  // tslint:disable-next-line
  targetLength = targetLength >> 0; // floor if number or convert non-number to 0;
  padString = String(padString || ' ');
  if (xs.length > targetLength) {
    return String(xs);
  } else {
    targetLength = targetLength - xs.length;
    if (targetLength > padString.length) {
      // append to original to ensure we are longer than needed
      padString += padString.repeat(targetLength / padString.length);
    }
    return padString.slice(0, targetLength) + String(xs);
  }
}

export class Timer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      unitDropdown: Unit.Seconds,
      durationField: '60'
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
    }
  }

  toggleHandler = (event: any, data: any) => {
    const timer = this.state.timer;

    const timestamp = Math.floor((new Date).getTime() / 1000);

    if (timer) {
      const newTimer = {
        elapsed: timer.elapsed,
        remaining: timer.remaining,
        ticking: timer.ticking ? false : timestamp
      };

      this.props.fref.set(newTimer);
    }
  }

  handleKeyDown = (ev: KeyboardEvent) => {
    if (this.props.toggleKeyCode === ev.keyCode && ev.altKey) {
      this.toggleHandler({}, {});
    }
  }

  firebaseCallback = (timer: firebase.database.DataSnapshot | null) => {
    if (timer && timer.val()) {
      let timerData = timer.val();

      const now = Math.floor((new Date).getTime() / 1000);

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
    const { handleKeyDown, firebaseCallback, tick, props } = this;

    props.fref.on('value', firebaseCallback);

    this.setState({ timerId: setInterval(tick, 1000) });

    document.addEventListener<'keydown'>('keydown', handleKeyDown);
  }

  componentWillUnmount() {
    const { handleKeyDown, firebaseCallback, tick, props } = this;
    const { timerId } = this.state;

    props.fref.off('value', firebaseCallback);

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

  set = () => {
    const duration = Number(this.state.durationField);

    if (duration) {
      const newTimer = {
        elapsed: 0,
        remaining: this.state.unitDropdown === Unit.Minutes ? duration * 60 : duration,
        ticking: false
      };

      this.props.fref.set(newTimer);
    }
  }

  decrement = () => {
    const num = Number(this.state.durationField);

    if (num) {
      this.setState({ durationField: (num - 1).toString() });
    }
  }

  unitHandler = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    this.setState({ unitDropdown: data.value as Unit || Unit.Seconds });
  }

  durationHandler = (e: React.FormEvent<HTMLInputElement>) =>
    this.setState({ durationField: e.currentTarget.value })

  render() {
    const { unitHandler, durationHandler, toggleHandler } = this;
    const timer = this.state.timer;

    const remaining = timer ? timer.remaining : DEFAULT_TIMER.remaining;
    const elapsed = timer ? timer.elapsed : DEFAULT_TIMER.elapsed;

    const sign = (remaining < 0 ? '-' : '');
    const minutes = Math.floor(Math.abs(remaining / 60)).toString();
    const seconds = padStart(Math.abs(remaining % 60).toString(), 2, '0');

    const formatted = sign + minutes + ':' + seconds;

    // For use with `indicating` on `Progress`
    const percentage = (remaining / (remaining + elapsed)) * 100;

    return (
      <div>
        <Header as="h3" attached="top">{this.props.name}</Header>
        <Segment attached="bottom" textAlign="center" >
          <Button
            loading={!timer}
            active={timer ? !!timer.ticking : false}
            negative={timer ? timer.remaining < 0 : false}
            size="massive"
            onClick={toggleHandler}
          >
            {formatted}
          </Button>

          <Progress percent={percentage} active={false} />

          {/* <Statistic>
            <Statistic.Value>{this.state.timer.remaining}</Statistic.Value>
          </Statistic>
          <Checkbox toggle checked={this.state.timer.ticking} onChange={this.toggleHandler} /> */}
          <Divider />
          <Form>
            <TimerSetter
              unitValue={this.state.unitDropdown}
              durationValue={this.state.durationField}
              onDurationChange={durationHandler}
              onUnitChange={unitHandler}
              onSet={this.set}
            />
          </Form>
        </Segment>
      </div>
    );
  }
}