import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { getDocs } from 'firebase/firestore';

// Mock the specific module and function
jest.mock('firebase/firestore');

// Mock window.scrollTo for JSDOM
global.scrollTo = jest.fn();

describe('App', () => {
  beforeEach(() => {
    // Clear mock history before each test
    getDocs.mockClear();
  });

  test('renders app header after data loads successfully', async () => {
    // Setup mock for a successful data fetch
    getDocs.mockResolvedValue({ docs: [] });

    render(<App />);

    // Check for the header text. On this branch, it's "Padel Mas Camarena"
    const headerElement = await screen.findByText(/Padel Mas Camarena/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders error message when data fetching fails', async () => {
    // Setup mock for a failed data fetch
    getDocs.mockRejectedValue(new Error('Failed to fetch'));

    render(<App />);

    // Check for the error message displayed to the user
    const errorElement = await screen.findByText(/No se pudieron cargar los datos. Inténtalo de nuevo./i);
    expect(errorElement).toBeInTheDocument();
  });
});
