import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID } from './Committee';
import { MemberView, MemberData, MemberID, Rank } from './Member';
import * as Utils from './utils';

interface Props {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface State {
  newMemberName: string;
  newMemberRank: Rank;
}

function CommitteeStats(props: { data: CommitteeData }) {
  const memberItems: MemberData[] = Utils.objectToList(props.data.members);

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
      newMemberName: '',
      newMemberRank: Rank.Standard
    };
  }

  pushMember = (event: any) => {
    event.preventDefault();

    const newMember: MemberData = {
      name: this.state.newMemberName,
      rank: this.state.newMemberRank,
      present: true,
      voting: true
    };

    this.props.fref.child('members').push().set(newMember);
  }

  render() {
    const memberItems = Object.keys(this.props.committee.members).map(key =>
      (
        <MemberItem 
          key={key} 
          data={this.props.committee.members[key]} 
          fref={this.props.fref.child('members').child(key)} 
        />
      )
    );

    const NewMemberForm = () => {
      const nameHandler = (event: any) => {
        this.setState({ newMemberName: event.target.value });
      };

      return (
        <form key="newMemberForm" onSubmit={this.pushMember}>
          <label>
            Name:
          <input key="nameField" type="text" value={this.state.newMemberName} onChange={nameHandler} />
          </label>
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