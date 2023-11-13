import React from "react";
import NewWindow from "react-new-window";
import { PresentationData } from "../models/presentation-data";
import Idle from "./presentation/Idle";
import Timer from "./presentation/Timer";
import { TimerData } from "../models/time";

export interface PresentationProps {
  onCloseCallback?: () => any;
}
export type PresentationState = PresentationData;

export class Presentation extends React.Component<PresentationProps, PresentationState> {
  constructor(props: PresentationProps) {
    super(props);

    this.state = {
      type: "idle",
    };
  }

  handlePresentation(e: CustomEvent<PresentationData>) {
    const data = e.detail;

    if (!data) return;

    this.setState({ ...data });
  }

  onOpen(window: Window) {
    window.opener.addEventListener("presentation", ((e: CustomEvent) => this.handlePresentation(e)) as EventListener);
  }

  onUnload() {
    if (this.props.onCloseCallback) {
      this.props.onCloseCallback!();
    }
  }

  render() {
    return (
      <NewWindow onUnload={() => this.onUnload()} onOpen={(window) => this.onOpen(window)}>
        {this.renderView()}
      </NewWindow>
    );
  }

  renderView() {
    switch (this.state.type) {
      case "unmod":
        return <Timer {...this.state.data}></Timer>;
      case "idle":
      default:
        return <Idle>Kidaraseyo</Idle>;
    }
  }
}

// export default function P() {

// }
