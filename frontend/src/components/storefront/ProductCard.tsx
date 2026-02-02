import { Link } from 'react-router-dom';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/product/${product.productId}`}
      className="card-hover group"
    >
      <div className="aspect-video bg-dark-lighter rounded-lg mb-4 overflow-hidden">
        <img
          src={`${import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${product.coverImage}`}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x225?text=No+Image';
          }}
        />
      </div>
      
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
        {product.title}
      </h3>
      
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {product.description}
      </p>
      
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold gradient-text">
          {product.price} {product.currency}
        </span>
        <span className="badge badge-primary capitalize">
          {product.category}
        </span>
      </div>
      
      <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between text-sm text-gray-500">
        <span className="flex items-center gap-1">
          👁️ {product.stats.views}
        </span>
        <span className="flex items-center gap-1">
          💰 {product.stats.sales} sales
        </span>
      </div>
    </Link>
  );
}

export default ProductCard;