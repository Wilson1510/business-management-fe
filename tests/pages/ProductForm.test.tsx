/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ProductForm from '../../src/pages/ProductForm';
import { getProduct, createProduct, updateProduct, type ProductDetail } from '../../src/services/products';
import { getCategories, type CategoryList } from '../../src/services/categories';
import { getUnits, type UnitList } from '../../src/services/units';

vi.mock('../../src/services/products', () => ({
  getProduct: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

vi.mock('../../src/services/categories', () => ({
  getCategories: vi.fn(),
}));

vi.mock('../../src/services/units', () => ({
  getUnits: vi.fn(),
}));

const MOCK_CATEGORIES = [
  { id: 1, name: 'Beverage', created_at: '', updated_at: '' },
  { id: 2, name: 'Snack', created_at: '', updated_at: '' },
];

const MOCK_UNITS = [
  { id: 1, name: 'Box', created_at: '', updated_at: '' },
  { id: 2, name: 'Pcs', created_at: '', updated_at: '' },
];

const MOCK_PRODUCT: ProductDetail = {
  id: 99,
  name: 'Sparkling Water',
  sku_number: 'SW-001',
  base_price: 1500,
  quantity: 50,
  category: { id: 1, name: 'Beverage' },
  units: [
    { id: 101, unit: { id: 2, name: 'Pcs' }, multiplier: 1, is_base_unit: true },
    { id: 102, unit: { id: 1, name: 'Box' }, multiplier: 24, is_base_unit: false },
  ],
  prices: [
    { id: 201, unit: { id: 1, name: 'Box' }, minimum_quantity: 1, price: 40000 },
  ],
  created_at: '',
  updated_at: '',
  created_by: 1,
  updated_by: 1,
};

function setupRouter(productId?: string) {
  const route = productId ? `/catalog/product/${productId}` : '/catalog/product/new';
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/catalog/product/new" element={<ProductForm />} />
        <Route path="/catalog/product/:id" element={<ProductForm />} />
        <Route path="/catalog" element={<div data-testid="catalog-page">Catalog Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProductForm Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial State & Loadings', () => {
    it('displays loading indicator initially', async () => {
      // Mock pending promise to keep loading state alive
      vi.mocked(getCategories).mockReturnValue(new Promise(() => {}));
      vi.mocked(getUnits).mockReturnValue(new Promise(() => {}));
      
      setupRouter();
      expect(screen.getByText('Loading form...')).toBeInTheDocument();
    });

    it('shows error if failing to load categories or units', async () => {
      vi.mocked(getCategories).mockRejectedValue(new Error('Failed fetching categories'));
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      
      setupRouter();
      await waitFor(() => {
        expect(screen.getByText('Failed fetching categories')).toBeInTheDocument();
      });
    });

    it('loads in Create Mode successfully', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      
      setupRouter();
      
      await waitFor(() => {
        expect(screen.getByText('Create Product')).toBeInTheDocument();
      });
      expect(screen.getByText('New Entry Setup')).toBeInTheDocument();
      
      // Select boxes should be populated
      const categorySelect = screen.getAllByRole('combobox')[0];
      expect(within(categorySelect).getByText('Beverage')).toBeInTheDocument();
      expect(within(categorySelect).getByText('Snack')).toBeInTheDocument();
    });

    it('loads in Edit Mode successfully and maps data correctly', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      vi.mocked(getProduct).mockResolvedValue(MOCK_PRODUCT);
      
      setupRouter('99');
      
      await waitFor(() => {
        expect(screen.getByText('Edit Product')).toBeInTheDocument();
      });
      // Sku number appears as caption
      expect(screen.getByText('SW-001')).toBeInTheDocument();
      
      // Fields are populated
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('Sparkling Water');
      expect(screen.getAllByRole('combobox')[0]).toHaveValue('1'); // Beverage ID

      // Unit conversions mapped
      const multiplierInputs = screen.getAllByRole('spinbutton');
      console.log(multiplierInputs)
      expect(multiplierInputs).toHaveLength(3);
      expect(multiplierInputs[0]).toHaveValue(1); // Base unit (Pcs)
      expect(multiplierInputs[1]).toHaveValue(24); // Alternate unit (Box)
      
      // Prices mapped
      // minimum_quantity comes as spinbutton as well but we can identify by inputs
      const priceInputs = screen.getAllByPlaceholderText('0.00');
      expect(priceInputs).toHaveLength(1);
      expect(priceInputs[0]).toHaveValue('40000');
    });
  });

  describe('Form Validation Constraints', () => {
    it('HTML5 prevents submission if name/category is empty', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      const user = userEvent.setup();
      
      setupRouter();
      await waitFor(() => expect(screen.getByText('Create Product')).toBeInTheDocument());

      const submitBtn = screen.getByRole('button', { name: /save product data/i });
      await user.click(submitBtn);

      const nameInput = screen.getAllByRole('textbox')[0];
      const categoryInput = screen.getAllByRole('combobox')[0];
      
      expect(nameInput).toBeInvalid();
      expect(categoryInput).toBeInvalid();
      expect(createProduct).not.toHaveBeenCalled();
    });

    it('JS validates that at least one unit is added', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      const user = userEvent.setup();
      
      setupRouter();
      await waitFor(() => expect(screen.getByText('Create Product')).toBeInTheDocument());

      // Fill in required name and category so HTML5 validation passes
      await user.type(screen.getAllByRole('textbox')[0], 'Test Prod');
      await user.selectOptions(screen.getAllByRole('combobox')[0], '2');

      // The unit list is empty by default
      expect(screen.getByText(/You must configure at least one unit/i)).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: /save product data/i });
      await user.click(submitBtn);

      // React JS validation triggers our fallback error box
      await waitFor(() => {
        expect(screen.getByText('At least one unit is required.')).toBeInTheDocument();
      });
      expect(createProduct).not.toHaveBeenCalled();
    });
  });

  describe('Dynamic Multi-row Inputs functionality', () => {
    it('Unit section: Adds unit, enforces base unit, prohibits base unit deletion', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      const user = userEvent.setup();
      
      setupRouter();
      await waitFor(() => expect(screen.getByText('Create Product')).toBeInTheDocument());

      const addUnitBtn = screen.getByRole('button', { name: /add unit/i });
      
      // 1. Add Base Unit
      await user.click(addUnitBtn);
      
      // Get all selects for unit dropping down (there are two sections, get the first one inside units)
      const selects = screen.getAllByRole('combobox');
      // The first select is category, second is the newly added Unit select
      await user.selectOptions(selects[1], '2'); // Select 'Pcs'
      
      // Verify multiplier input is 1 and readonly
      const multiplierInputs = screen.getAllByRole('spinbutton');
      expect(multiplierInputs[0]).toHaveValue(1);
      expect(multiplierInputs[0]).toHaveAttribute('readonly');

      // Verify NO trash icon exists for this row because it's base
      // Inside the unit mapping, row contains the select and spinbutton
      expect(screen.queryByRole('button', { name: /trash/i })).not.toBeInTheDocument(); // Can't find a pure trash text, but we search for buttons
      // There's no trash SVG button available in this block
      const deleteButtonsPass1 = screen.getAllByRole('button').filter(b => b.innerHTML.includes('lucide-trash'));
      expect(deleteButtonsPass1).toHaveLength(0);

      // 2. Add Alternate Unit
      await user.click(addUnitBtn);
      const updatedSelects = screen.getAllByRole('combobox');
      await user.selectOptions(updatedSelects[2], '1'); // Select 'Box'
      
      const updatedMultipliers = screen.getAllByRole('spinbutton');
      // Set Box multiplier to 12
      await user.clear(updatedMultipliers[1]);
      await user.type(updatedMultipliers[1], '12');
      expect(updatedMultipliers[1]).toHaveValue(12);
      expect(updatedMultipliers[1]).not.toHaveAttribute('readonly');

      // 3. Delete Alternate Unit Row
      const deleteButtonsPass2 = screen.getAllByRole('button').filter(b => b.innerHTML.includes('lucide-trash'));
      expect(deleteButtonsPass2).toHaveLength(1); // One trash icon exists now!
      
      await user.click(deleteButtonsPass2[0]);
      
      // Wait for removal, only 1 spinbutton (base unit) should remain
      expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
    });

    it('Pricing section: Adds pricing tier and handles fields correctly', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      const user = userEvent.setup();
      
      setupRouter();
      await waitFor(() => expect(screen.getByText('Create Product')).toBeInTheDocument());

      const addPriceBtn = screen.getByRole('button', { name: /add price tier/i });
      await user.click(addPriceBtn);

      const selects = screen.getAllByRole('combobox');
      // The select for pricing will be the 2nd combobox (if no units map exists yet), or let's find by generic lookup
      // Since units are 0 right now, selects[1] is the new price unit select!
      await user.selectOptions(selects[1], '1'); // Select 'Box'
      
      const priceMinQtyInput = screen.getAllByRole('spinbutton')[0];
      await user.clear(priceMinQtyInput);
      await user.type(priceMinQtyInput, '5');
      
      const priceValInput = screen.getByPlaceholderText('0.00');
      await user.clear(priceValInput);
      await user.type(priceValInput, '10000');

      expect(priceMinQtyInput).toHaveValue(5);
      expect(priceValInput).toHaveValue('10000');
      
      // Delete pricing row
      const trashBtns = screen.getAllByRole('button').filter(b => b.innerHTML.includes('lucide-trash'));
      await user.click(trashBtns[0]);
      
      expect(screen.queryByPlaceholderText('0.00')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission Success/Route Mapping', () => {
    it('successfully creates product and navigates away', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      vi.mocked(createProduct).mockResolvedValue({ id: 9 } as ProductDetail);
      const user = userEvent.setup();
      
      setupRouter();
      await waitFor(() => expect(screen.getByText('Create Product')).toBeInTheDocument());

      // Format Valid Payload
      await user.type(screen.getAllByRole('textbox')[0], 'New Thing');
      await user.selectOptions(screen.getAllByRole('combobox')[0], '1'); // Beverage
      
      // Add Base Unit Configuration
      await user.click(screen.getByRole('button', { name: /add unit/i }));
      await user.selectOptions(screen.getAllByRole('combobox')[1], '2'); // Pcs
      
      // Add Price Configuration
      await user.click(screen.getByRole('button', { name: /add price tier/i }));
      await user.selectOptions(screen.getAllByRole('combobox')[2], '2'); // Pcs
      const priceInput = screen.getByPlaceholderText('0.00');
      await user.clear(priceInput);
      await user.type(priceInput, '500');

      // Submit
      const submitBtn = screen.getByRole('button', { name: /save product data/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(createProduct).toHaveBeenCalledWith({
          name: 'New Thing',
          category_id: 1,
          units: [{ unit_id: 2, multiplier: 1, is_base_unit: true }],
          prices: [{ unit_id: 2, minimum_quantity: 1, price: 500 }]
        });
      });

      // Verify routing redirected to catalog
      expect(screen.getByTestId('catalog-page')).toBeInTheDocument();
    });

    it('successfully updates product on Edit Mode and navigates away', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      vi.mocked(getProduct).mockResolvedValue(MOCK_PRODUCT);
      vi.mocked(updateProduct).mockResolvedValue({} as ProductDetail);
      
      const user = userEvent.setup();
      setupRouter('99');
      
      await waitFor(() => expect(screen.getByText('Edit Product')).toBeInTheDocument());

      // Update name
      const nameInput = screen.getAllByRole('textbox')[0];
      await user.clear(nameInput);
      await user.type(nameInput, 'Sparkling Water 2.0');

      // Submit
      const submitBtn = screen.getByRole('button', { name: /save product data/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(updateProduct).toHaveBeenCalledWith(99, expect.objectContaining({
          name: 'Sparkling Water 2.0',
          category_id: 1,
          units: expect.any(Array),
          prices: expect.any(Array)
        }));
      });

      expect(screen.getByTestId('catalog-page')).toBeInTheDocument();
    });
    
    it('shows error banner on failing to submit API', async () => {
      vi.mocked(getCategories).mockResolvedValue(MOCK_CATEGORIES as CategoryList);
      vi.mocked(getUnits).mockResolvedValue(MOCK_UNITS as UnitList);
      vi.mocked(createProduct).mockRejectedValue(new Error('Internal Server Boom'));
      const user = userEvent.setup();
      
      setupRouter();
      await waitFor(() => expect(screen.getByText('Create Product')).toBeInTheDocument());

      // Minimum details
      await user.type(screen.getAllByRole('textbox')[0], 'Bugged Box');
      await user.selectOptions(screen.getAllByRole('combobox')[0], '1'); 
      await user.click(screen.getByRole('button', { name: /add unit/i }));
      await user.selectOptions(screen.getAllByRole('combobox')[1], '1'); 

      const submitBtn = screen.getByRole('button', { name: /save product data/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Internal Server Boom')).toBeInTheDocument();
      });
      // Remains on the form page
      expect(screen.queryByTestId('catalog-page')).not.toBeInTheDocument();
    });
  });
});
