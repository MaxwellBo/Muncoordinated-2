import * as React from 'react';
import { Segment, Button, Divider, Form, Grid, Header } from 'semantic-ui-react';

export default class Homepage extends React.PureComponent<{}, {}> {
  render() {

    return (
      <Grid
        style={{ height: '100%' }}
      >
        <Grid.Column>
          <Header as="h1" dividing>
            Muncoordinated
          </Header>
          <Segment>
            If you want a committee, contact me at "max (at) maxbo.me", titled "[URGENT] I WANT A COMMITTEE".
          </Segment>
        </Grid.Column>
      </Grid>
    );
  }
}