import * as React from 'react';
import { Divider, Header, Input, List, Segment } from 'semantic-ui-react';
import {CommitteeID} from "../models/committee";
import {StrawpollID} from "../models/strawpoll";

function CopyableText(props: {
  value: string
}) {
  const [message, setMessage] = React.useState<string>('Sao chép');

  const copy = () => {
    // We have to try-catch because this API might not be available
    try {
      navigator.clipboard.writeText(props.value)
        .then(() => {
          setMessage('Thành công!')
          setTimeout(() => setMessage('Sao chép'), 1000)
        })
        .catch(() => {
          setMessage('Vui lòng sao chép thủ công')
        })
    } catch (e) {
      setMessage('Vui lòng sao chép thủ công')
    }
  }

  return (
      <Input fluid
        value={props.value}
        action={{
          labelPosition: 'right',
          icon: 'copy outline',
          content: message,
          onClick: copy
        }}
      />
  );
}

export function CommitteeShareHint(props: {
  committeeID: CommitteeID;
}) {
  const hostname = window.location.hostname;
  const { committeeID } = props;
  const url = `${hostname}/committees/${committeeID}`;

  return (
    <Segment>
      <Header size='medium'>Link chia sẻ hội đồng</Header>
      <CopyableText value={url}/>

      <Divider hidden />

      Với link này, các đại biểu của bạn sẽ có thể:

      <VerboseShareCapabilities />
      
    </Segment>
  );
}

export function ShareCapabilities() {
  return (
      <List bulleted>
        <List.Item>Tải lên file</List.Item>
        <List.Item>Tự thêm bản thân vào danh sách phát biểu</List.Item>
        <List.Item>Thêm và thay đổi các đề xuất chỉnh sửa dự thảo nghị quyết</List.Item>
        <List.Item>Đề xuất kiến nghị</List.Item>
        <List.Item>Biểu quyết kiến nghị</List.Item>
      </List>
  )
}

export function VerboseShareCapabilities() {
  return (
      <List bulleted>
        <List.Item>Tải lên file</List.Item>
        <List.Item>Tự thêm bản thân vào danh sách phát biểu</List.Item>
        <List.Item>Thêm và thay đổi các đề xuất chỉnh sửa dự thảo nghị quyết</List.Item>
        <List.Item>Đề xuất kiến nghị</List.Item>
        <List.Item>Biểu quyết kiến nghị</List.Item>
      </List>
  )
}

export function StrawpollShareHint(props: {
  committeeID: CommitteeID;
  strawpollID: StrawpollID;
}) {
  const hostname = window.location.hostname;
  const { committeeID, strawpollID } = props;
  const url = `${hostname}/committees/${committeeID}/strawpolls/${strawpollID}`;
  return (
    <Segment>
      <Header size='small'>Here's the shareable link to your strawpoll</Header>
      <CopyableText value={url} />
    </Segment>
  );
}

export function MotionsShareHint(props: {
  canVote: boolean,
  canPropose: boolean,
  committeeID: CommitteeID;
}) {
  const hostname = window.location.hostname;
  const { committeeID, canVote, canPropose } = props;
  const url = `${hostname}/committees/${committeeID}/motions`;

  let action: string

  if (canVote && canPropose) {
    action = 'vote on and propose motions'
  } else if (canVote) {
    action = 'vote on motions'
  } else if (canPropose) {
    action = 'propose motions'
  } else {
    action = 'vote on and propose motions'
  }

  return (
    <Segment>
      <Header size='small'>Here's the shareable link to {action}</Header>
      <CopyableText value={url}/>
    </Segment>
  );
}
