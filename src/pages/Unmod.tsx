import React from "react";
import * as firebase from "firebase/app";
import { Container } from "semantic-ui-react";
import { Helmet } from "react-helmet";
import { RouteComponentProps } from "react-router";
import Timer from "../components/Timer";
import { URLParameters } from "../types";
import { TimerData, Unit } from "../models/time";
import { UnmodPresentationData } from "../models/presentation-data";

interface Props extends RouteComponentProps<URLParameters> {}

interface State {
  timer?: TimerData;
  committeeFref: firebase.database.Reference;
}

export default class Unmod extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase
        .database()
        .ref("committees")
        .child(match.params.committeeID)
        .child("timer"),
    };
  }

  onTimerChange = (data: TimerData) => {
    if (!window) return;

    const detail: UnmodPresentationData = {
      type: "unmod",
      data,
    };

    window.dispatchEvent(
      new CustomEvent("presentation", {
        detail,
      })
    );
  };

  render() {
    const { committeeFref } = this.state;

    return (
      <Container text style={{ padding: "1em 0em" }}>
        <Helmet>
          <title>{`Unmoderated Caucus - Muncoordinated`}</title>
        </Helmet>
        <Timer
          name="Unmoderated caucus"
          timerFref={committeeFref}
          onChange={this.onTimerChange}
          defaultDuration={10}
          defaultUnit={Unit.Minutes}
        />
      </Container>
    );
  }
}
