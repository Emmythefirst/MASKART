import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { keyAPI, orderAPI, productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Package,
  ArrowLeft,
  Search,
  RefreshCw
} from 'lucide-react';

interface DisputeOrder {
  orderId: string;
  productId: string;
  buyerWalletHash: string;
  amount: number;
  currency: string;
  disputeReason?: string;
  disputeOpenedAt?: string;
  createdAt?: string;
  product?: any;
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<DisputeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'recent' | 'old'>('all');

  useEffect(() => { 
    load(); 
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await keyAPI.listDisputes();
      if (resp.success && resp.data) {
        // Load product details for each dispute
        const disputesWithProducts = await Promise.all(
          resp.data.map(async (dispute: any) => {
            try {
              const productResp = await productAPI.getById(dispute.productId);
              return {
                ...dispute,
                product: productResp.success ? productResp.data : null
              };
            } catch {
              return dispute;
            }
          })
        );
        setDisputes(disputesWithProducts);
      }
    } catch (e) {
      toast.error('Failed to load disputes');
    } finally { 
      setLoading(false); 
    }
  };

  const handleRelease = async (orderId: string) => {
    if (!confirm('Are you sure you want to release escrow for this order? This action cannot be undone.')) {
      return;
    }

    setProcessing(orderId);
    try {
      const resp = await orderAPI.adminRelease(orderId);
      if (resp.success) {
        toast.success('Escrow released successfully');
        await load();
      } else {
        toast.error(resp.error || 'Failed to release escrow');
      }
    } catch (e) {
      toast.error('Failed to release escrow');
    } finally {
      setProcessing(null);
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    // Search filter
    const matchesSearch = searchQuery.trim() === '' || 
      dispute.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.product?.title?.toLowerCase().includes(searchQuery.toLowerCase());

    // Time filter
    let matchesFilter = true;
    if (filterStatus === 'recent') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      matchesFilter = dispute.disputeOpenedAt ? new Date(dispute.disputeOpenedAt) > oneDayAgo : true;
    } else if (filterStatus === 'old') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      matchesFilter = dispute.disputeOpenedAt ? new Date(dispute.disputeOpenedAt) <= oneDayAgo : false;
    }

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: disputes.length,
    recent: disputes.filter(d => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return d.disputeOpenedAt ? new Date(d.disputeOpenedAt) > oneDayAgo : false;
    }).length,
    totalValue: disputes.reduce((sum, d) => sum + (d.amount || 0), 0)
  };

  return (
    <div className="container-custom py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 text-gray-400 hover:text-white hover:bg-dark-light rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              Admin - Dispute Management
            </h1>
            <p className="text-gray-400">Review and resolve order disputes</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-yellow-500/10 border-yellow-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Disputes</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="card bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Recent (24h)</p>
                <p className="text-3xl font-bold text-red-400">{stats.recent}</p>
              </div>
            </div>
          </div>

          <div className="card bg-primary/10 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-3xl font-bold text-primary">{stats.totalValue.toFixed(2)} SOL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, product ID, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-12"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'recent', 'old'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-3 rounded-lg text-sm font-medium capitalize transition-all ${
                  filterStatus === status
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-dark-light text-gray-400 border border-primary/10 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Disputes List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner w-12 h-12 mx-auto mb-4" />
            <p className="text-gray-400">Loading disputes...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Disputes Found</h3>
            <p className="text-gray-400">
              {disputes.length === 0 
                ? 'All orders are running smoothly!' 
                : 'No disputes match your search criteria'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <div key={dispute.orderId} className="card hover:border-yellow-500/30 transition-all">
                <div className="flex gap-6">
                  {/* Product Image */}
                  {dispute.product?.coverImage && (
                    <img
                      src={`https://ipfs.io/ipfs/${dispute.product.coverImage}`}
                      alt={dispute.product.title}
                      className="w-24 h-24 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/96x96?text=No+Image';
                      }}
                    />
                  )}

                  {/* Dispute Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          {dispute.product?.title || 'Product'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="font-mono">Order: {dispute.orderId.slice(-8)}</span>
                          <span>•</span>
                          <span>{dispute.amount} {dispute.currency}</span>
                          {dispute.disputeOpenedAt && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(dispute.disputeOpenedAt).toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Disputed
                      </span>
                    </div>

                    {dispute.disputeReason && (
                      <div className="bg-dark rounded-lg p-3 mb-4">
                        <p className="text-xs text-gray-500 mb-1">Dispute Reason:</p>
                        <p className="text-sm text-gray-300">{dispute.disputeReason}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Product ID</p>
                        <p className="font-mono text-xs">{dispute.productId}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Buyer Hash</p>
                        <p className="font-mono text-xs">{dispute.buyerWalletHash?.slice(0, 16)}...</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleRelease(dispute.orderId)}
                      disabled={processing === dispute.orderId}
                      className="btn-primary whitespace-nowrap flex items-center gap-2"
                    >
                      {processing === dispute.orderId ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Release to Seller
                        </>
                      )}
                    </button>
                    <Link
                      to={`/order/${dispute.orderId}`}
                      className="btn-secondary text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}