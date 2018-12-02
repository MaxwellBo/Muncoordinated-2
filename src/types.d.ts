import { CommitteeID } from "./components/Committee";
import { CaucusID } from "./components/Caucus";
import { ResolutionID } from "./components/Resolution";

export interface URLParameters {
  committeeID: CommitteeID;
  caucusID: CaucusID;
  resolutionID: ResolutionID;
}

export interface Dictionary<K, V> {
  [key: string]: V;
}