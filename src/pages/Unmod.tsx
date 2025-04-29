import * as React from 'react';
import firebase from 'firebase/compat/app';
import { Container } from 'semantic-ui-react';
import { RouteComponentProps } from 'react-router';
import Timer from '../components/Timer';
import { URLParameters } from '../types';
import {TimerData, Unit} from "../models/time";
import { Helmet } from 'react-helmet';
import { FormattedMessage, injectIntl, type IntlShape } from 'react-intl';

interface Props extends RouteComponentProps<URLParameters> {
  intl: IntlShape;
}

interface State {
  timer?: TimerData;
  committeeFref: firebase.database.Reference;
}

class UnmodComponent extends React.Component<Props, State> {
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
    const { intl } = this.props;

    return (
      <Container text style={{ padding: '1em 0em' }}>
        <Helmet>
          <title>
            <FormattedMessage 
              id="unmod.page.title" 
              defaultMessage="Unmoderated Caucus - Muncoordinated" 
            />
          </title>
        </Helmet>
        <Timer 
          name={intl.formatMessage({ 
            id: 'unmod.timer.name', 
            defaultMessage: 'Unmoderated caucus' 
          })}
          timerFref={committeeFref} 
          onChange={(x: TimerData) => x} 
          defaultDuration={10}
          defaultUnit={Unit.Minutes}
          totalSeconds={600}
        />
      </Container>
    );
  }
}

export default injectIntl(UnmodComponent);