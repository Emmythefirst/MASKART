import { Edit, Trash2, Eye } from 'lucide-react';
import type { Product } from '../../types';
import { formatPrice, formatFileSize } from '../../utils/format';

interface ProductListProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.productId} className="card">
          <div className="aspect-video bg-dark-lighter rounded-lg mb-4 overflow-hidden">
            <img
              src={`https://ipfs.io/ipfs/${product.coverImage}`}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x225?text=No+Image';
              }}
            />
          </div>

          <h3 className="font-semibold mb-2 line-clamp-1">{product.title}</h3>
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{product.description}</p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold gradient-text">
              {formatPrice(product.price, product.currency)}
            </span>
            <span className="badge badge-primary capitalize">{product.category}</span>
          </div>

          <div className="border-t border-primary/10 pt-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Views</p>
                <p className="font-semibold flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {product.stats.views}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Sales</p>
                <p className="font-semibold">{product.stats.sales}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-4">
            {formatFileSize(product.fileSize)} • {product.fileType}
          </div>

          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(product)}
                  className="btn-secondary flex-1 btn-sm flex items-center justify-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(product.productId)}
                  className="btn-secondary btn-sm flex items-center justify-center gap-1 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ProductList;