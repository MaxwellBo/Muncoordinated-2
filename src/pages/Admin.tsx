import * as React from 'react';
import firebase from 'firebase/app';
import {
  MemberData,
  MemberID,
  Rank,
  parseFlagName,
  nameToMemberOption,
  MemberOption
} from '../modules/member';
import { Dropdown, Flag, Table, Button, Checkbox,
  CheckboxProps, DropdownProps, ButtonProps, Container, Message, Icon, Grid } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';
import { checkboxHandler, dropdownHandler } from '../modules/handlers';
import { makeDropdownOption } from '../utils';
import _ from 'lodash';
import { URLParameters } from '../types';
import { RouteComponentProps } from 'react-router';
import { logClickGeneralSpeakersList } from '../modules/analytics';
import { CommitteeStatsTable } from '../modules/committee-stats';
import {CommitteeData, CommitteeID, pushMember, Template} from '../models/committee';
import { TemplateAdder } from '../components/template';
import {COUNTRY_OPTIONS} from "../constants";

interface Props extends RouteComponentProps<URLParameters> {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface State {
  template?: Template;
  member: MemberOption;
  options: MemberOption[];
  rank: Rank;
  voting: MemberData['voting'];
  present: MemberData['present'];
}

const RANK_OPTIONS = [
  Rank.Standard,
  Rank.Veto,
  Rank.NGO,
  Rank.Observer
].map(makeDropdownOption);

export default class Admin extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      member: COUNTRY_OPTIONS[0],
      options: [],
      rank: Rank.Standard,
      voting: false,
      present: true
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

  canPushMember = (member: MemberOption) => { 
    const members = this.props.committee.members || {};
    const memberNames = Object.keys(members).map(id => 
      members[id].name
    );

    return !_.includes(memberNames, member.text);
  }

  pushSelectedMember = (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
    event.preventDefault();

    const committeeID: CommitteeID = this.props.match.params.committeeID;
    const member: MemberData = {
      name: this.state.member.text,
      rank: this.state.rank,
      present: this.state.present,
      voting: this.state.voting
    };

    pushMember(committeeID, member);
  }

  setMember = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    const { options: newOptions } = this.state;
    const newMember = [...newOptions, ...COUNTRY_OPTIONS].filter(c => c.value === data.value)[0];

    if (newMember) {
      this.setState({ member: newMember });
    }
  }

  setPresent = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    this.setState({ present: data.checked ?? false });
  }

  setVoting = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    this.setState({ voting: data.checked ?? false });
  }

  setRank = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    this.setState({ rank: data.value as Rank ?? Rank.Standard });
  }

  handleAdd = (event: React.KeyboardEvent<HTMLElement>, data: DropdownProps) => {
    // FSM looks sorta like the UN flag
    const newMember = nameToMemberOption((data.value as number | string).toString());

    if (_.includes(COUNTRY_OPTIONS, newMember)) {
      this.setState({ member: newMember });
    } else {
      const newOptions = [ newMember, ...this.state.options ];
      this.setState({ member: newMember, options: newOptions });
    }
  }

  gotoGSL = () => {
    const { committeeID } = this.props.match.params;

    this.props.history
      .push(`/committees/${committeeID}/caucuses/gsl`);

    logClickGeneralSpeakersList();
  }


  renderAdder() {
    const { handleAdd, setMember, setRank, setPresent, setVoting } = this;
    const { present: newMemberPresent, voting: newMemberVoting, options: newOptions, member } = this.state;

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
            error={!this.canPushMember(member)}
            options={[...newOptions, ...COUNTRY_OPTIONS]}
            onAddItem={handleAdd}
            onChange={setMember}
            value={member.key}
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
            value={this.state.rank}
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
            disabled={!this.canPushMember(member)}
            onClick={this.pushSelectedMember}
          />
        </Table.HeaderCell>
      </Table.Row>
    );
  }

  renderCommitteeMembers = (props: { data: CommitteeData, fref: firebase.database.Reference }) => {
    const members = this.props.committee.members || {};
    const memberItems = Object.keys(members).map(id =>
      this.renderMemberItem(id, members[id], props.fref.child('members').child(id))
    );

    return (
      <>
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
        {memberItems.length === 0
          ? <Message error>
            Add at least one committee member to proceed
          </Message>
          : <Button
            as='a'
            onClick={this.gotoGSL}
            primary
            fluid
          >
            General Speakers' List
              <Icon name="arrow right" />
          </Button>
        }
      </>
    );
  }

  render() {
    const { committee, fref } = this.props;

    return (
      <Container style={{ padding: '1em 0em 1.5em' }}>
        <Helmet>
          <title>Setup - SISCONFED</title>
        </Helmet>
        <Grid columns="2" stackable>
          <Grid.Row>
            <Grid.Column width={9}>
              <TemplateAdder committeeID={this.props.match.params.committeeID} />
              {this.renderCommitteeMembers({ data: committee, fref })}
            </Grid.Column>
            <Grid.Column width={7}>
              <CommitteeStatsTable verbose={true} data={committee} />
            </Grid.Column>
          </Grid.Row>
        </Grid >
      </Container>
    );
  }
}
