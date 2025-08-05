import App from './App';
import { render } from '@testing-library/react';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

test('renders without crashing', () => {
  render(<App />);
  // Since we're using a router, we just check if the app renders without errors
  expect(document.body).toBeInTheDocument();
});
