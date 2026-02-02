import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Store, Palette, Link as LinkIcon, Save, Edit, ChevronRight, TrendingDown, CreditCard } from 'lucide-react';
import type { Storefront } from '../../types';
import { storefrontAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../../utils/helpers';
import { hasStoredCard } from '../../utils/cardStorage';

interface SettingsProps {
  storefront: Storefront;
  walletAddress: string;
  onUpdate: () => void;
}

function Settings({ storefront, walletAddress, onUpdate }: SettingsProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    storeName: storefront.storeName,
    description: storefront.description || '',
    primaryColor: storefront.theme.primaryColor,
  });
  const [saving, setSaving] = useState(false);
  const [editingStore, setEditingStore] = useState(false);

  const hasCard = hasStoredCard();

  const storeUrl = `${window.location.origin}/store/${storefront.storeId}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.storeName.trim()) {
      toast.error('Store name is required');
      return;
    }

    setSaving(true);

    try {
      const response = await storefrontAPI.update(storefront.storeId, {
        ...formData,
        walletAddress,
      });

      if (response.success) {
        toast.success('Settings updated successfully!');
        setEditingStore(false);
        onUpdate();
      } else {
        toast.error(response.error || 'Failed to update settings');
      }
    } catch (error: any) {
      console.error('Update settings error:', error);
      toast.error(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(storeUrl);
    if (success) {
      toast.success('Store URL copied to clipboard!');
    } else {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Store Settings</h2>
      </div>

      {/* Store URL Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <LinkIcon className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-2 text-primary">Your Store URL</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-dark/50 rounded-lg px-4 py-3 overflow-x-auto scrollbar-hide border border-primary/10">
                {storeUrl}
              </code>
              <button
                onClick={handleCopyUrl}
                className="btn-primary btn-sm whitespace-nowrap"
              >
                Copy URL
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Share this URL with your customers to direct them to your store
            </p>
          </div>
        </div>
      </div>

      {/* Manage Earnings Section */}
      <div className="bg-card-bg rounded-2xl border border-border-color overflow-hidden">
        <div className="p-6 border-b border-border-color">
          <h3 className="text-xl font-bold">Manage Earnings</h3>
          <p className="text-sm text-gray-400 mt-1">
            Withdraw your earnings or convert to a virtual card
          </p>
        </div>

        {/* Balance Display */}
        <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
          <p className="text-sm font-bold text-gray-900 mb-2">Available Balance</p>
          <p className="text-5xl font-bold text-gray-900 mb-2">
            {storefront.stats.totalRevenue.toFixed(4)}{' '}
            <span className="text-2xl font-semibold text-gray-700">SOL</span>
          </p>
          <p className="text-sm font-semibold text-gray-700">
            Total revenue from all sales
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          {/* View Virtual Card */}
          {hasCard && (
            <button
              onClick={() => navigate('/card')}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-base">
                    View Virtual Card
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    Manage your card and transactions
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </button>
          )}

          {/* Get Virtual Card */}
          {!hasCard && (
            <button
              onClick={() => navigate('/card/new')}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-base">
                    Get Virtual Card
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    Convert earnings to a Visa/Mastercard
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </button>
          )}

          {/* Withdraw Funds */}
          <button
            onClick={() => navigate('/withdraw')}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-base">
                  Withdraw Funds
                </p>
                <p className="text-sm font-medium text-gray-700">
                  Send SOL to your wallet
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* Store Information */}
      <div className="bg-card-bg rounded-2xl border border-border-color overflow-hidden">
        <div className="p-6 border-b border-border-color flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Store Information
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Manage your store details and appearance
            </p>
          </div>
          {!editingStore && (
            <button
              onClick={() => setEditingStore(true)}
              className="btn-secondary btn-sm flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <div className="p-6">
          {!editingStore ? (
            /* View Mode */
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Store Name</p>
                <p className="text-lg font-semibold">{storefront.storeName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-300">{storefront.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Brand Color</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl border-2 border-white/20 shadow-lg"
                    style={{ backgroundColor: storefront.theme.primaryColor }}
                  />
                  <span className="font-mono text-sm text-gray-400">{storefront.theme.primaryColor}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Connected Wallet</p>
                <code className="text-xs bg-dark px-3 py-2 rounded-lg block break-all border border-border-color">
                  {walletAddress}
                </code>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label label-required">Store Name</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="My Awesome Store"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.storeName.length}/100 characters
                </p>
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  className="textarea w-full"
                  placeholder="Tell buyers about your store..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div>
                <label className="label">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Brand Color
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    className="w-20 h-20 rounded-xl cursor-pointer border-2 border-primary/20 shadow-lg"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Choose your store's theme color
                    </p>
                    <p className="text-xs font-mono text-gray-500">{formData.primaryColor}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStore(false);
                    setFormData({
                      storeName: storefront.storeName,
                      description: storefront.description || '',
                      primaryColor: storefront.theme.primaryColor,
                    });
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="spinner w-5 h-5" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" />
                      Save Changes
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card-bg rounded-2xl border border-red-500/20 overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 text-red-400">Danger Zone</h3>
          <p className="text-sm text-gray-400 mb-4">
            Deactivating your store will hide it from public view. You can reactivate it anytime.
          </p>
          <button
            type="button"
            className="btn-secondary text-red-400 hover:bg-red-500/10 border-red-500/20"
            onClick={() => toast.error('Feature coming soon')}
          >
            Deactivate Store
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;