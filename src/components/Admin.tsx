import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData } from './Committee';
import { MemberData, MemberID, Rank, parseFlagName, nameToMemberOption } from './Member';
import * as Utils from '../utils';
import { Dropdown, Flag, Table, Button, Checkbox,
  CheckboxProps, DropdownProps, ButtonProps, Tab, Container } from 'semantic-ui-react';
import { COUNTRY_OPTIONS, MemberOption } from '../constants';
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
  newMember: MemberOption;
  newOptions: MemberOption[];
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

export function CommitteeStats(props: { data?: CommitteeData, verbose: boolean }) {
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
          <Table.Cell>Delegates in committee</Table.Cell>
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
}

export default class Admin extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      newMember: COUNTRY_OPTIONS[0],
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
            className="members__button--remove-member"
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
    const { newMember } = this.state;

    const members = this.props.committee.members || {};
    const memberNames = Object.keys(members).map(id => 
      members[id].name
    );

    return !_.includes(memberNames, newMember.text);
  }

  pushMember = (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
    event.preventDefault();

    const newMember: MemberData = {
      name: this.state.newMember.text,
      rank: this.state.newMemberRank,
      present: this.state.newMemberPresent,
      voting: this.state.newMemberVoting
    };

    this.props.fref.child('members').push().set(newMember);
  }

  setMember = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    const { newOptions } = this.state;
    const newMember = [...newOptions, ...COUNTRY_OPTIONS].filter(c => c.value === data.value)[0];

    if (newMember) {
      this.setState({ newMember });
    }
  }

  setPresent = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    this.setState({ newMemberPresent: data.checked || false });
  }

  setVoting = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    this.setState({ newMemberVoting: data.checked || false });
  }

  setRank = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    this.setState({ newMemberRank: data.value as Rank || Rank.Standard });
  }

  handleAdd = (event: React.KeyboardEvent<HTMLElement>, data: DropdownProps) => {
    // FSM looks sorta like the UN flag
    const newMember = nameToMemberOption((data.value as number | string).toString());

    if (_.includes(COUNTRY_OPTIONS, newMember)) {
      this.setState({ newMember });
    } else {
      const newOptions = [ newMember, ...this.state.newOptions ];
      this.setState({ newMember, newOptions });
    }
  }

  renderAdder() {
    const { handleAdd, setMember, setRank, setPresent, setVoting } = this;
    const { newMemberPresent, newMemberVoting, newOptions, newMember } = this.state;

    return (
      <Table.Row>
        <Table.HeaderCell>
          <Dropdown
            icon="search"
            className="adder__dropdown--select-member"
            placeholder="Select preset member"
            search
            selection
            fluid
            allowAdditions
            error={!this.canPush()}
            options={[...newOptions, ...COUNTRY_OPTIONS]}
            onAddItem={handleAdd}
            onChange={setMember}
            value={newMember.key}
          />
        </Table.HeaderCell>
        <Table.HeaderCell>
          <Dropdown
            className="adder__dropdown--select-rank"
            search
            selection
            fluid
            options={RANK_OPTIONS}
            onChange={setRank}
            value={this.state.newMemberRank}
          />
        </Table.HeaderCell>
        <Table.HeaderCell collapsing >
          <Checkbox 
            className="adder__checkbox--toggle-present"
            toggle 
            checked={newMemberPresent} 
            onChange={setPresent} 
          />
        </Table.HeaderCell>
        <Table.HeaderCell collapsing >
          <Checkbox 
            className="adder__checkbox--toggle-voting"
            toggle 
            checked={newMemberVoting} 
            onChange={setVoting} 
          />
        </Table.HeaderCell>
        <Table.HeaderCell>
          <Button
            className="adder__button--add-member"
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
        menuItem: 'Thresholds', 
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
