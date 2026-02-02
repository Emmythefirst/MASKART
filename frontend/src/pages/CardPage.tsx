// client/src/pages/CardPage.tsx
// Key changes: Use cardStorage helper, redirect to /card/new if no card

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  CreditCard, Eye, EyeOff, Copy, TrendingUp, TrendingDown,
  ArrowLeft, RefreshCw, AlertCircle, Plus, Minus,
  ShoppingCart, CheckCircle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../utils/helpers';
import { getStoredCards, getLatestCard, clearCards } from '../utils/cardStorage';
import Modal from '../components/common/Modal';
import { cardAPI } from '../services/api';

interface Transaction {
  transactionId: string;
  type: 'topup' | 'withdrawal' | 'purchase';
  merchant?: string;
  amount: number;
  status: 'completed' | 'failed' | 'pending';
  createdAt: string;
}

export default function CardPage() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  const [cardBalance, setCardBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [topUpLoading, setTopUpLoading] = useState(false);
  
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    // ✅ Wait a bit to ensure localStorage is ready
    const initTimer = setTimeout(() => {
      loadCard();
      setInitializing(false);
    }, 500); // 500ms delay on initial load
    
    return () => clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (!initializing && !selectedCard) {
      // Poll localStorage for card updates
      const interval = setInterval(() => {
        const latestCard = getLatestCard();
        if (latestCard && latestCard.card && (!selectedCard || !selectedCard.card)) {
          console.log('🔄 Card details updated, reloading...');
          loadCard();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [initializing, selectedCard]);

  useEffect(() => {
    if (selectedCard) {
      loadCardData();
    }
  }, [selectedCard?.orderId]);

  const loadCard = () => {
    console.log('📦 Loading card from localStorage...');
    const cards = getStoredCards();
    
    console.log('📊 Found cards:', cards.length);

    // No card? Redirect to purchase page
    if (cards.length === 0) {
      console.log('❌ No card found, redirecting to /card/new');
      toast.error('No virtual card found');
      navigate('/card/new', { replace: true });
      return;
    }

    const latestCard = cards[cards.length - 1];
    setSelectedCard(latestCard);
    console.log('✅ Loaded card:', latestCard.orderId);
    console.log('🃏 Card has details?', !!latestCard.card);
  };

  const loadCardData = async (showRefreshAnimation = false) => {
    if (!selectedCard) return;

    if (showRefreshAnimation) {
      setIsRefreshing(true);
    } else {
      setLoadingData(true);
    }

    try {
      console.log('🔍 Loading card data for:', selectedCard.orderId);
      
      const balanceRes = await cardAPI.getBalance(selectedCard.orderId);
      if (balanceRes.success && balanceRes.data) {
        console.log('💰 Balance:', balanceRes.data.balance);
        setCardBalance(balanceRes.data.balance);
      } else {
        console.warn('⚠️ Balance not available yet');
        // Don't show error for mock cards that might not have backend data yet
        if (!selectedCard.isMock) {
          toast.error('Could not load balance');
        }
      }

      const txRes = await cardAPI.getTransactions(selectedCard.orderId, 50);
      if (txRes.success && txRes.data) {
        console.log('📊 Transactions:', txRes.data.length);
        setTransactions(txRes.data);
      }
    } catch (error: any) {
      console.error('❌ Failed to load card data:', error);
      
      // Only redirect if 404 and not a mock card
      if (error.response?.status === 404 && !selectedCard.isMock) {
        toast.error('Card no longer exists in backend');
        clearCards();
        navigate('/card/new', { replace: true });
      } else if (selectedCard.isMock) {
        // Mock cards might not have backend data yet - that's okay
        console.log('ℹ️ Mock card - backend data not required');
      }
    } finally {
      if (showRefreshAnimation) {
        setTimeout(() => {
          setIsRefreshing(false);
          toast.success('Card data refreshed');
        }, 500);
      } else {
        setLoadingData(false);
      }
    }
  };

  const handleTopUp = async () => {
    if (!wallet.publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (topUpAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setTopUpLoading(true);

    try {
      const response = await cardAPI.topUp(
        selectedCard.orderId, 
        topUpAmount, 
        wallet.publicKey.toBase58()
      );

      if (response.success) {
        toast.success(`Successfully added $${topUpAmount.toFixed(2)} to your card!`);
        await loadCardData();
        setShowTopUp(false);
        setTopUpAmount(0);
      } else {
        toast.error(response.error || 'Top up failed');
      }
    } catch (error: any) {
      console.error('Top up error:', error);
      toast.error(error.response?.data?.error || 'Top up failed. Please try again.');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet.publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > cardBalance) {
      toast.error('Insufficient card balance');
      return;
    }

    setWithdrawLoading(true);

    try {
      const response = await cardAPI.withdraw(
        selectedCard.orderId,
        withdrawAmount,
        wallet.publicKey.toBase58()
      );

      if (response.success) {
        toast.success(`Successfully withdrew $${withdrawAmount.toFixed(2)}!`);
        await loadCardData();
        setShowWithdraw(false);
        setWithdrawAmount(0);
      } else {
        toast.error(response.error || 'Withdrawal failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.response?.data?.error || 'Withdrawal failed. Please try again.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleMockPurchase = async () => {
    try {
      const merchants = ['CODECADEMY USA', 'NETFLIX', 'SPOTIFY', 'AMAZON.COM', 'STEAM GAMES'];
      const amounts = [14.99, 9.99, 19.99, 24.99, 29.99];
      
      const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
      const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
      const status = Math.random() > 0.8 ? 'failed' : 'completed';

      const response = await cardAPI.mockPurchase(
        selectedCard.orderId,
        randomMerchant,
        randomAmount,
        status
      );

      if (response.success) {
        if (status === 'failed') {
          toast.error(`Purchase declined: Insufficient balance`);
        } else {
          toast.success(`Purchase completed: -$${randomAmount.toFixed(2)} at ${randomMerchant}`);
        }
        await loadCardData();
      }
    } catch (error) {
      toast.error('Failed to create mock purchase');
    }
  };

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success(`${label} copied!`);
    }
  };

  const handleDeleteCard = () => {
    if (confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      console.log('🗑️ Deleting card:', selectedCard.orderId);
      
      clearCards();
      toast.success('Card deleted successfully');
      
      // Redirect to purchase page
      navigate('/card/new', { replace: true });
    }
  };

  // ✅ Show loading state while initializing
  if (initializing || !selectedCard) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-400">Loading your card...</p>
        </div>
      </div>
    );
  }

  const cardTypeColor = selectedCard.cardType === 'visa' 
    ? 'from-blue-600/30 to-blue-800/30' 
    : 'from-orange-500/30 to-red-600/30';
  const cardTypeBorder = selectedCard.cardType === 'visa' 
    ? 'border-blue-500/40' 
    : 'border-orange-500/40';

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="border-b border-dark-light">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold">Virtual Card</h1>
            <div className="w-32" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Card Balance */}
        <div className="card bg-gradient-to-br from-dark-light to-dark border-primary/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm text-gray-400">Card Balance</h3>
              <button 
                onClick={() => setHideBalance(!hideBalance)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button 
              onClick={() => { 
                loadCard(); 
                loadCardData(true);
              }}
              disabled={isRefreshing}
              className="p-2 hover:bg-dark-light rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="text-4xl font-bold mb-6">
            {hideBalance ? '••••••' : `$${cardBalance.toFixed(2)}`}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setShowTopUp(true)}
              className="btn-primary py-3 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Top Up
            </button>
            <button 
              onClick={() => setShowWithdraw(true)}
              className="btn-secondary py-3 flex items-center justify-center gap-2"
            >
              <Minus className="w-4 h-4" />
              Withdraw
            </button>
          </div>
        </div>

        {/* Development Mode Notice */}
        {selectedCard.isMock && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-400 mb-1">Development Mode</p>
                <p className="text-xs text-gray-400 mb-3">
                  This is a mock card for testing. In production, you'll receive a real virtual card from Starpay.
                </p>
                <button
                  onClick={handleMockPurchase}
                  className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded transition-colors"
                >
                  🎭 Simulate Card Purchase
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card Display */}
        <div className={`relative bg-gradient-to-br ${cardTypeColor} border ${cardTypeBorder} rounded-2xl p-6 mb-6 overflow-hidden`}>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                <span className="font-semibold">Ghost Commerce</span>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                Active
              </span>
            </div>

            <div className="mb-8">
              <p className="text-xs text-gray-400 mb-2">Card Number</p>
              <p className="text-2xl font-mono tracking-wider">
                {showDetails 
                  ? (selectedCard.card?.number || '**** **** **** ****')
                  : '**** **** **** ' + (selectedCard.card?.number?.slice(-4) || '****')
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Expiry</p>
                <p className="text-lg font-mono">
                  {showDetails ? (selectedCard.card?.expiry || '**/**') : '**/**'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">CVV</p>
                <p className="text-lg font-mono">
                  {showDetails ? (selectedCard.card?.cvv || '***') : '***'}
                </p>
              </div>
            </div>

            <div className="absolute bottom-6 right-6">
              <div className="flex gap-2">
                {selectedCard.cardType === 'mastercard' && (
                  <>
                    <div className="w-10 h-10 rounded-full bg-red-500 opacity-80" />
                    <div className="w-10 h-10 rounded-full bg-yellow-500 opacity-80 -ml-6" />
                  </>
                )}
                {selectedCard.cardType === 'visa' && (
                  <div className="px-3 py-1 bg-white/10 rounded text-xl font-bold tracking-wider">
                    VISA
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
          >
            {showDetails ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Details
              </>
            )}
          </button>
        </div>

        {showDetails && selectedCard.card && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">Card Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-dark rounded-lg">
                <span className="text-sm text-gray-400">Card Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{selectedCard.card.number}</span>
                  <button
                    onClick={() => handleCopy(selectedCard.card.number, 'Card number')}
                    className="p-1 hover:bg-dark-light rounded"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark rounded-lg">
                <span className="text-sm text-gray-400">CVV</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{selectedCard.card.cvv}</span>
                  <button
                    onClick={() => handleCopy(selectedCard.card.cvv, 'CVV')}
                    className="p-1 hover:bg-dark-light rounded"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-dark rounded-lg">
                <span className="text-sm text-gray-400">Expiry</span>
                <span className="font-mono text-sm">{selectedCard.card.expiry}</span>
              </div>
            </div>
          </div>
        )}

        {showDetails && !selectedCard.card && (
          <div className="card mb-6 bg-yellow-500/10 border-yellow-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="font-semibold text-yellow-400 mb-1">Card Details Not Available</p>
                <p className="text-sm text-gray-400">
                  Card details are still being generated. Please wait and refresh.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Order Information</h3>
            <button
              onClick={handleDeleteCard}
              className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Delete Card
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Order ID</span>
              <span className="font-mono">{selectedCard.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Card Value</span>
              <span className="font-semibold">${selectedCard.amount} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Card Type</span>
              <span className="capitalize">{selectedCard.cardType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span>{new Date(selectedCard.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="card">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          
          {loadingData ? (
            <div className="text-center py-8">
              <div className="spinner w-8 h-8 mx-auto" />
              <p className="text-sm text-gray-500 mt-3">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.transactionId} className="flex items-center justify-between p-3 bg-dark rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tx.type === 'topup' ? 'bg-green-500/20' :
                      tx.type === 'withdrawal' ? 'bg-blue-500/20' :
                      'bg-gray-500/20'
                    }`}>
                      {tx.type === 'topup' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : tx.type === 'withdrawal' ? (
                        <TrendingDown className="w-5 h-5 text-blue-400" />
                      ) : (
                        <ShoppingCart className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.merchant}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.amount > 0 ? 'text-green-400' : 'text-white'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {tx.status === 'completed' ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : tx.status === 'failed' ? (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showTopUp} onClose={() => setShowTopUp(false)} title="Top Up Card" size="md">
        <div className="space-y-6">
          <div>
            <label className="label">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                className="input w-full pl-8"
                placeholder="0.00"
                value={topUpAmount || ''}
                onChange={(e) => setTopUpAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <button
            onClick={handleTopUp}
            disabled={topUpLoading || topUpAmount <= 0}
            className="btn-primary w-full py-3"
          >
            {topUpLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner w-5 h-5" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Add ${topUpAmount.toFixed(2)} to Card
              </span>
            )}
          </button>
        </div>
      </Modal>

      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Withdraw from Card" size="md">
        <div className="space-y-6">
          <div>
            <label className="label">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                className="input w-full pl-8"
                placeholder="0.00"
                value={withdrawAmount || ''}
                onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                max={cardBalance}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-500">
                Available: ${cardBalance.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => setWithdrawAmount(cardBalance)}
                className="text-primary hover:text-primary/80"
              >
                Max
              </button>
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={withdrawLoading || withdrawAmount <= 0 || withdrawAmount > cardBalance}
            className="btn-primary w-full py-3"
          >
            {withdrawLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner w-5 h-5" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Minus className="w-5 h-5" />
                Withdraw ${withdrawAmount.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}