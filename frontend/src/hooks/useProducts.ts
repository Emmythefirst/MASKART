import { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import type { Product } from '../types';

export function useProducts(storeId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      loadProducts(storeId);
    } else {
      setLoading(false);
    }
  }, [storeId]);

  const loadProducts = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productAPI.getStoreProducts(id);
      
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error || 'Failed to load products');
        setProducts([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (storeId) {
      loadProducts(storeId);
    }
  };

  return { products, loading, error, refresh };
}

export function useProduct(productId?: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    } else {
      setLoading(false);
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productAPI.getById(id);
      
      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        setError(response.error || 'Product not found');
        setProduct(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (productId) {
      loadProduct(productId);
    }
  };

  return { product, loading, error, refresh };
}