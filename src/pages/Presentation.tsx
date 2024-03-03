import React from "react";
import NewWindow from "react-new-window";
import { PresentationData } from "../models/presentation-data";
import Idle from "./presentation/Idle";
import Unmod from "./presentation/Unmod";
import { TimerData } from "../models/time";
import Moderated from "./presentation/Moderated";
import { CaucusData } from "../models/caucus";
import _ from "lodash";
import ResolutionPres from "./presentation/ResolutionPres";
import { ResolutionData } from "../models/resolution";

export interface PresentationProps {
  onCloseCallback?: () => any;
}
export type PresentationState = {
  type: PresentationData["type"];
  data: {
    mod?: CaucusData;
    unmod?: TimerData;
    res?: ResolutionData;
  };
  window?: Window | null;
};

export class Presentation extends React.Component<
  PresentationProps,
  PresentationState
> {
  constructor(props: PresentationProps) {
    super(props);

    this.state = {
      type: "idle",
      data: {},
    };
  }

  handlePresentation(e: CustomEvent<PresentationData>) {
    const data = e.detail;

    if (!data) return;

    this.setState({
      type: e.detail.type,
    });

    switch (e.detail.type) {
      case "mod":
        if (e.detail.data) {
          this.setState({
            data: {
              mod: _.cloneDeep(e.detail.data),
              unmod: { ...this.state.data.unmod! },
            },
          });
        }
        break;

      case "unmod":
        this.setState({
          data: {
            mod: { ...this.state.data.mod! },
            unmod: _.cloneDeep(e.detail.data),
          },
        });
        break;
      case "res":
        if (e.detail.data) {
          this.setState({
            data: {
              ...this.state.data,
              res: _.cloneDeep(e.detail.data),
            },
          });
        }
        break;
      case "idle":
      default:
        break;
    }
  }

  _onOpenEventHandler = ((e: CustomEvent) =>
    this.handlePresentation(e)) as EventListener;

  onOpen(window: Window) {
    const parentWindow = window.opener as Window | undefined | null;

    this.setState({
      window: parentWindow,
    });

    window.opener.addEventListener("presentation", this._onOpenEventHandler);
  }

  onUnload() {
    console.log("Unloading presentation view");

    this.state.window?.removeEventListener(
      "presentation",
      this._onOpenEventHandler
    );

    if (this.props.onCloseCallback) {
      this.props.onCloseCallback!();
    }
  }

  render() {
    console.log("render()");

    return (
      <NewWindow
        onUnload={() => this.onUnload()}
        onOpen={(window) => this.onOpen(window)}
      >
        {this.renderView()}
      </NewWindow>
    );
  }

  renderView() {
    console.log("renderView()");

    switch (this.state.type) {
      case "unmod":
        return <Unmod {...this.state.data.unmod!}></Unmod>;
      case "mod":
        return <Moderated {...this.state.data.mod!}></Moderated>;
      case "res":
        return <ResolutionPres {...this.state.data.res!}></ResolutionPres>;
      default:
        return <Idle />;
    }
  }
}
// export default function P() {

// }
