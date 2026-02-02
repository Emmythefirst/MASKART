// Products page: public product listing.
// - Calls the backend public products endpoint and renders a grid of products.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { productAPI } from '../services/api';
import type { Product } from '../types';

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAllProducts();
      if (response.success) setProducts(response.data || []);
    } catch (err) {
      console.error('Load products error', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  return (
      <div className="container-custom py-12">
        <h1 className="text-3xl font-bold mb-6">Products</h1>

        {products.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No products available</p>
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
  );
}

export default ProductsPage;
