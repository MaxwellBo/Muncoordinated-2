import { CommitteeID } from "./pages/Committee";
import { CaucusID } from "./pages/Caucus";
import { ResolutionID } from "./pages/Resolution";
import { StrawpollID } from "./pages/Strawpoll";

export interface URLParameters {
  committeeID: CommitteeID;
  caucusID: CaucusID;
  resolutionID: ResolutionID;
  strawpollID: StrawpollID;
  tab: 'feed' | 'text' | 'amendments' | 'voting'
}