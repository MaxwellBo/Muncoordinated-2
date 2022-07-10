import * as React from 'react';
import * as firebase from 'firebase/app';
import { Container } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import Timer, { TimerData } from './Timer';
import { URLParameters } from '../types';
import { Unit } from './TimerSetter';

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
          <title>{`Unmoderated Caucus - Muncoordinated`}</title>
        </Helmet>
        <Timer 
          name="Unmoderated caucus" 
          timerFref={committeeFref} 
          onChange={(x: TimerData) => x} 
          defaultDuration={10}
          defaultUnit={Unit.Minutes}
        />
      </Container>
    );
  }
}