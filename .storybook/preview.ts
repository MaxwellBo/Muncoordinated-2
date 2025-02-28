import type { Preview } from "@storybook/react";
import '../src/index.css'
import 'semantic-ui-css/semantic.min.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
