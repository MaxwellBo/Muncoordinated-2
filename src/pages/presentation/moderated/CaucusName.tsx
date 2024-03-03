import React from "react";
export type CaucusNameProps = { name: string };

export default function CaucusName(props: CaucusNameProps) {
  return (
    <>
      <h2 className="Topictext">Topic</h2>
      <div className="Topicstyle">
        <h3>{props.name}</h3>
      </div>
    </>
  );
}
