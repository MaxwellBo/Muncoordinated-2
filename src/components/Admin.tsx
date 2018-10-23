import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID } from './Committee';
import { MemberData, MemberID, Rank, parseFlagName, nameToCountryOption } from './Member';
import * as Utils from '../utils';
import { Dropdown, Segment, Header, Flag, Table, List, Button, Checkbox, Icon, 
  CheckboxProps, DropdownProps, ButtonProps, Tab, Container } from 'semantic-ui-react';
import { COUNTRY_OPTIONS, CountryOption } from '../constants';
import { checkboxHandler, dropdownHandler } from '../actions/handlers';
import { makeDropdownOption } from '../utils';
import * as _ from 'lodash';

export const canVote = (x: MemberData) => (x.rank === Rank.Veto || x.rank === Rank.Standard);
export const nonNGO = (x: MemberData) => (x.rank !== Rank.NGO);

interface Props {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface State {
  newCountry: CountryOption;
  newOptions: CountryOption[];
  newMemberRank: Rank;
  newMemberVoting: MemberData['voting'];
  newMemberPresent: MemberData['present'];
}

const RANK_OPTIONS = [
  Rank.Standard,
  Rank.Veto,
  Rank.NGO,
  Rank.Observer
].map(makeDropdownOption);

export const CommitteeStats = (props: { data?: CommitteeData, verbose: boolean }) => {
  const { data, verbose } = props;

  const defaultMap = {} as Map<MemberID, MemberData>;
  const membersMap: Map<MemberID, MemberData> = data ? (data.members || defaultMap) : defaultMap;
  const members: MemberData[] = Utils.objectToList(membersMap);
  const present = members.filter(x => x.present);

  const delegatesNo: number     = members.length;
  const presentNo: number       = present.length;
  const absCanVote: number       = members.filter(canVote).length;
  const canVoteNo: number       = present.filter(canVote).length;
  const nonNGONo: number        = present.filter(nonNGO).length;

  const quorum: number          = Math.ceil(absCanVote * 0.25);
  const procedural: number      = Math.ceil(nonNGONo * 0.5);
  const operative: number       = Math.ceil(canVoteNo * 0.5);
  const hasQuorum: boolean      = presentNo >= quorum;
  const draftResolution: number = Math.ceil(canVoteNo * 0.25);
  const amendment: number       = Math.ceil(canVoteNo * 0.1);

  return (
    <Table definition>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>Number</Table.HeaderCell>
          <Table.HeaderCell>Description</Table.HeaderCell>
          {verbose && <Table.HeaderCell>Threshold</Table.HeaderCell>}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <Table.Row>
          <Table.Cell>Total</Table.Cell>
          <Table.Cell>{delegatesNo.toString()}</Table.Cell>
          <Table.Cell>Members in committee</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Present</Table.Cell>
          <Table.Cell>{presentNo.toString()}</Table.Cell>
          <Table.Cell>Delegates in attendance</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Have voting rights</Table.Cell>
          <Table.Cell>{canVoteNo.toString()}</Table.Cell>
          <Table.Cell>Present delegates with voting rights</Table.Cell>
        </Table.Row>
        {verbose && <Table.Row>
          <Table.Cell error={!hasQuorum}>Debate</Table.Cell>
          <Table.Cell error={!hasQuorum}>{quorum.toString()}</Table.Cell>
          <Table.Cell error={!hasQuorum}>Delegates needed for debate</Table.Cell>
          <Table.Cell error={!hasQuorum}>25% of of members with voting rights</Table.Cell>
        </Table.Row>}
        {verbose && <Table.Row>
          <Table.Cell>Procedural threshold</Table.Cell>
          <Table.Cell>{procedural.toString()}</Table.Cell>
          <Table.Cell>Required votes for procedural matters</Table.Cell>
          <Table.Cell>50% of present non-NGO delegates</Table.Cell>
        </Table.Row>}
        <Table.Row>
          <Table.Cell>Operative threshold</Table.Cell>
          <Table.Cell>{operative.toString()}</Table.Cell>
          <Table.Cell>Required votes for operative matters, such as amendments and resolutions</Table.Cell>
          {verbose && <Table.Cell>50% of present delegates with voting rights</Table.Cell>}
        </Table.Row>
        {verbose && <Table.Row>
          <Table.Cell>Draft resolution</Table.Cell>
          <Table.Cell>{draftResolution.toString()}</Table.Cell>
          <Table.Cell>Delegates needed to table a draft resolution</Table.Cell>
          <Table.Cell>25% of present delegates with voting rights</Table.Cell>
        </Table.Row>}
        {verbose && <Table.Row>
          <Table.Cell>Amendment</Table.Cell>
          <Table.Cell>{amendment.toString()}</Table.Cell>
          <Table.Cell>Delegates needed to table an amendment</Table.Cell>
          <Table.Cell>10% of present delegates with voting rights</Table.Cell>
        </Table.Row>}
      </Table.Body>
    </Table>
  );
};

export default class Admin extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      newCountry: COUNTRY_OPTIONS[0],
      newOptions: [],
      newMemberRank: Rank.Standard,
      newMemberVoting: false,
      newMemberPresent: true
    };
  }

  renderMemberItem = (id: MemberID, member: MemberData, fref: firebase.database.Reference) => {
    return (
      <Table.Row key={id}>
        <Table.Cell>
          <Flag name={parseFlagName(member.name)} />
          {member.name}
        </Table.Cell>
        <Table.Cell>
          <Dropdown
            search
            selection
            fluid
            options={RANK_OPTIONS}
            onChange={dropdownHandler<MemberData>(fref, 'rank')}
            value={member.rank}
          />
        </Table.Cell>
        <Table.Cell collapsing>
          <Checkbox 
            toggle 
            checked={member.present} 
            onChange={checkboxHandler<MemberData>(fref, 'present')} 
          />
        </Table.Cell>
        <Table.Cell collapsing>
          <Checkbox 
            toggle 
            checked={member.voting} 
            onChange={checkboxHandler<MemberData>(fref, 'voting')} 
          />
        </Table.Cell>
        <Table.Cell collapsing>
          <Button
            icon="trash"
            negative
            basic
            onClick={() => fref.remove()}
          />
        </Table.Cell>
      </Table.Row>
    );
  }

  canPush = () => { 
    const { newCountry } = this.state;

    const members = this.props.committee.members || {};
    const memberNames = Object.keys(members).map(id => 
      members[id].name
    );

    return !_.includes(memberNames, newCountry.text);
  }

  pushMember = (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
    event.preventDefault();

    const newMember: MemberData = {
      name: this.state.newCountry.text,
      rank: this.state.newMemberRank,
      present: this.state.newMemberPresent,
      voting: this.state.newMemberVoting
    };

    this.props.fref.child('members').push().set(newMember);
  }

  countryHandler = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    const { newOptions } = this.state;
    const newCountry = [...newOptions, ...COUNTRY_OPTIONS].filter(c => c.value === data.value)[0];

    if (newCountry) {
      this.setState({ newCountry });
    }
  }

  presentHandler = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    this.setState({ newMemberPresent: data.checked || false });
  }

  votingHandler = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    this.setState({ newMemberVoting: data.checked || false });
  }

  rankHandler = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    this.setState({ newMemberRank: data.value as Rank || Rank.Standard });
  }

  additionHandler = (event: React.KeyboardEvent<HTMLElement>, data: DropdownProps) => {
    // FSM looks sorta like the UN flag
    const newCountry = nameToCountryOption((data.value as number | string).toString());

    if (_.includes(COUNTRY_OPTIONS, newCountry)) {
      this.setState({ newCountry });
    } else {
      const newOptions = [ newCountry, ...this.state.newOptions ];
      this.setState({ newCountry, newOptions });
    }
  }

  renderAdder() {
    const { additionHandler, countryHandler, rankHandler, presentHandler, votingHandler } = this;
    const { newMemberPresent, newMemberVoting, newOptions, newCountry } = this.state;

    return (
      <Table.Row>
        <Table.HeaderCell>
          <Dropdown
            icon="search"
            placeholder="Select prepared member"
            search
            selection
            fluid
            allowAdditions
            error={!this.canPush()}
            options={[...newOptions, ...COUNTRY_OPTIONS]}
            onAddItem={additionHandler}
            onChange={countryHandler}
            value={newCountry.key}
          />
        </Table.HeaderCell>
        <Table.HeaderCell>
          <Dropdown
            search
            selection
            fluid
            options={RANK_OPTIONS}
            onChange={rankHandler}
            value={this.state.newMemberRank}
          />
        </Table.HeaderCell>
        <Table.HeaderCell collapsing >
          <Checkbox toggle checked={newMemberPresent} onChange={presentHandler} />
        </Table.HeaderCell>
        <Table.HeaderCell collapsing >
          <Checkbox toggle checked={newMemberVoting} onChange={votingHandler} />
        </Table.HeaderCell>
        <Table.HeaderCell>
          <Button
            icon="plus"
            primary
            basic
            disabled={!this.canPush()}
            onClick={this.pushMember}
          />
        </Table.HeaderCell>
      </Table.Row>
    );
  }

  CommitteeMembers = (props: { data: CommitteeData, fref: firebase.database.Reference }) => {

    const members = this.props.committee.members || {};
    const memberItems = Object.keys(members).map(id => 
      this.renderMemberItem(id, members[id], props.fref.child('members').child(id))
    );

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

        <Table.Header fullWidth>
          {this.renderAdder()}
        </Table.Header>

        <Table.Body>
          {memberItems.reverse()}
        </Table.Body>

      </Table>
    );
  }

  render() {
    const { CommitteeMembers } = this;
    const { committee, fref } = this.props;

    const panes = [
      { 
        menuItem: 'Members', 
        render: () => <Tab.Pane><CommitteeMembers data={committee} fref={fref} /></Tab.Pane> 
      },
      { 
        menuItem: 'Stats', 
        render: () => <Tab.Pane><CommitteeStats verbose={true} data={committee} /></Tab.Pane>
      }
    ];

    return (
      <Container text style={{ padding: '1em 0em' }}>
        <Tab panes={panes} />
      </Container>
    );
  }
}
