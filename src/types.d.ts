import { CommitteeID } from "./components/Committee";
import { CaucusID } from "./components/Caucus";

export interface URLParameters {
  committeeID: CommitteeID;
  caucusID: CaucusID;
}