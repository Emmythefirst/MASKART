import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { orderAPI } from '../../services/api';
import { useWallet } from '@solana/wallet-adapter-react';

type Props = {
  orderId: string;
};

export default function EscrowControls({ orderId }: Props) {
  const { publicKey } = useWallet();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const resp = await orderAPI.getById(orderId);
      if (resp.success) setOrder(resp.data);
    } catch (e) {
      console.error('Failed to load order', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!publicKey) return toast.error('Connect wallet');
    setBusy(true);
    try {
      const resp = await orderAPI.confirm(orderId, publicKey.toBase58());
      if (resp.success) {
        toast.success('Escrow released');
        await loadOrder();
      } else {
        toast.error(resp.error || 'Failed to confirm');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Confirm failed');
    } finally { setBusy(false); }
  };

  const handleDispute = async () => {
    if (!publicKey) return toast.error('Connect wallet');
    setBusy(true);
    try {
      const resp = await orderAPI.dispute(orderId, publicKey.toBase58(), 'Buyer opened dispute');
      if (resp.success) {
        toast.success('Dispute opened');
        await loadOrder();
      } else {
        toast.error(resp.error || 'Failed to open dispute');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Dispute failed');
    } finally { setBusy(false); }
  };

  const handleMarkFile = async () => {
    setBusy(true);
    try {
      const resp = await orderAPI.markFileAvailable(orderId);
      if (resp.success) {
        toast.success('Marked file available');
        await loadOrder();
      } else {
        toast.error(resp.error || 'Failed to mark file');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed');
    } finally { setBusy(false); }
  };

  const handleGetKey = async () => {
    if (!publicKey) return toast.error('Connect wallet');
    setBusy(true);
    try {
      const resp = await orderAPI.getById(orderId);
      if (!resp.success || !resp.data) return toast.error('Failed to load order');
      if (!resp.data.keyReleased) return toast.error('Key not released yet');
      const keyResp = await (await import('../../services/api')).keyAPI.getKey(orderId);
      if (keyResp.success && keyResp.data) {
        const cid = keyResp.data.encryptedKeyCid;
        toast.success('Retrieved key CID');
        // show CID in UI
        setOrder((prev: any) => ({ ...prev, encryptedKeyCid: cid }));
      } else {
        toast.error(keyResp.error || 'Failed to fetch key');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to fetch key');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="p-4">Loading escrow...</div>;
  if (!order) return <div className="p-4">Order not found</div>;

  const IS_DEMO = true

  return (
    <div className="card p-4">
      <h4 className="font-semibold mb-2">Escrow Status</h4>
      <div className="mb-3 text-sm text-gray-300">State: <strong className="ml-2">{order.escrowState}</strong></div>

      {/* ✅ DEMO MODE: Show demo notice instead of buttons */}
      {IS_DEMO && order.escrowState === 'ESCROW_RELEASED' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-400 font-semibold">
            ✓ Demo Mode Active
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Escrow auto-released. Download ready!
          </p>
        </div>
      )}

      {order.releaseAt && (
        <div className="mb-3 text-sm text-gray-300">Auto-release at: <strong className="ml-2">{new Date(order.releaseAt).toLocaleString()}</strong></div>
      )}

      {order.encryptedKeyCid && (
        <div className="mb-3 text-sm text-gray-300">Encrypted Key: <code className="block break-all bg-black/20 p-2 mt-2">{order.encryptedKeyCid}</code></div>
      )}

      {/* Only show buttons in production */}
      {!IS_DEMO && (
      <div className="flex gap-2">
        <button onClick={handleConfirm} disabled={busy} className="btn-primary">Confirm (Buyer)</button>
        <button onClick={handleDispute} disabled={busy} className="btn-secondary">Dispute</button>
        <button onClick={handleMarkFile} disabled={busy} className="btn-outline">Mark File Available (Seller)</button>
        <button onClick={handleGetKey} disabled={busy} className="btn-ghost">Get Decryption Key</button>
      </div>
      )}
    </div>
  );
}
