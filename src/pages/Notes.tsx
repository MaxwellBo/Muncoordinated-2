import * as React from 'react';
import firebase from 'firebase/compat/app';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { TextArea, Form, Container } from 'semantic-ui-react';
import { textAreaHandler } from '../modules/handlers';
import Loading from '../components/Loading';
import {CommitteeData} from "../models/committee";
import { Helmet } from 'react-helmet';

interface Props extends RouteComponentProps<URLParameters> {}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

export default class Notes extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase
        .database()
        .ref("committees")
        .child(match.params.committeeID),
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val() });
    }
  };

  componentDidMount() {
    this.state.committeeFref.on("value", this.firebaseCallback);
    window.dispatchEvent(
      new CustomEvent("presentation", {
        detail: {
          type: "idle",
        },
      })
    );
  }

  componentWillUnmount() {
    this.state.committeeFref.off("value", this.firebaseCallback);
  }

  render() {
    const { committee, committeeFref } = this.state;

    // const trigger = <Button icon="question" size="mini" basic floated="right" />;

    return committee ? (
      <Container text style={{ padding: "1em 0em" }}>
        <Helmet>
          <title>{`Notes - Muncoordinated`}</title>
        </Helmet>
        <Form>
          <TextArea
            value={committee ? committee.notes : ""}
            onChange={textAreaHandler<CommitteeData>(committeeFref, "notes")}
            autoHeight
            placeholder="Notes"
          />
          {/* <Popup
            trigger={trigger}
            content="Shift + Enter to add a new line"
            basic
          /> */}
        </Form>
      </Container>
    ) : (
      <Loading />
    );
  }
}
