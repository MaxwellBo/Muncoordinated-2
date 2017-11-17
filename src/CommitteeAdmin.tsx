import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID } from './Committee';
import { MemberView, MemberData, MemberID, Rank } from './Member';
import * as Utils from './utils';
import { Dropdown, Segment, Header, Table } from 'semantic-ui-react';
import { countryOptions, CountryOption } from './common';

interface Props {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface State {
  newCountry: CountryOption;
  newMemberRank: Rank;
}

function CommitteeStats(props: { data: CommitteeData }) {
  const members = props.data.members ? props.data.members : {} as Map<string, MemberData>;
  const memberItems: MemberData[] = Utils.objectToList(members);

  const delegates: number = memberItems.length;
  const present: number = memberItems.filter(x => x.present).length;

  const canVote = ({rank}: MemberData) => rank === Rank.Veto || rank === Rank.Standard;
  const voting: number = memberItems.filter(canVote).length;

  const quorum: number =  Math.ceil(voting * 0.5);
  const hasQuorum: boolean = present >= quorum;
  const draftResolution: number =  Math.ceil(voting * 0.25);
  const amendment: number =  Math.ceil(voting * 0.1);

  return (
    <div>
      <Header as="h2" attached="top">
        Stats
      </Header>
      <Segment attached>
        <Table definition>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell>Required</Table.HeaderCell>
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
              <Table.Cell>Voting</Table.Cell>
              <Table.Cell>{voting.toString()}</Table.Cell>
              <Table.Cell>Delegates with voting rights</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell error={!hasQuorum}>Debate</Table.Cell>
              <Table.Cell>{quorum.toString()}</Table.Cell>
              <Table.Cell>Delegates needed for debate</Table.Cell>
              <Table.Cell>50% of total</Table.Cell>
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
      </Segment>
    </div>
  );
}

function MemberItem(props: { data: MemberData, fref: firebase.database.Reference } ) {
  // XXX: Might want to share code with CaucusItem?
  return (
    <MemberView data={props.data} fref={props.fref} />
  );
}

export default class CommitteeAdmin extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      newCountry: countryOptions[0],
      newMemberRank: Rank.Standard
    };
  }

  pushMember = (event: any) => {
    event.preventDefault();

    const newMember: MemberData = {
      name: this.state.newCountry.text,
      rank: this.state.newMemberRank,
      present: true,
      voting: true
    };

    this.props.fref.child('members').push().set(newMember);
  }

  render() {
    const members = this.props.committee.members ? this.props.committee.members : {};
    const memberItems = Object.keys(members).map(key =>
      (
        <MemberItem 
          key={key} 
          data={this.props.committee.members[key]} 
          fref={this.props.fref.child('members').child(key)} 
        />
      )
    );

    const NewMemberForm = () => {
      const nameHandler = (event: any, data: any) => {
        // FIXME: Probably a hack but it's the best I can do lmao 
        this.setState({ newCountry: countryOptions.filter(c => c.value === data.value)[0] });
      };

      return (
        <form key="newMemberForm" onSubmit={this.pushMember}>
          <Dropdown 
            placeholder="Select Country" 
            fluid 
            search 
            selection 
            options={countryOptions} 
            onChange={nameHandler} 
            value={this.state.newCountry.value} 
          />
          <input type="submit" value="Submit" />
        </form>
      );
    };

    return (
      <div>
        <h3>Admin</h3>
        <h4>Members</h4>
        {memberItems}
        <NewMemberForm />
        <CommitteeStats data={this.props.committee} />
      </div>
    );
  }
}