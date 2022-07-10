import * as React from 'react';
import * as firebase from 'firebase/app';
import { CommitteeData } from './Committee';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { Header, Segment, Checkbox, Container } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';
import { checkboxHandler } from '../actions/handlers';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

export interface SettingsData {
  moveQueueUp: boolean;
  timersInSeparateColumns: boolean;
  autoNextSpeaker: boolean;
  motionVotes?: boolean;
  motionsArePublic?: boolean;
}

export const DEFAULT_SETTINGS: Required<SettingsData> = {
  moveQueueUp: false,
  timersInSeparateColumns: false,
  autoNextSpeaker: false,
  motionVotes: false,
  motionsArePublic: false
};

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

  renderSetting = (setting: keyof SettingsData, label: string) => {
    const { committee, committeeFref } = this.state;

    const settingsFref = committeeFref.child('settings');

    const value = committee ? committee.settings[setting] : DEFAULT_SETTINGS[setting];

    return (
      <Checkbox 
        slider 
        indeterminate={value === undefined}
        checked={value || false}
        onChange={checkboxHandler<SettingsData>(settingsFref, setting)}
        label={label}
      />
    );
  }

  render() {
    const { renderSetting } = this;
    const { committee } = this.state;

    return (
      <Container text style={{ padding: '1em 0em' }}>
        <Helmet>
          <title>{`Settings - Muncoordinated`}</title>
        </Helmet>
        <Header as="h3" attached="top">Settings</Header>
        <Segment attached="bottom" loading={!committee}>
          {renderSetting('moveQueueUp', '\'Queue\' should appear above \'Next speaking\'')}
          {renderSetting(
            'timersInSeparateColumns',
            'Alternate arrangement with \'Speaker timer\' and \'Caucus timer\' in separate columns'
          )}
          {/* {renderSetting(
            'autoNextSpeaker',
            'The next speaker will automatically be moved to the \'Now speaking\' position after the time has elapsed for the current speaker'
          )} */}
        </Segment>
      </Container>
    );
  }
}