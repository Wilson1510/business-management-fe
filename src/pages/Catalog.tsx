import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteIconButton } from '../components/DeleteIconButton';
import { TableSearchInput } from '../components/TableSearchInput';
import { PageHeading } from '../components/PageHeading';
import { ErrorAlert } from '../components/ErrorAlert';
import { AddItemButton } from '../components/AddItemButton';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { getProducts, deleteProduct, type ProductList, type ProductListItem } from '../services/products';
import { formatMoney, formatQty } from '../utils/format';
import { useAuth } from '../components/auth/AuthContext';
import { toastSuccessDelete } from '../utils/toast';

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
  const [isDeleting, setIsDeleting] = useState(false);

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
    setIsDeleting(false);
  };

  async function handleDelete() {
    if (!deletingProduct) return;
    const id = deletingProduct.id;
    const name = deletingProduct.name;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      closeDelete();
      toastSuccessDelete(name);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Gagal menghapus produk.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = user.role === 'admin';
  const tableColSpan = isAdmin ? 6 : 5;

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          title="Daftar Produk"
          description="Mengelola item inventaris, satuan, dan harga"
        />
        
        {isAdmin && (
          <AddItemButton text="Tambah Produk" onClick={() => navigate('/catalog/product/new')} />
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
          <TableSearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan SKU atau Nama..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase transition-colors">
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
                  <td colSpan={tableColSpan} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Memuat produk...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    {products.length === 0 ? 'Belum ada produk' : 'Tidak ada produk yang cocok dengan pencarian Anda'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id} 
                    onClick={isAdmin ? () => navigate(`/catalog/product/${product.id}`) : undefined}
                    className={`
                      hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group
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
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white tracking-tight tabular-nums">
                        {formatMoney(product.base_price)}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white tracking-tight tabular-nums">
                        {formatMoney(product.price)}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DeleteIconButton
                            onClick={(e) => { e.stopPropagation(); openDelete(product); }}
                            aria-label="Hapus produk"
                          />
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
          title="Hapus Produk"
          itemName={deletingProduct.name}
          errorMessage={deleteError}
          deleting={isDeleting}
          onCancel={closeDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}