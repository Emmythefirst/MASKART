// Storefront page: public view of a seller's store.
// - Fetches storefront metadata and product list for the given `storeId`.
// - Renders store header and product grid.
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { storefrontAPI, productAPI } from '../services/api';
import type { Storefront, Product } from '../types';

function StorefrontPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      loadStorefront();
      loadProducts();
    }
  }, [storeId]);

  const loadStorefront = async () => {
    try {
      const response = await storefrontAPI.getById(storeId!);
      if (response.success) {
        setStorefront(response.data!);
      } else {
        toast.error('Store not found');
      }
    } catch (error) {
      console.error('Load storefront error:', error);
      toast.error('Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getStoreProducts(storeId!);
      if (response.success) {
        setProducts(response.data!);
      }
    } catch (error) {
      console.error('Load products error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Store Not Found</h1>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
      <div className="container-custom py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Store Header */}
        <div className="card mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: storefront.theme.primaryColor }}>
                {storefront.storeName}
              </h1>
              {storefront.description && (
                <p className="text-gray-400 text-lg mb-4">{storefront.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>📦 {storefront.stats.totalProducts} Products</span>
                <span>💰 {storefront.stats.totalSales} Sales</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Products</h2>
          
          {products.length === 0 ? (
            <div className="card text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No products yet</p>
              <p className="text-gray-500 text-sm">Check back later for new listings</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.productId}
                  to={`/product/${product.productId}`}
                  className="card-hover group"
                >
                  <div className="aspect-video bg-dark-lighter rounded-lg mb-4 overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${product.coverImage}`}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x225?text=No+Image';
                      }}
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold gradient-text">
                      {product.price} {product.currency}
                    </span>
                    <span className="badge badge-primary">
                      {product.category}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between text-sm text-gray-500">
                    <span>👁️ {product.stats.views} views</span>
                    <span>💰 {product.stats.sales} sales</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}

export default StorefrontPage;