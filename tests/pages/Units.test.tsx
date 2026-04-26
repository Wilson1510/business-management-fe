/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import Units from '../../src/pages/Units';
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  type UnitList,
  type UnitDetail,
} from '../../src/services/units';

vi.mock('../../src/services/units', () => ({
  getUnits: vi.fn(),
  createUnit: vi.fn(),
  updateUnit: vi.fn(),
  deleteUnit: vi.fn(),
}));

const MOCK_UNITS = [
  {
    id: 1,
    name: 'Pcs',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
  {
    id: 2,
    name: 'Box',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
];

function setupRouter() {
  return render(
    <MemoryRouter initialEntries={['/units']}>
      <Routes>
        <Route path="/units" element={<Units />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Units Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial State & Data Fetching', () => {
    it('displays loading state initially', async () => {
      vi.mocked(getUnits).mockReturnValue(new Promise(() => {}));
      setupRouter();
      
      expect(screen.getByText('Loading units...')).toBeInTheDocument();
    });

    it('displays error message if fetching fails', async () => {
      vi.mocked(getUnits).mockRejectedValue(new Error('Failed to load units error'));
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Failed to load units error')).toBeInTheDocument();
      });
      expect(screen.queryByText('Loading units...')).not.toBeInTheDocument();
    });

    it('displays empty state message when no data', async () => {
      vi.mocked(getUnits).mockResolvedValue([]);
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('No units found.')).toBeInTheDocument();
      });
    });

    it('displays populated units and action buttons', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      setupRouter();

      await waitFor(() => {
        expect(screen.getByText('Pcs')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Box')).toBeInTheDocument();

      // Check actions: Add Unit button on top
      expect(screen.getByRole('button', { name: /add unit/i })).toBeInTheDocument();
      
      // Each row should have edit and delete buttons
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1]; // Index 0 is table header
      
      const buttonsInFirstRow = within(firstRow).getAllByRole('button');
      expect(buttonsInFirstRow).toHaveLength(2); // Pencil and Trash icons
    });
  });

  describe('Add Unit Flow', () => {
    it('validates empty form and HTML required input', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /add unit/i });
      await user.click(addBtn);

      // Verify modal is opened
      expect(screen.getByText('New Unit')).toBeInTheDocument();

      const input = screen.getByLabelText('Unit Name');
      expect(input).toBeRequired();

      // Click save with empty input
      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);
      
      // Because required validation blocks submit in real browsers AND JSDOM + userEvent,
      // our React onSubmit handler won't even fire. Thus 'createUnit' is not called.
      expect(input).toBeInvalid();
      
      expect(createUnit).not.toHaveBeenCalled();
    });

    it('prevents input of whitespace only', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /add unit/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Unit Name');
      await user.type(input, '   ');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(createUnit).not.toHaveBeenCalled();
    });

    it('successfully adds a new unit', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(createUnit).mockResolvedValue(
        { id: 3, name: 'Kg', created_at: '', updated_at: '' } as unknown as UnitDetail
      );
      
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /add unit/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Unit Name');
      await user.type(input, 'Kg');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createUnit).toHaveBeenCalledWith({ name: 'Kg' });
      });

      // Modal should be closed and list updated
      expect(screen.queryByText('New Unit')).not.toBeInTheDocument();
      expect(screen.getByText('Kg')).toBeInTheDocument();
    });

    it('shows API error inside modal when adding fails', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(createUnit).mockRejectedValue(new Error('Name must be unique'));
      
      const user = userEvent.setup();
      setupRouter();

      const addBtn = await screen.findByRole('button', { name: /add unit/i });
      await user.click(addBtn);

      const input = screen.getByLabelText('Unit Name');
      await user.type(input, 'Duplicate Name');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Name must be unique')).toBeInTheDocument();
      });

      // Modal remains open
      expect(screen.getByText('New Unit')).toBeInTheDocument();
    });
  });

  describe('Edit Unit Flow', () => {
    it('opens modal with pre-filled value, updates correctly, and cancels edits', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(updateUnit).mockResolvedValue(
        { id: 1, name: 'Pieces', created_at: '', updated_at: '' } as unknown as UnitDetail
      );
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Pcs');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1]; 
      
      // Pencil button is the first button inside the row
      const editBtn = within(firstRow).getAllByRole('button')[0];
      await user.click(editBtn);

      // Verify Modal configuration
      expect(screen.getByText('Edit Unit')).toBeInTheDocument();
      const input = screen.getByLabelText('Unit Name');
      expect(input).toHaveValue('Pcs');

      // Test Cancel function
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);
      expect(screen.queryByText('Edit Unit')).not.toBeInTheDocument();
      
      // Re-open and process to save
      await user.click(editBtn);
      const inputAgain = screen.getByLabelText('Unit Name');
      await user.clear(inputAgain);
      await user.type(inputAgain, 'Pieces');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(updateUnit).toHaveBeenCalledWith(1, { name: 'Pieces' });
      });

      expect(screen.queryByText('Edit Unit')).not.toBeInTheDocument();
      expect(screen.getByText('Pieces')).toBeInTheDocument();
      expect(screen.queryByText('Pcs')).not.toBeInTheDocument();
    });
  });

  describe('Delete Unit Flow', () => {
    it('opens delete confirmation and cancels', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Pcs');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1]; 
      
      // Trash button is the second button inside the row
      const deleteBtn = within(firstRow).getAllByRole('button')[1];
      await user.click(deleteBtn);

      expect(screen.getByText('Delete Unit')).toBeInTheDocument();
      // Test dynamic deletion prompt text
      expect(screen.getByText(/"Pcs"/)).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      expect(screen.queryByText('Delete Unit')).not.toBeInTheDocument();
      expect(deleteUnit).not.toHaveBeenCalled();
    });

    it('successfully deletes a unit', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(deleteUnit).mockResolvedValue(undefined);
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Pcs');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1]; 
      
      const deleteBtn = within(firstRow).getAllByRole('button')[1];
      await user.click(deleteBtn);

      const confirmDeleteBtn = screen.getByRole('button', { name: /delete item/i });
      await user.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(deleteUnit).toHaveBeenCalledWith(1);
      });

      expect(screen.queryByText('Delete Unit')).not.toBeInTheDocument();
      expect(screen.queryByText('Pcs')).not.toBeInTheDocument();
      expect(screen.getByText('Box')).toBeInTheDocument();
    });

    it('handles deletion error (e.g., 409 Unit in use)', async () => {
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as unknown as UnitList);
      vi.mocked(deleteUnit).mockRejectedValue(new Error('Unit ini masih digunakan oleh sales order atau purchase order'));
      const user = userEvent.setup();
      setupRouter();

      await screen.findByText('Pcs');
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1]; 
      
      const deleteBtn = within(firstRow).getAllByRole('button')[1];
      await user.click(deleteBtn);

      const confirmDeleteBtn = screen.getByRole('button', { name: /delete item/i });
      await user.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(screen.getByText('Unit ini masih digunakan oleh sales order atau purchase order')).toBeInTheDocument();
      });

      // Modal should remain open
      expect(screen.getByText('Delete Unit')).toBeInTheDocument();
    });
  });
});
