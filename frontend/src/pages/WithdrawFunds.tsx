import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, TrendingDown, Send, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { privacyCash } from '../services/privacy';

interface WithdrawalHistory {
  id: string;
  amount: number;
  currency: string;
  recipientAddress: string;
  txSignature: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}

interface WithdrawFundsProps {
  totalRevenue: number;
  currency?: 'SOL' | 'USDC' | 'USDT';
}

export default function WithdrawFunds({ totalRevenue = 0, currency = 'SOL' }: WithdrawFundsProps) {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [amount, setAmount] = useState<number>(0);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([]);

  useEffect(() => {
    if (wallet.publicKey) {
      setRecipientAddress(wallet.publicKey.toBase58());
      loadWithdrawalHistory();
    }
  }, [wallet.publicKey]);

  const loadWithdrawalHistory = () => {
    try {
      const stored = localStorage.getItem('ghost_commerce_withdrawal_history');
      if (stored) {
        setWithdrawalHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load withdrawal history', e);
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
        const newWithdrawal: WithdrawalHistory = {
          id: Date.now().toString(),
          amount,
          currency,
          recipientAddress,
          txSignature: result.txSignature,
          status: 'completed',
          timestamp: new Date().toISOString(),
        };

        const updated = [newWithdrawal, ...withdrawalHistory];
        setWithdrawalHistory(updated);
        localStorage.setItem('ghost_commerce_withdrawal_history', JSON.stringify(updated));

        toast.success('Withdrawal successful!');
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
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="border-b border-border-color">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                navigate('/dashboard');
                setTimeout(() => {
                  const settingsTab = Array.from(document.querySelectorAll('button')).find(btn => 
                    btn.textContent?.includes('Settings')
                  );
                  if (settingsTab) (settingsTab as HTMLElement).click();
                }, 100);
              }}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Settings</span>
            </button>
            <h1 className="text-xl font-semibold">Withdraw Funds</h1>
            <div className="w-24" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Balance Card */}
        <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-200 shadow-sm">
          <p className="text-sm font-bold text-gray-900 mb-2">Available Balance</p>
          <p className="text-5xl font-bold text-gray-900 mb-6">
            {totalRevenue.toFixed(4)} <span className="text-2xl font-semibold text-gray-700">{currency}</span>
          </p>
          <p className="text-sm font-semibold text-gray-700">
            Total revenue from all sales. Request withdrawal to your Solana wallet.
          </p>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-card-bg rounded-2xl p-8 border border-border-color mb-8">
          <h2 className="text-xl font-semibold mb-6">Request Withdrawal</h2>

          <div className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="label">Amount ({currency})</label>
              <div className="relative">
                <input
                  type="number"
                  className="input w-full text-lg pr-20"
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
                  Minimum withdrawal: 0.01 {currency}
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(totalRevenue)}
                  className="text-primary hover:text-primary-400 font-medium"
                >
                  Max
                </button>
              </div>
            </div>

            {/* SOL Address */}
            <div>
              <label className="label">SOL Address</label>
              <input
                type="text"
                className="input w-full font-mono text-sm"
                placeholder="Your Solana wallet address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                Defaults to your connected wallet. Funds will be sent via Privacy Cash for anonymity.
              </p>
            </div>

            {/* Withdraw Button */}
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || amount <= 0 || amount > totalRevenue}
              className="w-full py-4 text-base font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#10B981] hover:bg-[#059669] text-white shadow-sm hover:shadow-md flex items-center justify-center gap-3"
            >
              {withdrawing ? (
                <>
                  <div className="spinner w-5 h-5" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Request Withdrawal
                </>
              )}
            </button>

            {/* Info Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-400 mb-1">Processing Time</p>
                  <p className="text-gray-300">
                    Withdrawals are processed instantly using Privacy Cash. The transaction will appear in your wallet within seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-card-bg rounded-2xl p-8 border border-border-color">
          <h2 className="text-xl font-semibold mb-6">Withdrawal History</h2>

          {withdrawalHistory.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">No withdrawal requests yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Your withdrawal history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawalHistory.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 bg-dark-light rounded-xl border border-border-color hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      {withdrawal.status === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-primary" />
                      ) : withdrawal.status === 'pending' ? (
                        <Clock className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {withdrawal.amount.toFixed(4)} {withdrawal.currency}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(withdrawal.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        withdrawal.status === 'completed' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : withdrawal.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {withdrawal.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {withdrawal.status === 'pending' && <Clock className="w-3 h-3" />}
                        {withdrawal.status === 'failed' && <XCircle className="w-3 h-3" />}
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </span>
                    </div>
                    {withdrawal.status === 'completed' && (
                      <a
                        href={`https://solscan.io/tx/${withdrawal.txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-400 transition-colors"
                        title="View transaction"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact support at{' '}
            <a href="mailto:support@ghostcommerce.com" className="text-primary hover:text-primary-400">
              support@ghostcommerce.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}