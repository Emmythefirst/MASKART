import { Eye, Package } from 'lucide-react';

interface StorefrontPreviewProps {
  storeName: string;
  description: string;
  primaryColor: string;
}

function StorefrontPreview({ storeName, description, primaryColor }: StorefrontPreviewProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
        <Eye className="w-4 h-4" />
        <span>Preview</span>
      </div>

      <div className="bg-dark rounded-xl p-6 border border-primary/10">
        {/* Store Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: primaryColor }}
          >
            {storeName}
          </h1>
          <p className="text-gray-400">{description}</p>
        </div>

        {/* Mock Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-dark-lighter rounded-lg p-3">
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>0</p>
            <p className="text-xs text-gray-500">Products</p>
          </div>
          <div className="bg-dark-lighter rounded-lg p-3">
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>0</p>
            <p className="text-xs text-gray-500">Sales</p>
          </div>
          <div className="bg-dark-lighter rounded-lg p-3">
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>0</p>
            <p className="text-xs text-gray-500">Revenue</p>
          </div>
        </div>

        {/* Mock Product Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Products</h2>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-dark-lighter rounded-lg overflow-hidden">
                <div className="aspect-video bg-dark flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-600" />
                </div>
                <div className="p-3">
                  <div className="h-3 bg-dark rounded mb-2" />
                  <div className="h-2 bg-dark rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-xs text-gray-400">
            This is how your storefront will look to buyers. 
            Add products to make it come alive! 🎨
          </p>
        </div>
      </div>
    </div>
  );
}

export default StorefrontPreview;