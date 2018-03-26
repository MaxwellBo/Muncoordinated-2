import * as React from 'react';
import * as firebase from 'firebase';
import { Form, Checkbox, Segment, Header, Statistic, Button, Input, Select, 
  Divider, Progress, DropdownProps } from 'semantic-ui-react';
import { makeDropdownOption } from "./utils";
import { Unit, TimerSetter } from "./TimerSetter";

interface Props {
  name: string;
  fref: firebase.database.Reference;
  onChange: (timer: TimerData) => any;
  toggleKeyCode?: number;
}

interface State {
  timer: TimerData;
  timerId: any | null;
  unitDropdown: Unit;
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
      unitDropdown: Unit.Seconds,
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
      this.props.onChange(newTimer);
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

  handleKeyDown = (ev: KeyboardEvent) => {
    if (this.props.toggleKeyCode === ev.keyCode && ev.altKey) {
      this.toggleHandler(null, null);
    }
  }

  componentDidMount() {
    this.props.fref.on('value', (timer) => {
      if (timer) {
        this.setState({ timer: timer.val() });
        this.props.onChange(timer.val());
      }
    });

    this.setState({ timerId: setInterval(this.tick, 1000) });

    const { handleKeyDown } = this;
    document.addEventListener<'keydown'>('keydown', handleKeyDown);
  }

  componentWillUnmount() {
    this.props.fref.off();

    if (this.state.timerId) {
      clearInterval(this.state.timerId);
    }

    const { handleKeyDown } = this;
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

  render() {
    const unitHandler = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
      this.setState({ unitDropdown: data.value as Unit || Unit.Seconds });
    };

    const durationHandler = (e: React.FormEvent<HTMLInputElement>) =>
      this.setState({ durationField: e.currentTarget.value });

    const remaining = this.state.timer.remaining;
    const elapsed = this.state.timer.elapsed;

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
            active={this.state.timer.ticking}
            negative={this.state.timer.remaining < 0}
            size="massive"
            onClick={this.toggleHandler}
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