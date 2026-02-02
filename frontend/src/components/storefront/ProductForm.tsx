import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import type { CreateProductForm } from '../../types';
import { isValidFileSize, isValidImage } from '../../utils/validation';
import { formatFileSize } from '../../utils/format';
import { PRODUCT_CATEGORIES, CURRENCIES } from '../../utils/constants';

interface ProductFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function ProductForm({ onSubmit, onCancel, loading = false }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductForm>({
    title: '',
    description: '',
    price: 0,
    currency: 'SOL',
    category: 'ebook',
    coverImage: null,
    productFile: null,
  });

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image
    if (!isValidImage(file)) {
      setErrors({ ...errors, coverImage: 'Please select a valid image file (JPG, PNG, GIF, WebP)' });
      return;
    }

    if (!isValidFileSize(file.size, 5)) {
      setErrors({ ...errors, coverImage: 'Image must be less than 5MB' });
      return;
    }

    setFormData({ ...formData, coverImage: file });
    setErrors({ ...errors, coverImage: '' });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidFileSize(file.size, 50)) {
      setErrors({ ...errors, productFile: 'File must be less than 50MB' });
      return;
    }

    setFormData({ ...formData, productFile: file });
    setErrors({ ...errors, productFile: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.coverImage) {
      newErrors.coverImage = 'Cover image is required';
    }

    if (!formData.productFile) {
      newErrors.productFile = 'Product file is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Create FormData
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price.toString());
    data.append('currency', formData.currency);
    data.append('category', formData.category);
    if (formData.coverImage) data.append('coverImage', formData.coverImage);
    if (formData.productFile) data.append('productFile', formData.productFile);

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="label label-required">Product Title</label>
        <input
          type="text"
          className={`input w-full ${errors.title ? 'input-error' : ''}`}
          placeholder="My Awesome Product"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          maxLength={200}
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
        <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
      </div>

      {/* Description */}
      <div>
        <label className="label label-required">Description</label>
        <textarea
          className={`textarea w-full ${errors.description ? 'input-error' : ''}`}
          placeholder="Describe your product in detail..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={2000}
          rows={6}
        />
        {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        <p className="text-xs text-gray-500 mt-1">{formData.description.length}/2000 characters</p>
      </div>

      {/* Price & Currency */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="label label-required">Price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={`input w-full ${errors.price ? 'input-error' : ''}`}
            placeholder="0.00"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          />
          {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
        </div>

        <div>
          <label className="label label-required">Currency</label>
          <select
            className="select w-full"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.value} value={curr.value}>
                {curr.label} ({curr.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="label label-required">Category</label>
        <select
          className="select w-full"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
        >
          {PRODUCT_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Cover Image */}
      <div>
        <label className="label label-required">Cover Image</label>
        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6">
          {coverPreview ? (
            <div className="relative">
              <img
                src={coverPreview}
                alt="Cover preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, coverImage: null });
                  setCoverPreview(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center">
              <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />
              <p className="text-sm text-gray-400 mb-1">Click to upload cover image</p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageChange}
              />
            </label>
          )}
        </div>
        {errors.coverImage && <p className="text-red-400 text-sm mt-1">{errors.coverImage}</p>}
      </div>

      {/* Product File */}
      <div>
        <label className="label label-required">Product File</label>
        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6">
          {formData.productFile ? (
            <div className="flex items-center justify-between bg-dark rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Upload className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">{formData.productFile.name}</p>
                  <p className="text-sm text-gray-400">{formatFileSize(formData.productFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, productFile: null })}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center">
              <Upload className="w-12 h-12 text-gray-500 mb-2" />
              <p className="text-sm text-gray-400 mb-1">Click to upload product file</p>
              <p className="text-xs text-gray-500">Any file type up to 50MB</p>
              <input
                type="file"
                className="hidden"
                onChange={handleProductFileChange}
              />
            </label>
          )}
        </div>
        {errors.productFile && <p className="text-red-400 text-sm mt-1">{errors.productFile}</p>}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="spinner w-5 h-5" />
              Creating...
            </span>
          ) : (
            'Create Product'
          )}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ProductForm;