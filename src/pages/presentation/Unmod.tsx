import React from "react";
import { TimerData } from "../../models/time";
import { secondsToHumanReadableFormat } from "../../utils";
import BackgroundAnim from "./BackgroundAnim";
import "./assets/unmod.css";
export type UnmodProps = TimerData;

export default function Unmod(props: UnmodProps) {
  return (
    <>
      <BackgroundAnim />
      <div className="redundantpos">
        <h3 className="muntitle">Unmoderated Caucus</h3>
        <div className="muntimediv">
          <h2 className="muntime">
            {secondsToHumanReadableFormat(props.remaining)}
          </h2>
        </div>
      </div>
    </>
  );
}
