import * as React from 'react';
import firebase from 'firebase/compat/app';
import { Container } from 'semantic-ui-react';
import { RouteComponentProps } from 'react-router';
import Timer from '../components/Timer';
import { URLParameters } from '../types';
import {TimerData, Unit} from "../models/time";
import { Helmet } from 'react-helmet';

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
      <Container text style={{ padding: '1em 0em' }}>
        <Helmet>
          <title>{`Phiên thảo luận mở - vi-Muncoordinated`}</title>
        </Helmet>
        <Timer 
          name="Phiên thảo luận mở" 
          timerFref={committeeFref} 
          onChange={(x: TimerData) => x} 
          defaultDuration={10}
          defaultUnit={Unit.Minutes}
        />
      </Container>
    );
  }
}