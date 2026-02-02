import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { CreditCard, Loader, Lock } from 'lucide-react';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { paymentAPI } from '../../services/api';

interface PaymentWidgetProps {
  productId: string;
  amount: number;
  currency: 'SOL' | 'USDC' | 'USDT';
  onSuccess: (orderId: string, downloadToken?: string) => void;
  onError: (error: string) => void;
}

function PaymentWidget({ productId, amount, currency, onSuccess, onError }: PaymentWidgetProps) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, connected, signTransaction } = wallet;
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!connected || !publicKey || !signTransaction) {
      onError('Wallet not connected');
      toast.error('Please connect your wallet');
      return;
    }

    // Only support SOL for now
    if (currency !== 'SOL') {
      toast.error('Only SOL payments are supported currently');
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Create payment intent
      toast.loading('Creating payment intent...', { id: 'payment' });
      
      const intentRes = await paymentAPI.createIntent({
        productId,
        buyerWallet: publicKey.toBase58()
      });

      if (!intentRes || !intentRes.success || !intentRes.data) {
        throw new Error(intentRes?.error || 'Failed to create payment intent');
      }

      const { intentId, recipientAddress, amount: intentAmount } = intentRes.data;

      console.log('Payment intent created:', { intentId, recipientAddress, intentAmount });

      // Step 2: Create Solana transaction
      toast.loading('Preparing transaction...', { id: 'payment' });

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports: Math.floor(intentAmount * LAMPORTS_PER_SOL),
        })
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      console.log('Transaction created, requesting signature...');

      // Step 3: Sign transaction
      toast.loading('Please approve the transaction in your wallet...', { id: 'payment' });
      
      const signedTx = await signTransaction(transaction);

      console.log('Transaction signed');

      // Step 4: Send transaction
      toast.loading('Sending transaction...', { id: 'payment' });

      const txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'finalized',
        maxRetries: 3
      });

      console.log('Transaction sent:', txSignature);

      // Step 5: Confirm transaction
      toast.loading('Confirming transaction...', { id: 'payment' });

      await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      console.log('Transaction confirmed');

      // Step 6: Confirm with backend
      toast.loading('Creating your order...', { id: 'payment' });
      
      const confirmRes = await paymentAPI.confirm({ 
        intentId, 
        txSignature 
      });

      if (!confirmRes || !confirmRes.success || !confirmRes.data) {
        throw new Error(confirmRes?.error || 'Payment confirmation failed');
      }

      console.log('Order created:', confirmRes.data);

      toast.success('Payment successful!', { id: 'payment' });
      // Redirect to download page
      const { orderId, downloadToken } = confirmRes.data;
      window.location.href = `/download/${orderId}/${downloadToken}`;

      // Also call onSuccess callback for parent component
      onSuccess(orderId, downloadToken);

    } catch (error: any) {
      console.error('Payment error:', error);
      
      let errorMessage = 'Payment failed';
      
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance';
      } else if (error.message?.includes('blockhash')) {
        errorMessage = 'Transaction expired, please try again';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'payment' });
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {/* Privacy Notice */}
      <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1 text-primary">🔒 Private & Secure</p>
            <p className="text-xs text-gray-400">
              Payment goes to secure escrow. Your purchase details are completely private - only the payment transaction is public on the blockchain. Seller receives funds anonymously via Privacy Cash.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={!connected || processing}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
      >
        {processing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            🔒 Pay {amount} {currency}
          </>
        )}
      </button>

      <div className="mt-3 p-3 bg-dark-light rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          ✅ Secure escrow protection<br/>
          ✅ Seller paid anonymously<br/>
          ✅ 48-hour download window<br/>
          ✅ Encrypted file delivery
        </p>
      </div>

      {!connected && (
        <p className="text-xs text-red-400 mt-3 text-center">
          Please connect your wallet to continue
        </p>
      )}
    </div>
  );
}

export default PaymentWidget;