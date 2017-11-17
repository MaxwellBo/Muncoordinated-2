import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID } from './Committee';
import { MemberView, MemberData, MemberID, Rank } from './Member';
import * as Utils from './utils';
import { Dropdown } from 'semantic-ui-react';
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

  const canVote = ({rank}: MemberData) => rank === Rank.Veto || rank === Rank.Standard;
  const voting: number = memberItems.filter(canVote).length;

  const quorum: number =  Math.ceil(voting * 0.5);
  const draftResolution: number =  Math.ceil(voting * 0.25);
  const amendment: number =  Math.ceil(voting * 0.1);

  return (
    <div>
      <h5>Total delegates</h5>
      <p>{delegates.toString()}</p>
      <h5>Voting</h5>
      <p>{voting.toString()}</p>
      <h5>Quorum</h5>
      <p>{quorum.toString()}</p>
      <h5>Draft Resolution</h5>
      <p>{draftResolution.toString()}</p>
      <h5>Amendment</h5>
      <p>{amendment.toString()}</p>
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
        <h4>Stats</h4>
        <CommitteeStats data={this.props.committee} />
      </div>
    );
  }
}