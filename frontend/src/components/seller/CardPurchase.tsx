import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { CreditCard, Loader, CheckCircle, Clock, ExternalLink, Copy, AlertCircle, Wallet } from 'lucide-react';
import { starpayAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../../utils/helpers';
import { saveCard } from '../../utils/cardStorage';

interface CardPurchaseProps {
  availableBalance?: number;
  onClose?: () => void;
  onCardCreated?: (order: any) => void;
}

interface CardOrder {
  orderId: string;
  status: string;
  payment?: {
    address: string;
    amountSol: number;
    solPrice: number;
  };
  pricing?: {
    cardValue: number;
    starpayFee: number;
    total: number;
  };
  card?: {
    number: string;
    cvv: string;
    expiry: string;
  };
  isMock?: boolean;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
}

export default function CardPurchase({ availableBalance = 0, onClose, onCardCreated }: CardPurchaseProps) {
  const wallet = useWallet();
  const { connection } = useConnection();
  
  const [amount, setAmount] = useState(50);
  const [email, setEmail] = useState('');
  const [cardType, setCardType] = useState<'visa' | 'mastercard'>('visa');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<CardOrder | null>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  
  // Payment states
  const [paymentSent, setPaymentSent] = useState(false);
  const [txSignature, setTxSignature] = useState<string>('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (amount >= 5 && amount <= 10000) {
      fetchPricing();
    }
  }, [amount]);

  const fetchPricing = async () => {
    setLoadingPrice(true);
    try {
      const resp = await starpayAPI.getCardPrice(amount);
      if (resp.success) {
        setPricing(resp.data);
      }
    } catch (error) {
      console.error('Failed to get pricing', error);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handlePurchase = async () => {
    if (amount < 5 || amount > 10000) {
      toast.error('Amount must be between $5 and $10,000');
      return;
    }

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    if (!wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!wallet.signTransaction) {
      toast.error('Wallet does not support transaction signing');
      return;
    }

    setLoading(true);

    try {
      // 1. Create card order
      console.log('📝 Creating card order...');
      const resp = await starpayAPI.createCardOrder({
        amount,
        cardType,
        email
      });

      if (resp.success && resp.data) {
        setOrder(resp.data);
        console.log('✅ Order created:', resp.data.orderId);
        toast.success('Order created! Please confirm payment in your wallet.');

        // 2. ✅ Send REAL devnet transaction
        try {
          console.log('💳 Preparing payment transaction...');
          console.log('💰 Amount:', resp.data.payment.amountSol, 'SOL');
          console.log('📬 To:', resp.data.payment.address);

          const recipientPubkey = new PublicKey(resp.data.payment.address);
          const lamports = Math.floor(resp.data.payment.amountSol * LAMPORTS_PER_SOL);

          // Create transaction
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: recipientPubkey,
              lamports
            })
          );

          // Get recent blockhash
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = wallet.publicKey;

          console.log('🔐 Requesting wallet signature...');
          
          // ✅ User signs transaction in Phantom/Solflare!
          const signed = await wallet.signTransaction(transaction);
          const signature = await connection.sendRawTransaction(signed.serialize());
          
          setTxSignature(signature);
          setPaymentSent(true);
          
          console.log('✅ Transaction sent:', signature);
          toast.success('Payment sent! Confirming on blockchain...');

          // 3. Wait for confirmation
          setVerifying(true);
          console.log('⏳ Waiting for confirmation...');
          
          const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
          }, 'confirmed');

          if (confirmation.value.err) {
            throw new Error('Transaction failed on blockchain');
          }

          console.log('✅ Transaction confirmed on blockchain');
          toast.success('Payment confirmed! Issuing card...');

          // 4. Verify payment on backend and issue card
          console.log('🔍 Verifying payment on backend...');
          const verifyResp = await starpayAPI.verifyPayment(resp.data.orderId, signature);

          if (verifyResp.success && verifyResp.data) {
            console.log('✅ Payment verified and card issued!');
            
            // Save card to localStorage
            const fullOrder = {
              orderId: verifyResp.data.orderId,
              amount,
              cardType,
              email,
              card: verifyResp.data.card,
              isMock: true,
              status: 'completed',
              createdAt: new Date().toISOString()
            };
            
            saveCard(fullOrder);
            console.log('💾 Card saved to localStorage');

            // Update order state
            setOrder(prev => ({
              ...prev!,
              status: 'completed',
              card: verifyResp.data.card
            }));

            toast.success('🎉 Virtual card issued successfully!');

            // Notify parent and redirect
            if (onCardCreated) {
              setTimeout(() => {
                onCardCreated(fullOrder);
              }, 1500);
            }
          } else {
            toast.error('Card issuance failed. Please contact support.');
          }

        } catch (txError: any) {
          console.error('❌ Transaction error:', txError);
          
          if (txError.message?.includes('User rejected')) {
            toast.error('Transaction cancelled');
          } else if (txError.message?.includes('insufficient funds')) {
            toast.error('Insufficient SOL balance');
          } else {
            toast.error('Transaction failed: ' + (txError.message || 'Unknown error'));
          }
        } finally {
          setVerifying(false);
        }
      } else {
        toast.error(resp.error || 'Failed to create card order');
      }
    } catch (error: any) {
      console.error('Card purchase error:', error);
      toast.error(error.response?.data?.error || 'Failed to create card order');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySignature = async () => {
    if (!txSignature) return;
    const success = await copyToClipboard(txSignature);
    if (success) {
      toast.success('Transaction signature copied!');
    }
  };

  // Order created - show status
  if (order && paymentSent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary" />
            Purchase Virtual Card
          </h2>
        </div>

        {/* Transaction Status */}
        <div className="text-center">
          <div className="mb-4">
            {verifying && (
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                <Loader className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
            )}
            {!verifying && order.status === 'completed' && (
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            )}
            {!verifying && order.status !== 'completed' && (
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-semibold mb-2">
            {verifying && 'Verifying Payment...'}
            {!verifying && order.status === 'completed' && '🎉 Card Issued!'}
            {!verifying && order.status !== 'completed' && 'Processing...'}
          </h3>

          {verifying && (
            <p className="text-sm text-gray-400">
              Confirming transaction on Solana blockchain...
            </p>
          )}
        </div>

        {/* Transaction Link */}
        {txSignature && (
          <div className="card bg-blue-500/10 border-blue-500/20">
            <h4 className="font-semibold mb-3 text-blue-400">Transaction Details</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Signature:</p>
                <div className="flex items-center gap-2 bg-dark p-3 rounded-lg">
                  <code className="flex-1 text-xs break-all">{txSignature.slice(0, 20)}...{txSignature.slice(-20)}</code>
                  <button
                    onClick={handleCopySignature}
                    className="p-2 hover:bg-dark-light rounded transition-colors"
                    title="Copy signature"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                View on Solscan
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Completed */}
        {order.status === 'completed' && order.card && (
          <div className="card bg-green-500/10 border-green-500/20">
            <h4 className="font-semibold mb-3 text-green-400">Card Issued Successfully!</h4>
            <p className="text-sm text-gray-400 mb-3">
              Your virtual card has been issued and saved. You will be redirected to view your card details shortly...
            </p>
            {order.isMock && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-400">
                  ⚠️ This is a test card for demo purposes. In production, you would receive a real Starpay card.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Order form
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary" />
          Purchase Virtual Card
        </h2>
      </div>

      {/* Wallet Connection Notice */}
      {!wallet.connected && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex gap-3">
            <Wallet className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-yellow-400 mb-1">Wallet Required</p>
              <p>
                Please connect your Solana wallet to purchase a virtual card. You'll need devnet SOL for payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div>
        <label className="label">Card Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
          <input
            type="number"
            className="input w-full pl-10 text-lg"
            placeholder="50"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            min={5}
            max={10000}
            step={1}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Min: $5 • Max: $10,000
        </p>
      </div>

      {/* Email Input */}
      <div>
        <label className="label">Email Address</label>
        <input
          type="email"
          className="input w-full"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Card details will be sent to this email
        </p>
      </div>

      {/* Card Type */}
      <div>
        <label className="label">Card Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setCardType('visa')}
            className={`p-4 rounded-lg border-2 transition-all ${
              cardType === 'visa'
                ? 'border-primary bg-primary/10'
                : 'border-dark-light hover:border-primary/50'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">VISA</div>
              <p className="text-xs text-gray-500">Most widely accepted</p>
            </div>
          </button>
          <button
            onClick={() => setCardType('mastercard')}
            className={`p-4 rounded-lg border-2 transition-all ${
              cardType === 'mastercard'
                ? 'border-primary bg-primary/10'
                : 'border-dark-light hover:border-primary/50'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">Mastercard</div>
              <p className="text-xs text-gray-500">Global acceptance</p>
            </div>
          </button>
        </div>
      </div>

      {/* Pricing Breakdown */}
      {pricing && !loadingPrice && (
        <div className="card bg-dark-light">
          <h3 className="font-semibold mb-3">Pricing Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Card Value</span>
              <span>${pricing.cardValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Starpay Fee ({pricing.starpayFeePercent}%)</span>
              <span>${pricing.starpayFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Service Fee</span>
              <span>${pricing.resellerMarkup.toFixed(2)}</span>
            </div>
            <div className="border-t border-dark-lighter pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">${pricing.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>Payment in SOL</span>
                <span>~{(pricing.total / (pricing.solPrice || 188)).toFixed(4)} SOL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notice */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-primary mb-1">Payment via Solana Devnet</p>
            <p className="mb-2">
              You'll be asked to sign a transaction in your wallet to complete the payment. Make sure you have enough devnet SOL.
            </p>
            <p className="text-xs text-gray-400">
              Need devnet SOL? Get it from the <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Solana Faucet</a>
            </p>
          </div>
        </div>
      </div>

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={loading || !wallet.connected || amount < 5 || amount > 10000 || !email.trim()}
        className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            Processing...
          </span>
        ) : !wallet.connected ? (
          <span className="flex items-center justify-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet First
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Purchase Card ({pricing ? `~${(pricing.total / (pricing.solPrice || 188)).toFixed(4)} SOL` : '...'})
          </span>
        )}
      </button>
    </div>
  );
}