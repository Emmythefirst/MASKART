import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ShoppingCart, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '../../types';
import PaymentWidget from './PaymentWidget';
import { formatPrice } from '../../utils/format';

interface CheckoutPageProps {
  product: Product;
  onSuccess: (orderId: string, downloadToken: string) => void;
  onCancel: () => void;
}

function CheckoutPage({ product, onSuccess }: CheckoutPageProps) {
  const { publicKey, connected } = useWallet();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          Checkout
        </h2>

        {/* Product Summary */}
        <div className="bg-dark rounded-lg p-4 mb-6">
          <div className="flex items-start gap-4">
            <img
              src={`https://ipfs.io/ipfs/${product.coverImage}`}
              alt={product.title}
              className="w-24 h-24 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/96x96?text=No+Image';
              }}
            />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{product.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
              <span className="badge badge-primary mt-2">{product.category}</span>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-b border-primary/10 py-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Product Price</span>
            <span className="font-semibold">{formatPrice(product.price, product.currency)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Platform Fee</span>
            <span className="font-semibold text-green-400">FREE</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-primary/10">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold gradient-text">
              {formatPrice(product.price, product.currency)}
            </span>
          </div>
        </div>

        {/* Privacy Features */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Privacy Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Anonymous transaction - no personal data collected</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Encrypted file delivery via IPFS</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>One-time download link (expires in 48 hours)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>No wallet address exposed publicly</span>
            </li>
          </ul>
        </div>

        {/* Wallet Connection */}
        {!connected ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-6">Connect your wallet to complete the purchase</p>
            <WalletMultiButton />
          </div>
        ) : (
          <>
            <div className="bg-dark rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">Paying with:</p>
              <p className="text-sm font-mono text-primary break-all">
                {publicKey?.toBase58()}
              </p>
            </div>

            <PaymentWidget
              productId={product.productId}
              amount={product.price}
              currency={product.currency}
              onSuccess={(orderId, downloadToken) => onSuccess(orderId, downloadToken || '')}
              onError={(err) => toast.error(err)}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default CheckoutPage;