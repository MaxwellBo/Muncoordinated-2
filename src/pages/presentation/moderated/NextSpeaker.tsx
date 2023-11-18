import React from "react";
import { CaucusData } from "../../../models/caucus";

export type NextSpeakerProps = Pick<CaucusData, "queue">["queue"];

export default function NextSpeaker(props: NextSpeakerProps) {
  if (!props || !Object.keys(props)) {
    return <p>The queue is empty or loading, show sth here.</p>;
  }

  return (
    <>
      {Object.entries(props)!.map(([country, data]) => (
        <div className="nextSpeakerStyle">
          <p>
            flag: {country}
            <br></br>
            {data.who}
            <br></br>
            {data.stance}
            <br></br>
            {data.duration}
          </p>
        </div>
      ))}
    </>
  );
}
