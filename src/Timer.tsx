import * as React from 'react';
import * as firebase from 'firebase';
import { Checkbox, Segment, Header, Statistic } from 'semantic-ui-react';

interface Props { 
  name: string;
  fref: firebase.database.Reference;
}

interface State {
  timer: TimerData;
  timerId: any;
}

export interface TimerData {
  elapsed: number;
  remaining: number;
  ticking: boolean;
}

export const DEFAULT_TIMER = {
  elapsed: 0,
  remaining: 0,
  ticking: false
};

export class Timer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      timer: DEFAULT_TIMER,
      timerId: null
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
      ticking: data.checked
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

    clearInterval(this.state.timerId);
  }

  render() {
    return (
      <div>
        <Header as="h3" attached="top">{this.props.name}</Header>
        <Segment attached >
          <Statistic>
            <Statistic.Value>{this.state.timer.remaining}</Statistic.Value>
          </Statistic>
          <Checkbox toggle checked={this.state.timer.ticking} onChange={this.toggleHandler} />
        </Segment>
      </div>
    );
  }
}
