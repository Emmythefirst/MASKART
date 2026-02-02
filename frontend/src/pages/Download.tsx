import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { orderAPI, productAPI } from '../services/api';
import DownloadPage from '../components/checkout/DownloadPage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Download() {
  const { orderId, token } = useParams<{ orderId: string; token: string }>();
  const [order, setOrder] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [orderId]);

  const load = async () => {
    try {
      const orderResp = await orderAPI.getById(orderId!);
      if (orderResp.success && orderResp.data) {
        setOrder(orderResp.data);
        const prodResp = await productAPI.getById(orderResp.data.productId);
        if (prodResp.success) setProduct(prodResp.data);
      }
    } catch (err) {
      console.error('Failed to load download', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!order || !product) return <div>Order not found</div>;

  return (
      <div className="container-custom py-12">
        <DownloadPage
          orderId={order.orderId}
          downloadToken={token!}
          productTitle={product.title}
          fileName={product.fileName}
          fileSize={product.fileSize}
          expiresAt={order.expiresAt}
        />
      </div>
  );
}