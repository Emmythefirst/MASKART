import { TrendingUp, DollarSign, ShoppingCart, Eye } from 'lucide-react';
import type { Storefront, Product } from '../../types';
import { formatNumber, formatPrice } from '../../utils/format';

interface SalesAnalyticsProps {
  storefront: Storefront;
  products: Product[];
}

function SalesAnalytics({ storefront, products }: SalesAnalyticsProps) {
  // Calculate total views across all products
  const totalViews = products.reduce((sum, product) => sum + product.stats.views, 0);
  
  // Find best selling product
  const bestSeller = products.reduce((best, product) => 
    product.stats.sales > (best?.stats.sales || 0) ? product : best
  , products[0]);

  // Calculate average price
  const avgPrice = products.length > 0
    ? products.reduce((sum, p) => sum + p.price, 0) / products.length
    : 0;

  // Calculate conversion rate (sales / views)
  const conversionRate = totalViews > 0
    ? ((storefront.stats.totalSales / totalViews) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">
            {formatPrice(storefront.stats.totalRevenue, 'SOL')}
          </p>
          <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Sales</span>
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(storefront.stats.totalSales)}</p>
          <p className="text-xs text-gray-500 mt-1">Products sold</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Views</span>
            <Eye className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalViews)}</p>
          <p className="text-xs text-gray-500 mt-1">Across all products</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Conversion Rate</span>
            <TrendingUp className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold">{conversionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Views to sales</p>
        </div>
      </div>

      {/* Product Performance */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Product Performance</h3>
        
        {products.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No products yet. Add products to see analytics.
          </p>
        ) : (
          <div className="space-y-4">
            {products
              .sort((a, b) => b.stats.sales - a.stats.sales)
              .slice(0, 5)
              .map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-4 p-4 bg-dark rounded-lg hover:bg-dark-lighter transition-colors"
                >
                  <img
                    src={`https://ipfs.io/ipfs/${product.coverImage}`}
                    alt={product.title}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/64x64?text=No+Image';
                    }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{product.title}</h4>
                    <p className="text-sm text-gray-400">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold">{product.stats.sales}</p>
                    <p className="text-xs text-gray-500">sales</p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">
                      {formatPrice(product.stats.revenue, product.currency)}
                    </p>
                    <p className="text-xs text-gray-500">revenue</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm">{product.stats.views}</p>
                    <p className="text-xs text-gray-500">views</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Best Seller */}
      {bestSeller && bestSeller.stats.sales > 0 && (
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">🏆 Best Seller</h3>
              <p className="text-lg font-bold mb-1">{bestSeller.title}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{bestSeller.stats.sales} sales</span>
                <span>•</span>
                <span>{formatPrice(bestSeller.stats.revenue, bestSeller.currency)} revenue</span>
                <span>•</span>
                <span>{bestSeller.stats.views} views</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-gray-400 text-sm mb-2">Average Product Price</p>
          <p className="text-2xl font-bold gradient-text">
            {formatPrice(avgPrice, 'SOL')}
          </p>
        </div>

        <div className="card">
          <p className="text-gray-400 text-sm mb-2">Active Products</p>
          <p className="text-2xl font-bold gradient-text">
            {products.filter(p => p.isActive).length}
          </p>
        </div>

        <div className="card">
          <p className="text-gray-400 text-sm mb-2">Total Products</p>
          <p className="text-2xl font-bold gradient-text">
            {storefront.stats.totalProducts}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SalesAnalytics;