import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData } from './Committee';
import { RouteComponentProps } from 'react-router';
import Timer, { TimerData } from './Timer';
import { URLParameters } from '../types';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  timer?: TimerData;
  committeeFref: firebase.database.Reference;
}

export default class Unmod extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees')
        .child(match.params.committeeID)
        .child('timer')
    };
  }

  render() {
    const { committeeFref } = this.state;

    return (
      <Timer name="Unmoderated Caucus" timerFref={committeeFref} onChange={(x: TimerData) => x} />
    );
  }
}