import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, URLParameters } from './Committee';
import { RouteComponentProps } from 'react-router';
import { TimerData, Timer } from './Timer';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  timer?: TimerData;
  fref: firebase.database.Reference;
}

export class Unmod extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      fref: firebase.database().ref('committees')
        .child(match.params.committeeID)
        .child('timer')
    };
  }

  render() {
    const { fref } = this.state;

    return (
      <Timer name="Unmoderated Caucus" fref={fref} onChange={(x: TimerData) => x} />
    );
  }
}