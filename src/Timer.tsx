import * as React from 'react';
import * as firebase from 'firebase';

interface Props { }
interface State {
  timer: TimerData;
  timerRef: firebase.database.Reference;
  timerId: any;
}

interface TimerData {
  elapsed: number;
  remaining: number;
  ticking: boolean;
}

export default class Timer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const caucusRef = firebase.database().ref('commitees/6019497035172651252/caucuses/General');

    const defaultTimer = {
      elapsed: 0,
      remaining: 0,
      ticking: false
    };

    this.state = {
      timer: defaultTimer,
      timerRef: caucusRef.child('caucusTimer'),
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

    this.setState({timer: newTimer});

    this.state.timerRef.set(this.state.timer);
  }

  componentDidMount() {
    this.state.timerRef.on('value', (timer) => {
      if (timer) {
        this.setState({ timer: timer.val() });
      }
    });

    this.setState({ timerId: setInterval(this.tick, 1000) });
  }

  componentWillUnmount() {
    this.state.timerRef.off();

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
