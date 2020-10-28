import { useLocalStorage, uuidv4 } from "./utils";

export type VoterID = string;

export function useVoterID(): [string] {
  let [voterID, setVoterID] = useLocalStorage('voterID', undefined);

  if (!voterID) {
    voterID = uuidv4();
    setVoterID(voterID);
  }
  
  return [voterID];
}