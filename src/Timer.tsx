import * as React from 'react';
import * as firebase from 'firebase';

interface Props { 
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

  toggle = () => {
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

    clearInterval(this.state.timerId);
  }

  render() {
    return (
      <div>
        <p>{this.state.timer.elapsed}</p>
        <p>{this.state.timer.remaining}</p>
        <p>{this.state.timer.ticking}</p>
        <button onClick={this.toggle}>
          Toggle
            </button>
      </div>
    );
  }
}
