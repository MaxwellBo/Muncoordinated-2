import { it } from 'vitest';
import { createRoot } from 'react-dom/client';

it('renders without crashing', () => {
  const container = document.createElement('div');
  const root = createRoot(container!);
  root.unmount();
});
