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

interface MemberData {
  present: boolean;
  rank: Rank;
  voting: boolean;
}

export default class Timer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const defaultMember = {
      present: true,
      rank: Rank.Standard,
      voting: true,
    };

    this.state = {
      member: defaultMember,
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
      <div>
        <p>{this.state.member.present}</p>
        <p>{this.state.member.rank}</p>
        <p>{this.state.member.voting}</p>
      </div>
    );
  }
}
