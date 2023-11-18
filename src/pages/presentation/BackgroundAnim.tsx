import React from "react";
import "./assets/bganim.css";

import backgroundPattern from "./assets/mmun2023.png";

export default function BackgroundAnim() {
  return (
    <>
      <div className="bg">
        <div className="bgimages">
          <img className="first" src={backgroundPattern} alt="mmun20231" />
          <img className="second" src={backgroundPattern} alt="mmun20232" />
        </div>
        <div className="bggradient" />
      </div>
    </>
  );
}
