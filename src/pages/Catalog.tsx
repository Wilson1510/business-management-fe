import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, AlertCircle, PackageSearch } from 'lucide-react';
import { getProducts, deleteProduct, type ProductList, type ProductListItem } from '../services/products';
import { formatMoney, formatQty } from '../utils/format';
import { useAuth } from '../components/auth/AuthContext';

export default function Catalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
           {/* Basic search dummy header */}
           <div className="relative flex-1 max-w-md">
             <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input type="text" placeholder="Search by SKU or Name..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-colors" />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Produk</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-right">Stok</th>
                <th className="px-6 py-4 font-semibold text-right">Harga Dasar</th>
                <th className="px-6 py-4 font-semibold text-right">Harga Jual</th>
                {isAdmin && <th className="px-6 py-4 font-semibold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} className="px-6 py-12 text-center text-gray-400">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="px-6 py-12 text-center text-gray-400">No products found. Start by creating one.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={() => navigate(`/catalog/product/${product.id}`)}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{product.name}</span>
                        <span className="text-xs font-mono text-gray-500 mt-0.5">{product.sku_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 tabular-nums">
                      {formatQty(product.quantity)} {product.unit}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-600 tracking-tight tabular-nums">
                      {formatMoney(product.base_price)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-400 tracking-tight tabular-nums">
                      {formatMoney(product.price)}
                    </td>
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

      {/* Delete Confirmation */}
      {isDeleteOpen && deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                You are about to delete <span className="font-bold text-gray-900">"{deletingProduct.name}"</span>. 
                This action is permanent and cannot be reversed.
              </p>
              
              {deleteError && (
                <div className="mb-8 flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle size={16} />
                  <p className="font-medium">{deleteError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDelete}
                  className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}