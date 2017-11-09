import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID } from './Committee';
import { MemberData, MemberID } from './Member';

interface Props {
  fref: firebase.database.Reference;
  committee: CommitteeData;
}

interface State {
}

export default class CommitteeAdmin extends React.PureComponent<Props, State> {
  render() {
    return (
      <div>
        <p>Admin</p>
      </div>
    );
  }
}