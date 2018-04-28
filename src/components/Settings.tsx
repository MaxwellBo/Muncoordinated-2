import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData } from './Committee';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { Header, Segment, Checkbox } from 'semantic-ui-react';
import { checkboxHandler } from '../actions/handlers';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

export interface SettingsData {
  moveQueueUp: boolean;
}

export const DEFAULT_SETTINGS = {
  moveQueueUp: false
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
        toggle 
        indeterminate={value === undefined}
        checked={value || false}
        onChange={checkboxHandler<SettingsData>(settingsFref, setting)}
        label={label}
      />
    );
  }

  render() {
    const { renderSetting } = this;
    const { committee, committeeFref } = this.state;

    return (
      <div>
        <Header as="h3" attached="top">Settings</Header>
        <Segment attached="bottom" loading={!committee}>
          {renderSetting('moveQueueUp', '\'Queue\' should appear above \'Next Speaking\'')}
        </Segment>
      </div>
    );
  }
}