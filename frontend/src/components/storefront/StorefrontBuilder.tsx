import { useState } from 'react';
import { Store, Palette, FileText } from 'lucide-react';
import StorefrontPreview from './StorefrontPreview';

interface StorefrontBuilderProps {
  onSubmit: (data: {
    storeName: string;
    description: string;
    primaryColor: string;
  }) => Promise<void>;
  loading?: boolean;
}

function StorefrontBuilder({ onSubmit, loading = false }: StorefrontBuilderProps) {
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    primaryColor: '#8B5CF6',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    } else if (formData.storeName.length < 2) {
      newErrors.storeName = 'Store name must be at least 2 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Form */}
      <div>
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            Store Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Name */}
            <div>
              <label className="label label-required">Store Name</label>
              <input
                type="text"
                className={`input w-full ${errors.storeName ? 'input-error' : ''}`}
                placeholder="My Awesome Store"
                value={formData.storeName}
                onChange={(e) => {
                  setFormData({ ...formData, storeName: e.target.value });
                  setErrors({ ...errors, storeName: '' });
                }}
                maxLength={100}
              />
              {errors.storeName && (
                <p className="text-red-400 text-sm mt-1">{errors.storeName}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.storeName.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="label">
                <FileText className="w-4 h-4 inline mr-1" />
                Description (Optional)
              </label>
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

            {/* Theme Color */}
            <div>
              <label className="label">
                <Palette className="w-4 h-4 inline mr-1" />
                Brand Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  className="w-20 h-20 rounded-lg cursor-pointer border-2 border-primary/20 hover:border-primary/40 transition-colors"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2">
                    Choose a color that represents your brand
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono">
                      {formData.primaryColor}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, primaryColor: '#8B5CF6' })}
                      className="text-xs text-primary hover:text-primary-400"
                    >
                      Reset to default
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Toggle */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="btn-secondary w-full"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn-primary w-full">
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
        </div>
      </div>

      {/* Preview */}
      <div className={`${showPreview ? 'block' : 'hidden lg:block'}`}>
        <div className="sticky top-4">
          <StorefrontPreview
            storeName={formData.storeName || 'Your Store Name'}
            description={formData.description || 'Your store description will appear here...'}
            primaryColor={formData.primaryColor}
          />
        </div>
      </div>
    </div>
  );
}

export default StorefrontBuilder;