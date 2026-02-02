import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, Download, Clock, CheckCircle, XCircle, 
  Search, Package, AlertCircle, Eye, ArrowLeft
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { orderAPI } from '../services/api';
import type { Order } from '../types';
import toast from 'react-hot-toast';
import { EscrowState } from '../types';

function Orders() {
  const { publicKey, connected } = useWallet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const loadOrders = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const resp = await orderAPI.getBuyerOrders(publicKey.toBase58());
      if (resp.success && resp.data) {
        setOrders(resp.data);
      }
    } catch (e) {
      console.error('Failed to load orders', e);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'confirmed' || o.status === 'delivered').length,
    pending: orders.filter(o => o.status === 'pending').length,
    failed: orders.filter(o => o.status === 'failed').length
  };

  if (!connected) {
    return (
      <div className="container-custom py-20 text-center">
        <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600 mb-8">Please connect your wallet to view your orders</p>
      </div>
    );
  }

  return (
    <div className="container-custom py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/" 
          className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600 font-medium">View and manage your purchase history</p>
        </div>
      </div>

      {/* Stats Cards - VIVID COLORS AND BLACK TEXT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Orders - BRIGHT TEAL */}
        <div className="bg-[#CCFBF1] rounded-xl p-6 border-2 border-[#5EEAD4] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#14B8A6] flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-5xl font-bold text-gray-900 mb-2">{stats.total}</p>
          <p className="text-sm font-semibold text-gray-700">Total Orders</p>
        </div>

        {/* Delivered - BRIGHT GREEN */}
        <div className="bg-[#D1FAE5] rounded-xl p-6 border-2 border-[#6EE7B7] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#10B981] flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-5xl font-bold text-gray-900 mb-2">{stats.delivered}</p>
          <p className="text-sm font-semibold text-gray-700">Delivered</p>
        </div>

        {/* Pending - BRIGHT YELLOW */}
        <div className="bg-[#FEF3C7] rounded-xl p-6 border-2 border-[#FDE047] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#F59E0B] flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-5xl font-bold text-gray-900 mb-2">{stats.pending}</p>
          <p className="text-sm font-semibold text-gray-700">Pending</p>
        </div>

        {/* Failed - BRIGHT RED */}
        <div className="bg-[#FEE2E2] rounded-xl p-6 border-2 border-[#FCA5A5] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#EF4444] flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-5xl font-bold text-gray-900 mb-2">{stats.failed}</p>
          <p className="text-sm font-semibold text-gray-700">Failed</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-12"
          />
        </div>
        
        <div className="flex gap-2">
          {['all', 'confirmed', 'pending', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all capitalize ${
                statusFilter === status
                  ? 'bg-[#14B8A6] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="spinner w-12 h-12 mx-auto" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search' : 'You haven\'t made any purchases yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const getStatusConfig = (order: Order) => {
    if (order.escrowState === EscrowState.RELEASED) {
      return { 
        color: 'text-green-700 bg-green-100 border-green-300',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Delivered'
      };
    }
    if (order.escrowState === EscrowState.DISPUTED) {
      return { 
        color: 'text-red-700 bg-red-100 border-red-300',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Disputed'
      };
    }
    return { 
      color: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      icon: <Clock className="w-4 h-4" />,
      label: 'Processing'
    };
  };

  const statusConfig = getStatusConfig(order);
  const isExpiringSoon = order.expiresAt && 
    new Date(order.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000) &&
    order.escrowState === EscrowState.RELEASED;

  return (
    <div className="card hover:border-primary/40 transition-all group">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#14B8A6] transition-colors">
                Order #{order.orderId.slice(-8).toUpperCase()}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                <span className="font-mono text-xs">{order.orderId}</span>
                <span>•</span>
                <span>{new Date(order.createdAt || '').toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${statusConfig.color} text-sm font-semibold`}>
              {statusConfig.icon}
              {statusConfig.label}
            </div>
          </div>

          {isExpiringSoon && (
            <div className="flex items-center gap-2 text-yellow-700 text-sm bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 mb-3 w-fit font-semibold">
              <AlertCircle className="w-4 h-4" />
              Download expires soon
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-600 font-semibold mb-1">Amount Paid</div>
                <div className="text-2xl font-bold text-[#14B8A6]">
                  {order.amount} {order.currency}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/order/${order.orderId}`}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Link>
              {order.escrowState === EscrowState.RELEASED && (
                <Link to={`/order/${order.orderId}`} className="btn-primary text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orders;