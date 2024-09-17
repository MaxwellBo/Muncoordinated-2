import type { Meta, StoryObj } from '@storybook/react';

import { CommitteeStatsTable } from './committee-stats';

const meta = {
  component: CommitteeStatsTable,
} satisfies Meta<typeof CommitteeStatsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {},
    verbose: true
  }
};