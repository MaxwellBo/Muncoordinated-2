import {CommitteeData} from "../models/committee";
import {makeCommitteeStats} from "../modules/committee-stats";
import {Majority} from "../models/resolution";

export function getThreshold(requiredMajority: Majority, committee: CommitteeData | undefined, fors: number, againsts: number): number {
  const stats = makeCommitteeStats(committee)
  switch (requiredMajority) {
    case Majority.TwoThirds:
      return stats.twoThirdsMajority;
    case Majority.TwoThirdsNoAbstentions:
      return Math.ceil((2 / 3) * (fors + againsts));
    case Majority.Simple:
    default:
      return stats.simpleMajority;
  }
}

export function getThresholdName(majority: Majority): string {
  switch (majority) {
    case Majority.TwoThirds:
      return "two-thirds majority"
    case Majority.TwoThirdsNoAbstentions:
      return "two-thirds majority"
    case Majority.Simple:
    default:
      return "simple majority";
  }
}