import React from "react";
import BackgroundAnim from "./BackgroundAnim";
import munlogo from "./assets/logo.svg";
//export default function Idle({ children }: { children: ReactNode }) {
//  return <h2>{children}</h2>;
//}
export default function Idle() {
  return (
    <>
      <BackgroundAnim />
      <img
        id="munlogo"
        src={munlogo}
        alt="Logo for Model United Nations Mongolia 2023"
      />
    </>
  );
}
