import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID } from './Committee';
import { MemberView, MemberData, MemberID } from './Member';

interface Props {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

interface State {
}

function MemberItem(props: { data: MemberData } ) {
  // XXX: Might want to share code with CaucusItem?
  return (
    <MemberView data={props.data} />
  );
}

export default class CommitteeAdmin extends React.PureComponent<Props, State> {
  render() {
    const memberItems = Object.keys(this.props.committee.members).map(key =>
      <MemberItem key={key} data={this.props.committee.members[key]} />
    );

    return (
      <div>
        <h3>Admin</h3>
        <h4>Members</h4>
        {memberItems}
      </div>
    );
  }
}