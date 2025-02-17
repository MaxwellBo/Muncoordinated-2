import * as React from 'react';
import firebase from 'firebase/compat/app';
import {RouteComponentProps} from 'react-router';
import {URLParameters} from '../types';
import {Checkbox, Container, Header, Segment} from 'semantic-ui-react';
import {checkboxHandler} from '../modules/handlers';
import {CommitteeData} from "../models/committee";
import {DEFAULT_SETTINGS, SettingsData} from "../models/settings";
import { Helmet } from 'react-helmet';
import { FormattedMessage, useIntl } from 'react-intl';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

export default class Settings extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees')
        .child(match.params.committeeID)
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val() });
    }
  }

  componentDidMount() {
    this.state.committeeFref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    this.state.committeeFref.off('value', this.firebaseCallback);
  }

  renderSetting = (setting: keyof SettingsData, messageId: string, defaultMessage: string) => {
    const { committee, committeeFref } = this.state;

    const settingsFref = committeeFref.child('settings');

    const value = committee ? committee.settings[setting] : DEFAULT_SETTINGS[setting];

    return (
      <Checkbox 
        slider 
        indeterminate={value === undefined}
        checked={value || false}
        onChange={checkboxHandler<SettingsData>(settingsFref, setting)}
        label={<FormattedMessage id={messageId} defaultMessage={defaultMessage} />}
      />
    );
  }

  render() {
    const { renderSetting } = this;
    const { committee } = this.state;

    return (
      <Container text style={{ padding: '1em 0em' }}>
        <Helmet>
          <title>
            <FormattedMessage id="settings.page.title" defaultMessage="Settings - Muncoordinated" />
          </title>
        </Helmet>
        <Header as="h3" attached="top">
          <FormattedMessage id="settings.title" defaultMessage="Settings" />
        </Header>
        <Segment attached="bottom" loading={!committee}>
          {renderSetting(
            'moveQueueUp', 
            'settings.queue.position', 
            '\'Queue\' should appear above \'Next speaking\''
          )}
          {renderSetting(
            'timersInSeparateColumns',
            'settings.timers.arrangement',
            'Alternate arrangement with \'Speaker timer\' and \'Caucus timer\' in separate columns'
          )}
          {/* {renderSetting(
            'autoNextSpeaker',
            'settings.auto.next',
            'The next speaker will automatically be moved to the \'Now speaking\' position after the time has elapsed for the current speaker'
          )} */}
        </Segment>
      </Container>
    );
  }
}