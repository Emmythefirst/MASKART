// client/src/pages/CardPurchasePage.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CardPurchase from '../components/seller/CardPurchase';
import { hasStoredCard } from '../utils/cardStorage';
import toast from 'react-hot-toast';

export default function CardPurchasePage() {
  const navigate = useNavigate();

  // Block if card already exists
  useEffect(() => {
    if (hasStoredCard()) {
      console.log('🚫 Card already exists, redirecting to /card');
      toast.error('You already have a virtual card');
      navigate('/card', { replace: true });
    }
  }, [navigate]);

  const handleCardCreated = (order: any) => {
    console.log('✅ Card created successfully:', order.orderId);
    
    // Show success message
    toast.success('🎉 Virtual card created!');
    
    // ✅ LONGER DELAY to ensure localStorage is fully committed
    setTimeout(() => {
      console.log('🔀 Redirecting to /card');
      
      // Double-check card is in storage before redirecting
      const stored = localStorage.getItem('ghost_commerce_card_orders');
      console.log('📦 Cards in storage:', stored ? JSON.parse(stored).length : 0);
      
      navigate('/card', { replace: true });
    }, 1500); // ✅ Increased to 1.5 seconds
  };

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
            <h1 className="text-xl font-bold">Get Virtual Card</h1>
            <div className="w-32" /> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <CardPurchase
          availableBalance={0}
          onClose={() => navigate('/dashboard')}
          onCardCreated={handleCardCreated}
        />
      </div>
    </div>
  );
}