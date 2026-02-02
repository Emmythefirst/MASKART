import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  ArrowLeft,
  Download,
  Package,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import KeyManagement from '../components/seller/KeyManagement';
import EscrowControls from '../components/common/EscrowControls';
import { orderAPI, productAPI, storefrontAPI } from '../services/api';
import toast from 'react-hot-toast';
import type { Order, Product } from '../types';
import { EscrowState } from '../types';

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { publicKey, connected } = useWallet();
  const [order, setOrder] = useState<Order | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    if (orderId) load();
  }, [orderId]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await orderAPI.getById(orderId!);
      if (resp.success && resp.data) {
        setOrder(resp.data);
        loadProduct(resp.data.productId);

        // Check if current user is the seller
        if (connected && publicKey && resp.data.storeId) {
          const storeResp = await storefrontAPI.getById(resp.data.storeId);
          if (storeResp.success && storeResp.data) {
            setIsSeller(storeResp.data.walletAddress === publicKey.toBase58());
          }
        }
      } else {
        toast.error('Order not found');
      }
    } catch {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const loadProduct = async (productId: string) => {
    try {
      const resp = await productAPI.getById(productId);
      if (resp.success && resp.data) {
        setProduct(resp.data);
      }
    } catch (e) {
      console.error('Failed to load product', e);
    }
  };

  const getStatusConfig = (order: Order) => {
    // ✅ FIXED: Check status first (for demo mode)
    if (order.status === 'delivered' || order.escrowState === EscrowState.RELEASED) {
      return {
        color: 'text-green-400 bg-green-500/10 border-green-500/20',
        icon: <CheckCircle className="w-5 h-5" />,
        label: 'Completed'
      };
    }

    if (order.escrowState === EscrowState.DISPUTED) {
      return {
        color: 'text-red-400 bg-red-500/10 border-red-500/20',
        icon: <AlertCircle className="w-5 h-5" />,
        label: 'Disputed'
      };
    }

    if (order.escrowState === EscrowState.FUNDED) {
      return {
        color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        icon: <Clock className="w-5 h-5" />,
        label: 'In Escrow'
      };
    }

    // Default: pending/processing
    return {
      color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
      icon: <Package className="w-5 h-5" />,
      label: 'Pending'
    };
  };

  if (loading) {
    return (
      <div className="container-custom py-12 text-center">
        <div className="spinner w-12 h-12 mx-auto" />
        <p className="text-gray-400 mt-4">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-12">
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-gray-400 mb-6">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link to="/orders" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order);

  const isExpiringSoon =
    order.expiresAt &&
    new Date(order.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000) &&
    (order.status === 'delivered' || order.escrowState === EscrowState.RELEASED);

  return (
    <div className="container-custom py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/orders" className="p-2 text-gray-400 hover:text-white hover:bg-dark-light rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">
            Order #{orderId?.slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray-400 text-sm">Order ID: {orderId}</p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConfig.color}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </div>
      </div>

      {/* Expiring Warning */}
      {isExpiringSoon && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-1" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">
              Download link expires soon
            </p>
            <p className="text-xs text-gray-400">
              Expires on{' '}
              {new Date(order.expiresAt!).toLocaleString('en-US', {
                dateStyle: 'long',
                timeStyle: 'short'
              })}
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {product && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Product Information</h2>
              <div className="flex gap-4">
                <img
                  src={`https://ipfs.io/ipfs/${product.coverImage}`}
                  alt={product.title}
                  className="w-24 h-24 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/96x96?text=No+Image';
                  }}
                />
                <div>
                  <h3 className="text-lg font-semibold">{product.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {product.description}
                  </p>
                  <span className="badge badge-primary mt-2">
                    {product.category}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Key Management for Sellers */}
          {isSeller && product && (
            <KeyManagement
              orderId={orderId!}
              productId={product.productId}
              encryptedFileHash={(product as any).encryptedFileHash || 'N/A'}
              onKeyUploaded={load}
            />
          )}

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <InfoRow label="Product ID" value={order.productId} />
            <InfoRow label="Store ID" value={order.storeId} />
            <InfoRow
              label="Amount Paid"
              value={`${order.amount} ${order.currency}`}
              valueClass="text-xl font-bold gradient-text"
            />
            <InfoRow label="Transaction" value={order.txSignature} />
            <InfoRow
              label="Escrow State"
              value={order.escrowState}
              valueClass="capitalize"
            />
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Privacy Protected Purchase
                </h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✓ Funds held in escrow</li>
                  <li>✓ Encrypted IPFS delivery</li>
                  <li>✓ Seller paid only after release</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ✅ DEMO MODE: Always show download if token exists */}
          {order.downloadToken && (
            <Link 
              to={`/download/${order.orderId}/${order.downloadToken}`}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              <Download className="w-5 h-5" />
              Download Product
            </Link>
          )}
        </div>

        {/* Right */}
        <div>
          <EscrowControls orderId={orderId!} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass = 'text-white'
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between py-3 border-b border-primary/10 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-medium break-all ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}