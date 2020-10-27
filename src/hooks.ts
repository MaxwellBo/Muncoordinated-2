import { useLocalStorage, uuidv4 } from "./utils";

export type VoterID = string;

export function useVoterID(): [string] {
  let [voterID, setVoterID] = useLocalStorage('voterID', undefined);

  if (!voterID) {
    const voterID = uuidv4();
    setVoterID(voterID);
  }
  
  return [voterID];
}