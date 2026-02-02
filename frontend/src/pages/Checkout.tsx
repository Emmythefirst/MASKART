import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { productAPI } from '../services/api';
import CheckoutPage from '../components/checkout/CheckOutPage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Product } from '../types';

export default function Checkout() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { connected } = useWallet();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected) {
      navigate(`/product/${productId}`);
      return;
    }
    loadProduct();
  }, [productId, connected]);

  const loadProduct = async () => {
    try {
      const resp = await productAPI.getById(productId!);
      if (resp.success && resp.data) {
        setProduct(resp.data);
      }
    } catch (err) {
      console.error('Load product failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (orderId: string, downloadToken: string) => {
    navigate(`/download/${orderId}/${downloadToken}`);
  };

  const handleCancel = () => {
    navigate(`/product/${productId}`);
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!product) return <div>Product not found</div>;

  return (
      <div className="container-custom py-12">
        <CheckoutPage 
          product={product} 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
  );
}