import type { Meta, StoryObj } from '@storybook/react';

import { TimeSetter } from './TimeSetter';

const meta = {
  component: TimeSetter,
} satisfies Meta<typeof TimeSetter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};