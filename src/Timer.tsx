import * as React from 'react';
import * as firebase from 'firebase';
import { Checkbox, Segment, Header, Statistic, Button, Input, Select, Divider } from 'semantic-ui-react';

interface Props { 
  name: string;
  fref: firebase.database.Reference;
}

enum Unit {
  Minutes = 'min',
  Seconds = 'sec'
}

const UNIT_OPTIONS = [
  { key: Unit.Seconds, text: Unit.Seconds, value: Unit.Seconds },
  { key: Unit.Minutes, text: Unit.Minutes, value: Unit.Minutes }
];

interface State {
  timer: TimerData;
  timerId: any | null;
  unit: Unit;
  durationField: string;
}

export interface TimerData {
  elapsed: number;
  remaining: number;
  ticking: boolean;
}

export const DEFAULT_TIMER = {
  elapsed: 0,
  remaining: 60,
  ticking: false
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
function padStart(xs: string, targetLength: number, padString?: string) {
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
      timer: DEFAULT_TIMER,
      timerId: null,
      unit: Unit.Seconds,
      durationField: '60'
    };
  }

  tick = () => {
    if (this.state.timer.ticking) {
      const newTimer = {
        elapsed: this.state.timer.elapsed + 1,
        remaining: this.state.timer.remaining - 1,
        ticking: this.state.timer.ticking
      };

      this.setState({ timer: newTimer });
    }
  }

  toggleHandler = (event: any, data: any) => {
    const newTimer = {
      elapsed: this.state.timer.elapsed,
      remaining: this.state.timer.remaining,
      ticking: !this.state.timer.ticking
    };

    this.props.fref.set(newTimer);
  }

  componentDidMount() {
    this.props.fref.on('value', (timer) => {
      if (timer) {
        this.setState({ timer: timer.val() });
      }
    });

    this.setState({ timerId: setInterval(this.tick, 1000) });
  }

  componentWillUnmount() {
    this.props.fref.off();

    if (this.state.timerId) {
      clearInterval(this.state.timerId);
    }
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
        remaining: this.state.unit === Unit.Minutes ? duration * 60 : duration,
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

  render() {
    const unitHandler = (event: any, data: any) => {
      this.setState({ unit: data.value });
    };

    const durationHandler = (e: React.FormEvent<HTMLInputElement>) =>
      this.setState({ durationField: e.currentTarget.value} );

    const remaining = this.state.timer.remaining;

    const sign = (remaining < 0 ? '-' : '');
    const minutes = Math.floor(Math.abs(remaining / 60)).toString();
    const seconds = padStart(Math.abs(remaining % 60).toString(), 2, '0');

    const formatted = sign + minutes + ':' + seconds;

    return (
      <div>
        <Header as="h3" attached="top">{this.props.name}</Header>
        <Segment attached textAlign="center" >
          <Button 
            active={this.state.timer.ticking}
            negative={this.state.timer.remaining < 0}
            size="massive"
            onClick={this.toggleHandler}
          >
            {formatted}
          </Button>

          {/* <Statistic>
            <Statistic.Value>{this.state.timer.remaining}</Statistic.Value>
          </Statistic>
          <Checkbox toggle checked={this.state.timer.ticking} onChange={this.toggleHandler} /> */}
          <Divider />
          <Input
            value={this.state.durationField}
            placeholder="Duration"
            onChange={durationHandler}
            action
          >
            <input />
            {/* <Button icon="minus" onClick={this.decrement} />
            <Button icon="plus"  onClick={this.increment} /> */}
            <Select value={this.state.unit} options={UNIT_OPTIONS} compact button onChange={unitHandler} />
            <Button onClick={this.set}>Set</Button>
          </Input>
        </Segment>
      </div>
    );
  }
}
