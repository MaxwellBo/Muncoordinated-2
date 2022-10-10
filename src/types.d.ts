import {CaucusID} from "./models/caucus";
import {CommitteeID} from "./models/committee";
import {ResolutionID} from "./models/resolution";
import {StrawpollID} from "./models/strawpoll";

export interface URLParameters {
  committeeID: CommitteeID;
  caucusID: CaucusID;
  resolutionID: ResolutionID;
  strawpollID: StrawpollID;
  tab: 'feed' | 'text' | 'amendments' | 'voting'
}