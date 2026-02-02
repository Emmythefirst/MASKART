// client/src/components/settings/WithdrawalManager.tsx

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, ArrowRight } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { privacyCash } from '../../services/privacy';
import toast from 'react-hot-toast';
import { hasStoredCard, getLatestCard } from '../../utils/cardStorage';

interface WithdrawalManagerProps {
  totalRevenue: number;
  currency?: 'SOL' | 'USDC' | 'USDT';
}

export default function WithdrawalManager({ 
  totalRevenue, 
  currency = 'SOL' 
}: WithdrawalManagerProps) {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [withdrawing, setWithdrawing] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [hasCard, setHasCard] = useState(false);
  const [latestCard, setLatestCard] = useState<any>(null);

  useEffect(() => {
    if (wallet.publicKey) {
      setRecipientAddress(wallet.publicKey.toBase58());
    }
    checkCard();
  }, [wallet.publicKey]);

  // Re-check card when page gains focus (user comes back from /card)
  useEffect(() => {
    const handleFocus = () => checkCard();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const checkCard = () => {
    const cardExists = hasStoredCard();
    setHasCard(cardExists);
    
    if (cardExists) {
      const card = getLatestCard();
      setLatestCard(card);
      console.log('✅ Card detected:', card?.orderId);
    } else {
      setLatestCard(null);
      console.log('❌ No card found');
    }
  };

  const handleWithdraw = async () => {
    if (!wallet.publicKey || !wallet.signMessage) {
      toast.error('Please connect your wallet');
      return;
    }

    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > totalRevenue) {
      toast.error('Insufficient balance');
      return;
    }

    if (!recipientAddress) {
      toast.error('Please enter a recipient address');
      return;
    }

    setWithdrawing(true);

    try {
      const result = await privacyCash.withdrawSOL(wallet, amount, recipientAddress);

      if (result.success && result.txSignature) {
        toast.success('Withdrawal successful!');
        
        setWithdrawalHistory([
          {
            amount,
            currency,
            recipientAddress,
            txSignature: result.txSignature,
            timestamp: new Date().toISOString(),
          },
          ...withdrawalHistory,
        ]);

        setAmount(0);
      } else {
        toast.error(result.error || 'Withdrawal failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to withdraw funds');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="card bg-gradient-to-r from-green-500/10 to-primary/10 border-green-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Available Balance</h3>
            <p className="text-3xl font-bold text-green-400 mb-4">
              {totalRevenue.toFixed(4)} {currency}
            </p>
            <p className="text-sm text-gray-400">
              Total revenue from all sales. Withdraw or convert to a virtual card anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Virtual Card Section */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Virtual Card</h3>
        
        {hasCard && latestCard ? (
          /* Has Card - Show "View Card" button */
          <button
            onClick={() => navigate('/card')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 rounded-lg border border-primary/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/30 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{latestCard.cardType.toUpperCase()} Virtual Card</p>
                <p className="text-sm text-gray-400">Manage your card</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        ) : (
          /* No Card - Show "Get Virtual Card" button */
          <div>
            <p className="text-gray-400 text-sm mb-4">
              Convert your earnings to a Visa or Mastercard for online purchases
            </p>
            <button
              onClick={() => navigate('/card/new')}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Get Virtual Card
            </button>
          </div>
        )}
      </div>

      {/* Withdrawal Form */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Withdraw Funds
        </h3>

        <div className="space-y-6">
          <div>
            <label className="label">Amount to Withdraw</label>
            <div className="relative">
              <input
                type="number"
                className="input w-full pr-16"
                placeholder="0.00"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                step="0.0001"
                min="0"
                max={totalRevenue}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                {currency}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-500">
                Available: {totalRevenue.toFixed(4)} {currency}
              </span>
              <button
                type="button"
                onClick={() => setAmount(totalRevenue)}
                className="text-primary hover:text-primary/80"
              >
                Max
              </button>
            </div>
          </div>

          <div>
            <label className="label">Recipient Address</label>
            <input
              type="text"
              className="input w-full font-mono text-sm"
              placeholder="Solana wallet address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Defaults to your connected wallet
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Private Withdrawal
            </h4>
            <p className="text-sm text-gray-400">
              Funds will be withdrawn using Privacy Cash for complete anonymity. The transaction will not reveal your earnings publicly.
            </p>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={withdrawing || amount <= 0 || amount > totalRevenue}
            className="btn-primary w-full py-4"
          >
            {withdrawing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner w-5 h-5" />
                Withdrawing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <DollarSign className="w-5 h-5" />
                Withdraw Funds
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Withdrawal History */}
      {withdrawalHistory.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Withdrawal History</h3>
          <div className="space-y-3">
            {withdrawalHistory.map((withdrawal, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-dark rounded-lg">
                <div>
                  <p className="font-semibold">
                    {withdrawal.amount.toFixed(4)} {withdrawal.currency}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(withdrawal.timestamp).toLocaleString()}
                  </p>
                </div>
                <a
                  href={`https://solscan.io/tx/${withdrawal.txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  View TX →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}