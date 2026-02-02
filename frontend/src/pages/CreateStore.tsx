// CreateStore page: UI for creating a new storefront.
// - Requires a connected wallet. On success, it dispatches `storefront:changed`
//   so other components (Navbar/Home) can refresh their state.
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { storefrontAPI } from '../services/api';

function CreateStore() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    primaryColor: '#8B5CF6'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.storeName.trim()) {
      toast.error('Store name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await storefrontAPI.create({
        storeName: formData.storeName,
        description: formData.description,
        walletAddress: publicKey.toBase58(),
        primaryColor: formData.primaryColor
      });

      if (response.success) {
        toast.success('Store created successfully!');
        // notify other components (Navbar, Home) that the storefront changed
        try {
          window.dispatchEvent(new Event('storefront:changed'));
        } catch (_e) {
          // ignore in non-browser environments
        }
        navigate(`/store/${response.data?.storeId}`);
      } else {
        toast.error(response.error || 'Failed to create store');
      }
    } catch (error: any) {
      console.error('Create store error:', error);
      toast.error(error.response?.data?.error || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="container-custom py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Create Your Store</h1>
          <p className="text-gray-400 mb-8">
            Set up your anonymous storefront in seconds. No KYC required.
          </p>

          {!connected ? (
            <div className="card text-center py-12">
              <p className="text-gray-400 mb-6">Connect your wallet to create a store</p>
              <WalletMultiButton />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card">
              <div className="mb-6">
                <label className="label label-required">Store Name</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="My Awesome Store"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  maxLength={100}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  {formData.storeName.length}/100 characters
                </p>
              </div>

              <div className="mb-6">
                <label className="label">Description (Optional)</label>
                <textarea
                  className="textarea w-full"
                  placeholder="Tell buyers about your store..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div className="mb-6">
                <label className="label">Brand Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-primary/20"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                  <div>
                    <p className="text-sm text-gray-400">Choose your store's theme color</p>
                    <p className="text-xs text-gray-500 font-mono">{formData.primaryColor}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400 mb-2">📍 Connected Wallet:</p>
                <p className="text-sm font-mono text-primary break-all">
                  {publicKey?.toBase58()}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner w-5 h-5" />
                    Creating Store...
                  </span>
                ) : (
                  'Create Store'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
  );
}

export default CreateStore;