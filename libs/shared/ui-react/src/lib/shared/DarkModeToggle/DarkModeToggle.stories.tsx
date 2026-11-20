import type { Meta, StoryObj } from '@storybook/react';
import { MuiDarkModeToggle } from './DarkModeToggle';

const meta: Meta<typeof MuiDarkModeToggle> = {
  component: MuiDarkModeToggle,
  title: 'Components/DarkModeToggle',
};

export default meta;
type Story = StoryObj<typeof MuiDarkModeToggle>;

export const Default: Story = {
  args: {
    onThemeChange: (isDark: boolean) =>
      console.log('Nút đã bấm! Dark mode:', isDark),
  },
};
