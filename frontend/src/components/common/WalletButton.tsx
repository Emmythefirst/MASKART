// WalletButton: lightweight wrapper around wallet-adapter UI
// - When not connected, shows the standard `WalletMultiButton`.
// - When connected, shows a short address and opens a dropdown with full address,
//   balance and a disconnect action when clicked.
// - Polls the connection for balance updates every 15 seconds while connected.
import { useEffect, useRef, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function WalletButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: any;

    // Fetch wallet SOL balance and convert lamports => SOL
    async function fetchBalance() {
      if (!publicKey) return;
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!mounted) return;
        setBalance(lamports / 1e9);
      } catch (_err) {
        // ignore
      }
    }

    if (connected && publicKey) {
      fetchBalance();
      intervalId = setInterval(fetchBalance, 15_000);
    } else {
      setBalance(null);
    }

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [connected, publicKey, connection]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const shortAddr = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : '';

  if (!connected) {
    return (
      <div>
       <WalletMultiButton />
       </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      {/* Button - DARKER GREEN */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm shadow-sm transition-all"
      >
        <span className="font-mono">{shortAddr}</span>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown - BLACK TEXT */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden">
          <div className="p-4">
            <div className="text-xs font-semibold text-gray-500 mb-2">WALLET ADDRESS</div>
            <div className="font-mono text-sm font-bold text-gray-900 break-all mb-4">
              {publicKey?.toBase58()}
            </div>
            <div className="text-xs font-semibold text-gray-500 mb-2">BALANCE</div>
            <div className="text-2xl font-bold text-gray-900">
              {balance !== null ? `${balance.toFixed(6)} SOL` : 'Loading...'}
            </div>
          </div>
          <div className="border-t border-gray-200" />
          <button
            onClick={async () => {
              setOpen(false);
              try {
                await disconnect();
              } catch (_e) {
                // ignore
              }
            }}
            className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}

export default WalletButton;