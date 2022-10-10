export interface SettingsData {
  moveQueueUp: boolean;
  timersInSeparateColumns: boolean;
  autoNextSpeaker: boolean;
  motionVotes?: boolean;
  motionsArePublic?: boolean;
}

export const DEFAULT_SETTINGS: Required<SettingsData> = {
  moveQueueUp: false,
  timersInSeparateColumns: false,
  autoNextSpeaker: false,
  motionVotes: false,
  motionsArePublic: false
};