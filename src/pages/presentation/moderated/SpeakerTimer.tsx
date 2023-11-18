import React from "react";
import { TimerData } from "../../../models/time";
import { secondsToHumanReadableFormat } from "../../../utils";

export type SpeakerTimerProps = TimerData;

export default function SpeakerTimer(props: SpeakerTimerProps) {
  return (
    <>
      <h2 className="Speakertext">Speaker time</h2>
      <div className="muntimediv timerstyle Caucusdata">
        <h3>{secondsToHumanReadableFormat(props.remaining)}</h3>
      </div>
    </>
  );
}
