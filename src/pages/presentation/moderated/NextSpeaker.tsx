import React from "react";
import { CaucusData } from "../../../models/caucus";
import FlagFetch from "./FlagFetch";
import { secondsToHumanReadableFormat } from "../../../utils";
import "../assets/nextspeaker.css";

export type NextSpeakerProps = Pick<CaucusData, "queue">["queue"];

export default function NextSpeaker(props: NextSpeakerProps) {
  if (!props || !Object.keys(props)) {
    return <p>The queue is empty or loading, show sth here.</p>;
  }
  // function countEntries() {
  //   return Object.keys(props).length;
  //  }
  // let numentry = countEntries(props);
  let maxEntry = 2;
  return (
    <>
      {Object.entries(props)!
        .slice(0, maxEntry)
        .map(([country, data], index) => (
          <div className="nextSpeakerStyle">
            <div className="nextSpeakerFlag">
              {<FlagFetch name={data.who} />}
            </div>
            <div className="nextSpeakerName">
              <header>{secondsToHumanReadableFormat(data.duration)}</header>
            </div>
          </div>
        ))}
    </>
  );
}
