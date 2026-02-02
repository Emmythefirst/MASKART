// Product page: shows a single product's details and allows purchase flow.
// - In production the purchase flow would integrate with Privacy Cash deposit/confirm flow.
// - For the MVP this page simulates a purchase and creates an order via the API.
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, Download, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { productAPI } from '../services/api';
import type { Product } from '../types';

function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await productAPI.getById(productId!);
      if (response.success) {
        setProduct(response.data!);
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      console.error('Load product error:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  // THIS IS THE UPDATED PURCHASE HANDLER
  const handlePurchase = () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!product) return;

    // Navigate to checkout page instead of direct purchase
    navigate(`/checkout/${product.productId}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Product Not Found</h1>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
      <div className="container-custom py-12">
        <Link 
          to={`/store/${product.storeId}`} 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <div className="aspect-video bg-dark-light rounded-xl overflow-hidden mb-4">
              <img
                src={`${import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${product.coverImage}`}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/800x450?text=No+Image';
                }}
              />
            </div>
            
            <div className="card">
              <h3 className="font-semibold mb-3">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Category</span>
                  <span className="badge badge-primary">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">File Size</span>
                  <span className="text-white">{formatFileSize(product.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">File Type</span>
                  <span className="text-white">{product.fileType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Views</span>
                  <span className="text-white">{product.stats.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sales</span>
                  <span className="text-white">{product.stats.sales}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <span className="badge badge-primary mb-4">{product.category}</span>
            <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
            <p className="text-gray-400 text-lg mb-8 whitespace-pre-wrap">
              {product.description}
            </p>

            <div className="card mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold gradient-text">
                  {product.price}
                </span>
                <span className="text-2xl text-gray-400">{product.currency}</span>
              </div>
              <p className="text-sm text-gray-500">One-time payment • Instant download</p>
            </div>

            <button
              onClick={handlePurchase}
              disabled={!connected}
              className="btn-primary w-full mb-4"
            >
              {!connected ? (
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Connect Wallet to Purchase
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Purchase Now
                </span>
              )}
            </button>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                What You Get
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Instant download after payment</li>
                <li>✓ Encrypted file delivery</li>
                <li>✓ One-time download link (48 hours)</li>
                <li>✓ Full anonymous transaction</li>
                <li>✓ No personal data collected</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
}

export default ProductPage;