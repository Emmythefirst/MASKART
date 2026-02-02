import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Zap, 
  Shield, 
  Eye, 
  ArrowRight, 
  Download, 
  Clock, 
  Grid3X3, 
  List, 
  Search, 
  Filter, 
  X 
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { storefrontAPI, productAPI, orderAPI } from '../services/api';
import Footer from '../components/common/Footer';
import toast from 'react-hot-toast';
import type { Product, Order } from '../types';
import { PRODUCT_CATEGORIES } from '../utils/constants';

type ApiStatus = 'checking' | 'connected' | 'disconnected';

interface HealthResponse {
  status: string;
  message: string;
}

function Home() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const { publicKey, connected } = useWallet();
  const [hasStore, setHasStore] = useState<boolean>(false);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'popular'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    checkAPI();
  }, []);

  useEffect(() => {
    let mounted = true;
    
    async function checkStore() {
      if (!connected || !publicKey) {
        if (mounted) {
          setHasStore(false);
          // ✅ FIX: Load products even when not connected
          loadMarketplaceProducts();
        }
        return;
      }
      
      try {
        const resp = await storefrontAPI.getByWallet(publicKey.toBase58());
        
        if (!mounted) return;
        
        if (resp.success && resp.data) {
          // User is a SELLER
          setHasStore(true);
          // ✅ FIX: Load products for sellers too!
          loadMarketplaceProducts();
        } else {
          // User is a BUYER
          setHasStore(false);
          loadMarketplaceProducts();
          loadBuyerOrders();
        }
      } catch (_e) {
        if (mounted) {
          setHasStore(false);
          loadMarketplaceProducts();
        }
      }
    }
    
    checkStore();
    
    // Listen for store creation events
    function onChange() { 
      checkStore(); 
    }
    
    window.addEventListener('storefront:changed', onChange);
    
    return () => { 
      mounted = false; 
      window.removeEventListener('storefront:changed', onChange); 
    };
  }, [connected, publicKey]);

  const checkAPI = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:5000/health');
      const data: HealthResponse = await response.json();
      if (data.status === 'OK') {
        setApiStatus('connected');
      }
    } catch (error) {
      setApiStatus('disconnected');
      toast.error('Backend not running. Please start the server.');
    }
  };

  const loadMarketplaceProducts = async () => {
    setLoading(true);
    try {
      const resp = await productAPI.getAllProducts();
      if (resp.success && resp.data) {
        console.log('✅ Loaded products:', resp.data.length);
        setMarketplaceProducts(resp.data);
      }
    } catch (e) {
      console.error('Failed to load marketplace', e);
    } finally {
      setLoading(false);
    }
  };

  const loadBuyerOrders = async () => {
    if (!publicKey) return;
    try {
      const resp = await orderAPI.getBuyerOrders(publicKey.toBase58());
      if (resp.success && resp.data) {
        setBuyerOrders(resp.data);
      }
    } catch (e) {
      console.error('Failed to load orders', e);
    }
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let filtered = [...marketplaceProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => b.stats.sales - a.stats.sales);
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    return filtered;
  }, [marketplaceProducts, searchQuery, selectedCategory, priceRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange([0, 1000]);
    setSortBy('recent');
  };

  // Not connected - show landing page
  if (!connected) {
    return (
        <div className="container-custom py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Status Badge */}
            <div className="mb-8 flex justify-center">
              <div className={`badge ${apiStatus === 'connected' ? 'badge-success' : 'badge-warning'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${apiStatus === 'connected' ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                {apiStatus === 'checking' ? 'Checking backend...' : apiStatus === 'connected' ? 'System Online' : 'Backend Offline'}
              </div>
            </div>

            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse">
                <ShoppingBag className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in">
              <span className="gradient-text">MasKart</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto animate-slide-up">
              The first truly anonymous e-commerce platform on Solana. 
              <br />
              <span className="text-primary">Sell digital products.</span> 
              <span className="text-secondary"> Buy privately.</span> 
              <span className="text-white"> No KYC. Ever.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up">
              <Link to="/products" className="btn-primary text-lg flex items-center justify-center gap-2">
                View Products
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/create-store" className="btn-secondary text-lg">
                Create Store
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-20">
              <div>
                <p className="text-3xl font-bold gradient-text">100%</p>
                <p className="text-sm text-gray-500">Anonymous</p>
              </div>
              <div>
                <p className="text-3xl font-bold gradient-text">0%</p>
                <p className="text-sm text-gray-500">Platform Fees</p>
              </div>
              <div>
                <p className="text-3xl font-bold gradient-text">∞</p>
                <p className="text-sm text-gray-500">Privacy</p>
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mt-20">
              <FeatureCard 
                icon={<Shield className="w-7 h-7 text-primary" />}
                title="Fully Anonymous"
                description="No KYC, no identity verification, no personal data collection. Just pure privacy-preserving commerce powered by Solana."
              />
              <FeatureCard 
                icon={<Zap className="w-7 h-7 text-primary" />}
                title="Instant Payouts"
                description="Get paid directly to your wallet the moment a sale is made. No intermediaries, no delays, no chargebacks."
              />
              <FeatureCard 
                icon={<Eye className="w-7 h-7 text-primary" />}
                title="Encrypted Delivery"
                description="Files are automatically encrypted and stored on IPFS. One-time download links that self-destruct after 48 hours."
              />
            </div>

            {/* How It Works */}
            <div className="mt-32">
              <h2 className="text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-gray-400 mb-16">Three simple steps to start selling anonymously</p>

              <div className="grid md:grid-cols-3 gap-8">
                <HowItWorksCard 
                  number="1"
                  title="Create Your Store"
                  description="Connect your Solana wallet and set up your anonymous storefront in under 60 seconds."
                />
                <HowItWorksCard 
                  number="2"
                  title="Upload Products"
                  description="List your digital products. We handle encryption, storage, and secure delivery automatically."
                />
                <HowItWorksCard 
                  number="3"
                  title="Get Paid"
                  description="Receive instant, private payments directly to your wallet. Keep 100% of your revenue."
                />
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-32 card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <h2 className="text-3xl font-bold mb-4">Ready to go ghost?</h2>
              <p className="text-gray-400 mb-8">
                Join the privacy revolution. Start selling without surveillance.
              </p>
              <Link to="/create-store" className="btn-primary inline-flex items-center gap-2">
                Create Your Store Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        <Footer />
      </div>
    );
  }

  // Connected - show marketplace (works for both buyers and sellers)
  return (
      <div className="container-custom py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
          <p className="text-gray-400">
            {hasStore 
              ? 'Browse products or manage your store from the dashboard' 
              : 'Browse and purchase digital products anonymously'}
          </p>
        </div>

        {/* Recent Orders Section - Only for buyers */}
        {!hasStore && buyerOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Recent Orders</h2>
              {buyerOrders.length > 1 && (
                <Link to="/orders" className="text-primary hover:text-primary-400 text-sm font-medium flex items-center gap-2 group transition-all">
                  View All Orders
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
            <div className="grid gap-4">
              {buyerOrders.slice(0, 1).map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar & Controls */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-12"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary/20' : ''}`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            <div className="flex gap-2 bg-dark-light rounded-lg p-1">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded ${view === 'grid' ? 'bg-primary text-white' : 'text-gray-400'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded ${view === 'list' ? 'bg-primary text-white' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="card animate-slide-down">
              <div className="grid md:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="label">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="select w-full"
                  >
                    <option value="all">All Categories</option>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="label">Min Price (SOL)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="label">Max Price (SOL)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value) || 1000])}
                    className="input w-full"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="label">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="select w-full"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="btn-ghost text-sm flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchQuery || selectedCategory !== 'all' || priceRange[0] > 0 || priceRange[1] < 1000) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Active filters:</span>
              {searchQuery && (
                <span className="badge badge-primary">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="badge badge-primary">
                  {PRODUCT_CATEGORIES.find(c => c.value === selectedCategory)?.label}
                  <button onClick={() => setSelectedCategory('all')} className="ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                <span className="badge badge-primary">
                  {priceRange[0]} - {priceRange[1]} SOL
                  <button onClick={() => setPriceRange([0, 1000])} className="ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-400">
          Showing {filteredProducts.length} of {marketplaceProducts.length} products
        </div>

        {/* Marketplace Products */}
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner w-12 h-12 mx-auto" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-gray-400 mb-4">
              {marketplaceProducts.length === 0 
                ? 'Check back later for new listings' 
                : 'Try adjusting your filters or search query'}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button onClick={clearFilters} className="btn-primary">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.productId} product={product} view={view} />
            ))}
          </div>
        )}
      </div>
  );
}

// Helper Components
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card-hover text-left">
      <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function HowItWorksCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative">
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-xl">
        {number}
      </div>
      <div className="card text-left pt-10">
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function ProductCard({ product, view }: { product: Product; view: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <Link to={`/product/${product.productId}`} className="card hover:border-primary/30 transition-all group flex gap-4 p-4">
        <img 
          src={`https://ipfs.io/ipfs/${product.coverImage}`} 
          alt={product.title} 
          className="w-24 h-24 rounded-lg object-cover" 
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/96x96?text=No+Image'; }} 
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">{product.title}</h3>
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">{product.description}</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <span>👁️ {product.stats.views} views</span>
            <span>💰 {product.stats.sales} sales</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold gradient-text mb-1">{product.price} {product.currency}</div>
          <span className="badge badge-primary capitalize">{product.category}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/product/${product.productId}`} className="card-hover group">
      <div className="aspect-video bg-dark-lighter rounded-lg mb-4 overflow-hidden">
        <img 
          src={`https://ipfs.io/ipfs/${product.coverImage}`} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x225?text=No+Image'; }} 
        />
      </div>
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">{product.title}</h3>
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold gradient-text">{product.price} {product.currency}</span>
        <span className="badge badge-primary capitalize">{product.category}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>👁️ {product.stats.views}</span>
        <span>💰 {product.stats.sales} sales</span>
      </div>
    </Link>
  );
}

function OrderCard({ order }: { order: Order }) {
  const isExpiringSoon = order.expiresAt && new Date(order.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return (
    <div className="card hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Order #{order.orderId.slice(-8)}</h3>
          <div className="flex gap-4 text-sm text-gray-400 mb-4">
            <span>{order.amount} {order.currency}</span>
            <span>•</span>
            <span>{new Date(order.createdAt || '').toLocaleDateString()}</span>
          </div>
          {isExpiringSoon && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 w-fit">
              <Clock className="w-4 h-4" />
              Download expires soon
            </div>
          )}
        </div>
        <Link to={`/order/${order.orderId}`} className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          View Order
        </Link>
      </div>
    </div>
  );
}

export default Home;