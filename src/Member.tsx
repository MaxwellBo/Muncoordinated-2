import * as React from 'react';
import * as firebase from 'firebase';

interface Props { 
  fref: firebase.database.Reference;
}

interface State {
  member: MemberData;
}

enum Rank {
    Veto = 'Veto',
    Standard = 'Observer',
    NGO = 'NGO',
    Observer = 'Observer'
}

export type MemberID = String;

export interface MemberData {
  name: string;
  present: boolean;
  rank: Rank;
  voting: boolean;
}

export const MemberView = (props: { data: MemberData }) => {
  return (
    <div style={{ border: 'solid '}}>
      <h4>Name</h4>
      <p>{props.data.name}</p>
      <h4>Present</h4>
      <p>{props.data.present}</p>
      <h4>Rank</h4>
      <p>{props.data.rank}</p>
      <h4>Voting</h4>
      <p>{props.data.voting}</p>
    </div>
  );
};

const DEFAULT_MEMBER = {
  name: '',
  present: true,
  rank: Rank.Standard,
  voting: true,
};

export default class Member extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = { 
      member: DEFAULT_MEMBER,
    };
  }

  componentDidMount() {
    this.props.fref.on('value', (member) => {
      if (member) {
        this.setState({ member: member.val() });
      }
    });
  }

  componentWillUnmount() {
    this.props.fref.off();
  }

  render() {
    return (
      <MemberView data={this.state.member} />
    );
  }
}
