import React from "react";
import { CaucusData, SpeakerEvent } from "../../../models/caucus";
import FlagFetch from "./FlagFetch";

export type CurrentSpeakerProps = Partial<
  Pick<CaucusData, "speaking">["speaking"]
>;

export default function CurrentSpeaker(props: CurrentSpeakerProps) {
  if (!props || Object.keys(props).length === 0) {
    return (
      <div className="noCurrentSpeaker">
        <header>No current speakers</header>
      </div>
    );
  }
  const { who, stance, duration } = props as SpeakerEvent;

  return (
    <div className="countryData">
      <div className="CountryFlag">{<FlagFetch name={who} />}</div>
      <div className="currentSpeakerName">
        <header>
          Speaking: {who} ({stance})
        </header>
      </div>
    </div>
  );
}
