import { CommitteeID } from "./components/Committee";
import { CaucusID } from "./components/Caucus";
import { ResolutionID } from "./components/Resolution";
import { StrawpollID } from "./components/Strawpoll";

export interface URLParameters {
  committeeID: CommitteeID;
  caucusID: CaucusID;
  resolutionID: ResolutionID;
  strawpollID: StrawpollID;
  tab: 'feed' | 'text' | 'amendments' | 'voting'
}