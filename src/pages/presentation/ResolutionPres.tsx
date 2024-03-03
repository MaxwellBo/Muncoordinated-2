import { ResolutionData } from "../../models/resolution";
import React from "react";
import FlagFetch from "./moderated/FlagFetch";
import BackgroundAnimDark from "./BackgroundAnimDark";
import "./assets/resolutionPres.css";
export type resolutionprops = ResolutionData;

export default function ResolutionPres(props: resolutionprops) {
  // if (!props || !Object.keys(props).length) {
  //   return (
  //     <div className="noResolution">
  //       <header>No Resolution{props}</header>
  //     </div>
  //   );
  // }
  // const proposer = props.proposer ?? "";
  // const seconder = props.seconder ?? "";
  let headerStyle;
  switch (props.status) {
    case "Passed":
      headerStyle = { color: "#1fff53" };
      break;
    case "Failed":
      headerStyle = { color: "#ff261f" };
      break;
    case "Introduced":
      headerStyle = { color: "white" };
      break;
    default:
      headerStyle = { color: "white" };
  }
  return (
    <>
      <div className="proposeMaster">
        <div className="proposedtopic">
          <div className="topicStyle">
            <header style={headerStyle}>{props.name}</header>
          </div>
        </div>
        <div className="proposerClass">
          <FlagFetch name={props.proposer as string} />
          <header>{props.proposer}</header>
          <h2 className="identifier">proposer</h2>
        </div>
        <div className="seconderClass">
          <FlagFetch name={props.seconder as string} />
          <header>{props.seconder}</header>
          <h2 className="identifier">seconder</h2>
        </div>
      </div>
      <BackgroundAnimDark />
    </>
  );
}
