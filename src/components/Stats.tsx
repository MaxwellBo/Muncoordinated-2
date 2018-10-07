import * as React from 'react';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import Committee, { CommitteeData } from './Committee';
import { RouteComponentProps } from 'react-router';
import { Table, Flag, Container } from 'semantic-ui-react';
import { MemberData, MemberID, parseFlagName } from './Member';
import { CaucusID, CaucusData } from './Caucus';
import { URLParameters } from '../types';
import Loading from './Loading';
import { SpeakerEvent } from './caucus/SpeakerFeed';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

export default class Stats extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase
        .database()
        .ref('committees')
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

  timesSpokenInCommitee(committee: CommitteeData, memberID: MemberID, member: MemberData) {
    const caucuses = committee.caucuses || {} as Map<CaucusID, CaucusData>;

    let times = 0;

    Object.keys(caucuses).forEach(cid => {
      const caucus: CaucusData = caucuses[cid];

      const history = caucus.history || {} as Map<string, SpeakerEvent>;
      
      Object.keys(history).map(hid => history[hid]).forEach((speakerEvent: SpeakerEvent) => {
        if (speakerEvent.who === member.name) { // I fucked up and used name in SpeakerEvent, not MemberID
          times += 1;
        }
      }
      );
    });

    return times;
  }

  renderCommittee = (committee: CommitteeData) => {
    const { timesSpokenInCommitee } = this;

    const members = committee.members || {} as Map<MemberID, MemberData>;

    const rows = _.sortBy(
      Object.keys(members), 
      (mid) => timesSpokenInCommitee(committee, mid, members[mid])
    ).reverse().map(mid => {
      const member = members[mid];

      return (
        <Table.Row key={mid} >
          <Table.Cell>
            <Flag name={parseFlagName(member.name)} />
            {member.name}
          </Table.Cell>
          <Table.Cell>
            {timesSpokenInCommitee(committee, mid, member)}
          </Table.Cell>
        </Table.Row>
      );
    });

    return (
      <Container text style={{ padding: '1em 0em' }}>
        <Table compact celled definition>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell>Times Spoken</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {rows}
          </Table.Body>
        </Table>
      </Container>
    );
  }

  render() {
    const { committee } = this.state;

    if (committee) {
      return this.renderCommittee(committee);
    } else {
      return <Loading />;
    }
  }
}  