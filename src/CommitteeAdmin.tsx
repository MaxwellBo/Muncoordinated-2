import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID } from './Committee';
import { MemberView, MemberData, MemberID, Rank } from './Member';
import * as Utils from './utils';
import { Dropdown, Segment, Header, Table, List, Button, Checkbox, Icon } from 'semantic-ui-react';
import { countryOptions, CountryOption } from './common';

interface Props {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface State {
  newCountry: CountryOption;
  newMemberRank: Rank;
  newMemberVoting: MemberData['voting'];
  newMemberPresent: MemberData['present'];
}

const RANK_OPTIONS = [
  { key: Rank.Standard, value: Rank.Standard, text: Rank.Standard },
  { key: Rank.Veto, value: Rank.Veto, text: Rank.Veto },
  { key: Rank.NGO, value: Rank.NGO, text: Rank.NGO },
  { key: Rank.Observer, value: Rank.Observer, text: Rank.Observer }
];

function CommitteeStats(props: { data: CommitteeData }) {
  const membersMap = props.data.members ? props.data.members : {} as Map<string, MemberData>;
  const members: MemberData[] = Utils.objectToList(membersMap);

  const delegates: number = members.length;
  const present: number = members.filter(x => x.present).length;

  const canVote = (x: MemberData) => (x.rank === Rank.Veto || x.rank === Rank.Standard) && x.voting;
  const voting: number = members.filter(canVote).length;

  const quorum: number = Math.ceil(delegates * 0.5);
  const hasQuorum: boolean = present >= quorum;
  const draftResolution: number = Math.ceil(voting * 0.25);
  const amendment: number = Math.ceil(voting * 0.1);

  return (
    <div>
      <Header as="h3">
        Stats
      </Header>
      <Table definition>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell />
            <Table.HeaderCell>Number</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
            <Table.HeaderCell>Threshold</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          <Table.Row>
            <Table.Cell>Total</Table.Cell>
            <Table.Cell>{delegates.toString()}</Table.Cell>
            <Table.Cell>Delegates in committee</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Present</Table.Cell>
            <Table.Cell>{present.toString()}</Table.Cell>
            <Table.Cell>Delegates in attendance</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Voting</Table.Cell>
            <Table.Cell>{voting.toString()}</Table.Cell>
            <Table.Cell>Delegates with voting rights</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell error={!hasQuorum}>Debate</Table.Cell>
            <Table.Cell error={!hasQuorum}>{quorum.toString()}</Table.Cell>
            <Table.Cell error={!hasQuorum}>Delegates needed for debate</Table.Cell>
            <Table.Cell error={!hasQuorum}>50% of total</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Draft resolution</Table.Cell>
            <Table.Cell>{draftResolution.toString()}</Table.Cell>
            <Table.Cell>Delegates needed to table a draft resolution</Table.Cell>
            <Table.Cell>25% of voting</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Amendment</Table.Cell>
            <Table.Cell>{amendment.toString()}</Table.Cell>
            <Table.Cell>Delegates needed to table an amendment</Table.Cell>
            <Table.Cell>10% of voting</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  );
}

function MemberItem(props: { data: MemberData, fref: firebase.database.Reference }) {
  const propertyHandler = (property: string) => (event: any, data: any) => {
    props.fref.child(property).set(data.checked);
  };

  const rankHandler = (event: any, data: any) => {
    props.fref.child('rank').set(data.value);
  };

  return (
    <Table.Row>
      <Table.Cell>{props.data.name}</Table.Cell>
      <Table.Cell>
        <Dropdown
          search
          selection
          options={RANK_OPTIONS}
          onChange={rankHandler}
          value={props.data.rank}
        />
      </Table.Cell>
      <Table.Cell collapsing>
        <Checkbox toggle checked={props.data.present} onChange={propertyHandler('present')}/>
      </Table.Cell>
      <Table.Cell collapsing>
        <Checkbox toggle checked={props.data.voting} onChange={propertyHandler('voting')}/>
      </Table.Cell>
      <Table.Cell>
        <Button 
          floated="right" 
          icon 
          labelPosition="left" 
          primary 
          size="small" 
          color="red" 
          onClick={() => props.fref.remove()} 
        >
          <Icon name="trash" /> Delete 
        </Button>
      </Table.Cell>
    </Table.Row>
  );
}

export default class CommitteeAdmin extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      newCountry: countryOptions[0],
      newMemberRank: Rank.Standard,
      newMemberVoting: true,
      newMemberPresent: true
    };
  }

  pushMember = (event: any) => {
    event.preventDefault();

    const newMember: MemberData = {
      name: this.state.newCountry.text,
      rank: this.state.newMemberRank,
      present: this.state.newMemberPresent,
      voting: this.state.newMemberVoting
    };

    this.props.fref.child('members').push().set(newMember);
  }

  NewMemberForm = () => {
    const nameHandler = (event: any, data: any) => {
      // FIXME: Probably a hack but it's the best I can do lmao 
      this.setState({ newCountry: countryOptions.filter(c => c.value === data.value)[0] });
    };

    return (
      <Dropdown
        placeholder="Select Country"
        search
        selection
        options={countryOptions}
        onChange={nameHandler}
        value={this.state.newCountry.value}
      />
    );
  }

  CommitteeMembers = (props: { data: CommitteeData, fref: firebase.database.Reference }) => {

    const members = this.props.committee.members ? this.props.committee.members : {};
    const memberItems = Object.keys(members).map(key =>
      (
        <MemberItem
          key={key}
          data={props.data.members[key]}
          fref={props.fref.child('members').child(key)}
        />
      )
    );

    const presentHandler = (event: any, data: any) => {
      this.setState({ newMemberPresent: data.checked });
    };

    const votingHandler = (event: any, data: any) => {
      this.setState({ newMemberVoting: data.checked });
    };

    const rankHandler = (event: any, data: any) => {
      this.setState({ newMemberRank: data.value });
    };

    return (
      <Table compact celled definition>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell />
            <Table.HeaderCell>Rank</Table.HeaderCell>
            <Table.HeaderCell>Present</Table.HeaderCell>
            <Table.HeaderCell>Voting</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {memberItems}
        </Table.Body>

        <Table.Footer fullWidth>
          <Table.Row>
            <Table.HeaderCell>
              <this.NewMemberForm />
            </Table.HeaderCell>
            <Table.HeaderCell>
              <Dropdown
                search
                selection
                options={RANK_OPTIONS}
                onChange={rankHandler}
                value={this.state.newMemberRank}
              />
            </Table.HeaderCell>
            <Table.HeaderCell collapsing >
              <Checkbox toggle checked={this.state.newMemberPresent} onChange={presentHandler} />
            </Table.HeaderCell>
            <Table.HeaderCell collapsing >
              <Checkbox toggle checked={this.state.newMemberVoting} onChange={votingHandler} />
            </Table.HeaderCell>
            <Table.HeaderCell>
              <Button floated="right" icon labelPosition="left" primary size="small" onClick={this.pushMember} >
                <Icon name="user" /> Add
              </Button>
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    );
  }

  render() {
    return (
      <div>
        <Header as="h2" attached="top">Admin</Header>
        <Segment attached >
          <this.CommitteeMembers data={this.props.committee} fref={this.props.fref} />
          <CommitteeStats data={this.props.committee} />
        </Segment>
      </div>
    );
  }
}