// Navbar: top navigation used across pages.
// - Shows app logo and routes.
// - Displays Create Store or Seller Dashboard depending on whether
//   the connected wallet already owns a storefront.
// - Orders button is ALWAYS visible when wallet is connected.
// Save this to: src/components/common/Navbar.tsx
import { Link } from 'react-router-dom';
import { ShoppingBag, Home } from 'lucide-react';
import WalletButton from './WalletButton';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { storefrontAPI, orderAPI } from '../../services/api';

interface NavbarProps {
  transparent?: boolean;
}

function Navbar({ transparent = false }: NavbarProps) {
  const { publicKey, connected } = useWallet();
  const [hasStore, setHasStore] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadNavbarData() {
      if (!connected || !publicKey) {
        if (mounted) {
          setHasStore(false);
          setOrderCount(0);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const wallet = publicKey.toBase58();

        const [storeResp, ordersResp] = await Promise.all([
          storefrontAPI.getByWallet(wallet),
          orderAPI.getBuyerOrders(wallet),
        ]);

        if (!mounted) return;

        setHasStore(Boolean(storeResp.success && storeResp.data));

        if (ordersResp.success && ordersResp.data) {
          setOrderCount(ordersResp.data.length);
        } else {
          setOrderCount(0);
        }
      } catch (err) {
        console.error('Navbar load failed:', err);
        if (mounted) {
          setHasStore(false);
          setOrderCount(0);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadNavbarData();

    function onChange() {
      loadNavbarData();
    }

    window.addEventListener('storefront:changed', onChange);
    return () => {
      mounted = false;
      window.removeEventListener('storefront:changed', onChange);
    };
  }, [connected, publicKey]);

  return (
    <nav
      className={`border-b ${
        transparent ? 'border-gray-200' : 'border-gray-200'
      } bg-white`}
    >
      <div className="container-custom py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-[#14B8A6]">
            MasKart
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Connected navigation */}
          {connected && !isLoading && (
            <div className="flex items-center gap-2">
              {/* ✅ CORRECT ORDER: 1. Home, 2. Seller Dashboard, 3. Orders */}
              
              {/* 1. HOME ICON - Always visible when connected */}
              <Link
                to="/"
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all font-medium"
                title="Marketplace"
              >
                <Home className="w-5 h-5" />
              </Link>

              {/* 2. SELLER DASHBOARD - Only visible for sellers */}
              {hasStore && (
                <Link 
                  to="/dashboard" 
                  className="px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium hidden sm:block"
                >
                  Seller Dashboard
                </Link>
              )}

              {/* 3. ORDERS - Always visible when connected */}
              <Link
                to="/orders"
                className="relative px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium hidden sm:flex items-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Orders</span>
                {orderCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#14B8A6] text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {orderCount}
                  </span>
                )}
              </Link>

              {/* Mobile Orders - Always visible on mobile */}
              <Link
                to="/orders"
                className="relative p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all sm:hidden"
                title="Orders"
              >
                <ShoppingBag className="w-5 h-5" />
                {orderCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#14B8A6] text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {orderCount}
                  </span>
                )}
              </Link>

              {/* Create Store Button - Only for non-sellers */}
              {!hasStore && (
                <Link 
                  to="/create-store" 
                  className="px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium hidden sm:block"
                >
                  Create Store
                </Link>
              )}
            </div>
          )}

          {/* Not connected - Show Create Store */}
          {!connected && (
            <Link 
              to="/create-store" 
              className="px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium hidden sm:block"
            >
              Create Store
            </Link>
          )}

          <WalletButton />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;