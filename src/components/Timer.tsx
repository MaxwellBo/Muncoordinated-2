import * as React from 'react';
import * as firebase from 'firebase';
import { Form, Checkbox, Segment, Header, Statistic, Button, Input, Select, 
  Divider, Progress, DropdownProps, ButtonProps } from 'semantic-ui-react';
import { makeDropdownOption } from '../utils';
import { Unit, TimerSetter } from './TimerSetter';
import * as _ from 'lodash';

interface Props {
  name: string;
  timerFref: firebase.database.Reference;
  onChange: (timer: TimerData) => void;
  toggleKeyCode?: number;
}

interface State {
  timer?: TimerData;
  timerId?: NodeJS.Timer;
  skew?: number;
  offsetRef: firebase.database.Reference;
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

export default class Timer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      offsetRef: firebase.database().ref('/.info/serverTimeOffset'),
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

  getNow = () => {
    const { skew } = this.state;

    const millis =  skew ? skew + (new Date).getTime() : (new Date).getTime();

    return Math.floor(millis / 1000);
  }

  toggleHandler = (event: React.MouseEvent<HTMLButtonElement> | {}, data: ButtonProps | {}) => {
    const timer = this.state.timer;

    if (timer) {
      const newTimer = {
        elapsed: timer.elapsed,
        remaining: timer.remaining,
        ticking: timer.ticking ? false : this.getNow()
      };

      this.props.timerFref.set(newTimer);
    }
  }

  handleKeyDown = (ev: KeyboardEvent) => {
    if (this.props.toggleKeyCode === ev.keyCode && ev.altKey) {
      this.toggleHandler({}, {});
    }
  }

  skewCallback = (skew: firebase.database.DataSnapshot | null) => {
    if (skew) {
      this.setState({ skew: skew.val() });
    }
  }

  timerCallback = (timer: firebase.database.DataSnapshot | null) => {
    if (timer && timer.val()) {
      let timerData = timer.val();

      const now = this.getNow();

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
    const { handleKeyDown, timerCallback, skewCallback, tick, props, state } = this;
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

  set = () => {
    const duration = Number(this.state.durationField);

    if (duration) {
      const newTimer = {
        elapsed: 0,
        remaining: this.state.unitDropdown === Unit.Minutes ? duration * 60 : duration,
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
    const seconds = _.padStart(Math.abs(remaining % 60).toString(), 2, '0');

    const formatted = sign + minutes + ':' + seconds;

    // For use with `indicating` on `Progress`
    const percentage = (remaining / (remaining + elapsed)) * 100;

    return (
      <div>
        <Header as="h3" attached="top">{this.props.name}</Header>
        <Segment attached="bottom" textAlign="center" >
          Skew {this.state.skew}
          <Button
            loading={!timer}
            active={timer ? !!timer.ticking : false}
            negative={timer ? timer.remaining < 0 : false}
            size="massive"
            onClick={toggleHandler}
          >
            {formatted}
          </Button>

          <Progress percent={percentage} active={false} indicating={true}/>

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