import * as React from 'react';
import * as firebase from 'firebase';

interface Props { 
  fref: firebase.database.Reference;
}

interface State {
  member: MemberData;
}

export enum Rank {
    Veto = 'Veto',
    Standard = 'Standard',
    NGO = 'NGO',
    Observer = 'Observer'
}

export type MemberID = string;

export interface MemberData {
  name: string;
  present: boolean;
  rank: Rank;
  voting: boolean;
}

export const MemberView = (props: { data: MemberData, fref: firebase.database.Reference }) => {
  const makeHandler = (field: string) => (e: React.FormEvent<HTMLInputElement>) =>
    props.fref.child(field).set(e.currentTarget.value);

  // TODO: Make the yes-no displays tick/checkmarks
  // TODO: Make the Rank display a dropdown for the Rank Enum

  return (
    <div style={{ border: 'solid '}}>
      <h4>Name</h4>
      <input value={props.data.name} onChange={makeHandler('name')} />
      <h4>Present</h4>
      <p>{props.data.present ? 'Yes' : 'No'}</p>
      <h4>Rank</h4>
      <p>{props.data.rank}</p>
      <h4>Voting</h4>
      <p>{props.data.voting ? 'Yes' : 'No'}</p>
      <button onClick={() => props.fref.remove()}>
        Delete
      </button>
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
    return <MemberView data={this.state.member} fref={this.props.fref} />;
  }
}
