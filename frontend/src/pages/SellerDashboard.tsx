import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Package, TrendingUp, Settings as SettingsIcon, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { storefrontAPI, productAPI } from '../services/api';
import type { Storefront, Product } from '../types';

// Import tab components
import Dashboard from '../components/seller/Dashboard';
import ProductList from '../components/seller/ProductList';
import SalesAnalytics from '../components/seller/SalesAnalytics';
import Settings from '../components/seller/Settings';
import ProductForm from '../components/storefront/ProductForm';
import Modal from '../components/common/Modal';

type TabType = 'overview' | 'products' | 'analytics' | 'settings';

function SellerDashboard() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      loadStorefront();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const loadStorefront = async () => {
    try {
      const response = await storefrontAPI.getByWallet(publicKey!.toBase58());
      if (response.success && response.data) {
        setStorefront(response.data);
        loadProducts(response.data.storeId);
      } else {
        setStorefront(null);
      }
    } catch (error) {
      console.error('Load storefront error:', error);
      setStorefront(null);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (storeId: string) => {
    try {
      const response = await productAPI.getStoreProducts(storeId);
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Load products error:', error);
    }
  };

  const handleProductSubmit = async (formData: FormData) => {
    if (!storefront || !publicKey) return;

    // Add store ID and wallet address to form data
    formData.append('storeId', storefront.storeId);
    formData.append('walletAddress', publicKey.toBase58());

    setUploading(true);

    try {
      const response = await productAPI.create(formData);

      if (response.success) {
        toast.success('Product created successfully!');
        setShowProductForm(false);
        loadProducts(storefront.storeId);

        // NEW: Refresh storefront to update stats
      loadStorefront();
      } else {
        toast.error(response.error || 'Failed to create product');
      }
    } catch (error: any) {
      console.error('Create product error:', error);
      toast.error(error.response?.data?.error || 'Failed to create product');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!publicKey || !confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await productAPI.delete(productId, publicKey.toBase58());
      if (response.success) {
        toast.success('Product deleted successfully!');
        loadProducts(storefront!.storeId);
      } else {
        toast.error(response.error || 'Failed to delete product');
      }
    } catch (error: any) {
      console.error('Delete product error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  if (!connected) {
    return (
        <div className="container-custom py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8">Please connect your wallet to access the seller dashboard</p>
        </div>
    );
  }

  if (!storefront) {
    return (
        <div className="container-custom py-20 text-center">
          <Package className="w-24 h-24 text-gray-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">No Store Found</h1>
          <p className="text-gray-400 mb-8">Create your first store to start selling</p>
          <button onClick={() => navigate('/create-store')} className="btn-primary">
            Create Store
          </button>
        </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
      <div className="container-custom py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{storefront.storeName}</h1>
          <p className="text-gray-400">{storefront.description || 'Manage your store'}</p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 bg-white">
         <div className="container mx-auto px-6">
          <div className="flex gap-8">
           {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 transition-all
                font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-[#14B8A6] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
               <tab.icon className="w-4 h-4" />
               <span>{tab.label}</span>
           </button>
         ))}
       </div>
     </div>
   </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'overview' && (
            <Dashboard storefront={storefront} />
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Products</h2>
                <button
                  onClick={() => setShowProductForm(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Add Product
                </button>
              </div>

              {products.length === 0 ? (
                <div className="card text-center py-12">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No products yet</h3>
                  <p className="text-gray-400 mb-6">Create your first product to start selling</p>
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Package className="w-5 h-5" />
                    Add Product
                  </button>
                </div>
              ) : (
                <ProductList
                  products={products}
                  onDelete={handleDeleteProduct}
                />
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <SalesAnalytics storefront={storefront} products={products} />
          )}

          {activeTab === 'settings' && (
            <Settings
              storefront={storefront}
              walletAddress={publicKey!.toBase58()}
              onUpdate={loadStorefront}
            />
          )}
        </div>

      {/* Product Form Modal */}
      <Modal
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        title="Add New Product"
        size="lg"
      >
        <ProductForm
          onSubmit={handleProductSubmit}
          onCancel={() => setShowProductForm(false)}
          loading={uploading}
        />
      </Modal>
    </div>  
  );
}

export default SellerDashboard;