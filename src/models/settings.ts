export interface SettingsData {
  motionVotes?: boolean; // TODO: Migrate
  motionsArePublic?: boolean; // TODO: Migrate
}

export const DEFAULT_SETTINGS: Required<SettingsData> = {
  motionVotes: false,
  motionsArePublic: false
};