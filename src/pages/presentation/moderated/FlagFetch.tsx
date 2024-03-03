import React from "react";
import { lookupFlagCodeByName } from "../../../utils";

interface FlagFetchProps {
  name: string; // Assuming the name is a string
}

const FlagFetch: React.FC<FlagFetchProps> = ({ name }) => {
  const code = lookupFlagCodeByName(name); // Getting the code first

  const formattedName = code?.toLowerCase(); // Converting the code to lowercase

  const src = "/flags/" + formattedName + ".svg";

  return <img src={src} className="countryFlag" alt={code} />;
};
export default FlagFetch;
