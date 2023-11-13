import React from "react";
import { TimerData } from "../../models/time";

export type TimerProps = TimerData;

export default function Timer(props: TimerProps) {
  return <h1>{props.remaining}</h1>;
}
