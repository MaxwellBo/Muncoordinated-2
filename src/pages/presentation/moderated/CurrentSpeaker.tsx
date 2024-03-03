import React from "react";
import { CaucusData, SpeakerEvent } from "../../../models/caucus";
import FlagFetch from "./FlagFetch";
import "../assets/currentspeaker.css";

export type CurrentSpeakerProps = Partial<
  Pick<CaucusData, "speaking">["speaking"]
>;

export default function CurrentSpeaker(props: CurrentSpeakerProps) {
  if (!props || !Object.keys(props).length) {
    return (
      <div className="noCurrentSpeaker">
        <header>No current speakers</header>
      </div>
    );
  }

  const { who } = props as SpeakerEvent;

  return (
    <div className="countryData">
      <div className="countryFlagDiv">{<FlagFetch name={who} />}</div>
      <div className="currentSpeakerName">
        <header>{who}</header>
      </div>
    </div>
  );
}
