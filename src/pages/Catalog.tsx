import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, PackageSearch } from 'lucide-react';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { getProducts, deleteProduct, type ProductList, type ProductListItem } from '../services/products';
import { formatMoney, formatQty } from '../utils/format';
import { useAuth } from '../components/auth/AuthContext';

export default function Catalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(function () {
    let cancelled = false;
    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const products = await getProducts();
        if (!cancelled) {
          setProducts(products);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat produk.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProducts();
    return function cleanup() {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter((product) => 
      product.name.toLowerCase().includes(query) || 
      product.sku_number.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  function openDelete(product: ProductListItem) {
    setDeleteError(null);
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  function closeDelete() {
    setIsDeleteOpen(false);
    setDeletingProduct(null);
  };

  async function handleDelete() {
    if (!deletingProduct) return;
    const id = deletingProduct.id;
    setDeleteError(null);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      closeDelete();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Gagal menghapus produk.');
    }
  };

  const isAdmin = user.role === 'admin';
  const tableColSpan = isAdmin ? 6 : 5;

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Product List</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage inventory items, units, and pricing</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => navigate('/catalog/product/new')}
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 cursor-pointer"
          >
            <Plus size={18} />
            Create Product
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
           {/* Basic search dummy header */}
           <div className="relative flex-1 max-w-md">
             <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
             <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU or Name..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-colors" />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/80 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Produk</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-right">Stok</th>
                {isAdmin && <th className="px-6 py-4 font-semibold text-right">Harga Dasar</th>}
                {isAdmin && <th className="px-6 py-4 font-semibold text-right">Harga Jual</th>}
                {isAdmin && <th className="px-6 py-4 font-semibold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    {products.length === 0 ? 'No products found. Start by creating one.' : 'No products match your search.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={isAdmin ? () => navigate(`/catalog/product/${product.id}`) : undefined}
                    className={`
                      hover:bg-gray-50/50 dark:hover:bg-gray-700/40 transition-colors group
                      ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{product.name}</span>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">{product.sku_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                      {formatQty(product.quantity)} {product.unit}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-400 tracking-tight tabular-nums">
                        {formatMoney(product.base_price)}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-400 tracking-tight tabular-nums">
                        {formatMoney(product.price)}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDelete(product); }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDeleteOpen && deletingProduct && (
        <ConfirmDeleteModal
          title="Delete Product"
          itemName={deletingProduct.name}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}