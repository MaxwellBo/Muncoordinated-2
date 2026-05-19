import * as React from 'react';
import { Button, Segment, Header, List, Container } from 'semantic-ui-react';
import { CLIENT_VERSION, VersionLink } from '../components/Footer';
import { Helmet } from 'react-helmet';

export const KEYBOARD_SHORTCUT_LIST = (
  <List>
    <List.Item>
      <Button size="mini">
        Alt
      </Button>
      <Button size="mini">
        N
      </Button>
      Người nói tiếp theo
    </List.Item>
    <List.Item>
      <Button size="mini">
        Alt
      </Button>
      <Button size="mini">
        S
      </Button>
      Chạy/Dừng đồng hồ thời gian nói
    </List.Item>
    <List.Item>
      <Button size="mini">
        Alt
      </Button>
      <Button size="mini">
        C
      </Button>
      Chạy/Dừng đồng hồ thời gian phiên họp
    </List.Item>
  </List>
);

export default class Help extends React.PureComponent<{}, {}> {
  gpl = ( 
    <a href="https://github.com/MaxwellBo/Muncoordinated-2/blob/master/LICENSE">
      GNU GPLv3
    </a>
  );

  render() {
    const { gpl } = this;

    return (
      <Container text style={{ padding: '1em 0em' }}>
        <Helmet>
          <title>{`Trợ giúp - vi-Muncoordinated`}</title>
        </Helmet>
        <Header as="h3" attached="top">Phím tắt</Header>
        <Segment attached="bottom">
        {KEYBOARD_SHORTCUT_LIST}
        </Segment>
        <Header as="h3" attached="top">Báo lỗi &amp; yêu cầu hỗ trợ</Header>
        <Segment attached="bottom">
          Trong trường hợp có lỗi xảy ra, hãy thực hiện những bước sau:
          <br />
          <List ordered>
            <List.Item>
              Tạo một lỗi tại <a href="https://github.com/MaxwellBo/Muncoordinated-2/issues">
                trang theo dõi lỗi của vi-Muncoordinated
              </a>. Trang này cũng có thể được sử dụng để đưa ra yêu cầu hỗ trợ sử dụng phần mềm.
            </List.Item>
            <List.Item>
              Miêu tả bạn muốn làm gì
            </List.Item>
            <List.Item>
              Miêu tả điều gì đã xảy ra
            </List.Item>
            <List.Item>
              Thêm phiên bản ứng dụng bạn đang dùng (<VersionLink version={CLIENT_VERSION} />)
            </List.Item>
            <List.Item>
              Bổ sung thời gian và trình duyệt bạn đang sử dụng khi gặp lỗi
            </List.Item>
          </List>
        </Segment>
        <Header as="h3" attached="top">Giấy phép</Header>
        <Segment attached="bottom">
          vi-Muncoordinated và Muncoordinated (phần mềm gốc) đều sử dụng giấy phép bản quyền {gpl}
        </Segment>
        {/*<Header as="h3" attached="top">Social media</Header>
        <Segment attached="bottom">
          Want to meet likeminded Muncoordinators? Come check out our 
          forum <a href="https://github.com/MaxwellBo/Muncoordinated-2/discussions">The Muncoordinator's Discussion Space</a>.
        </Segment>*/} 
      </Container>
    );
  }
}
