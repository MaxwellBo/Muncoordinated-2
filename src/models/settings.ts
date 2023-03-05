export interface SettingsData {
  moveQueueUp: boolean;
  timersInSeparateColumns: boolean;
  autoNextSpeaker: boolean;
  motionVotes?: boolean;
  MotionsArePublic?: boolean;
}

export const DEFAULT_SETTINGS: Required<SettingsData> = {
  moveQueueUp: false,
  timersInSeparateColumns: false,
  autoNextSpeaker: false,
  motionVotes: false,
  MotionsArePublic: false
};