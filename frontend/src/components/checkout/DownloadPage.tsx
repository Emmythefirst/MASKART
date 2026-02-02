import { useState, useEffect } from 'react';
import { Download, CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react';
import { formatFileSize } from '../../utils/format';
import toast from 'react-hot-toast';
import { orderAPI, keyAPI } from '../../services/api';

interface DownloadPageProps {
  orderId: string;
  downloadToken: string;
  productTitle: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
}

function DownloadPage({ 
  orderId, 
  downloadToken, 
  productTitle, 
  fileName, 
  fileSize,
  expiresAt 
}: DownloadPageProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [decryptionKey, setDecryptionKey] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    loadOrder();
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [orderId, expiresAt]);

  const loadOrder = async () => {
    try {
      const resp = await orderAPI.getById(orderId);
      if (resp.success && resp.data) {
        setOrder(resp.data);
        
        // If key is released, fetch it
        if (resp.data.keyReleased && resp.data.encryptedKeyCid) {
          await fetchDecryptionKey();
        }
      }
    } catch (err) {
      console.error('Failed to load order', err);
    }
  };

  const fetchDecryptionKey = async () => {
    try {
      const keyResp = await keyAPI.getKey(orderId);
      if (keyResp.success && keyResp.data?.encryptedKeyCid) {
        setDecryptionKey(keyResp.data.encryptedKeyCid);
      }
    } catch (err) {
      console.error('Failed to fetch decryption key', err);
    }
  };

  const updateTimeLeft = () => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft('Expired');
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);

    try {
      toast.loading('Preparing download...', { id: 'download' });

      // ✅ SIMPLE: Just call download endpoint
      const downloadResp = await orderAPI.download(downloadToken);
      
      if (!downloadResp.success) {
        throw new Error(downloadResp.error || 'Download failed');
      }

      console.log('✅ Download response:', downloadResp.data);

      // Mark as downloaded in UI
      setDownloaded(true);
      
      // If there's a download URL, open it
      if (downloadResp.data?.downloadUrl) {
        // Open IPFS link in new tab
        window.open(downloadResp.data.downloadUrl, '_blank');
        toast.success('File opened in new tab!', { id: 'download' });
      } else {
        toast.success('Download complete!', { id: 'download' });
      }

    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Download failed. Please try again.', { id: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Purchase Successful!</h1>
          <p className="text-gray-400">Your download is ready</p>
        </div>

        {/* Order Details */}
        <div className="bg-dark rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-4">Order Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Order ID</span>
              <span className="font-mono">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Product</span>
              <span className="font-semibold">{productTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">File Name</span>
              <span className="font-mono text-xs">{fileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">File Size</span>
              <span>{formatFileSize(fileSize)}</span>
            </div>
            {order?.keyReleased && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className="badge badge-success">Ready to Download</span>
              </div>
            )}
          </div>
        </div>

        {/* Download Expiry Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-400 mb-1">
              Download link expires in {timeLeft}
            </p>
            <p className="text-xs text-gray-400">
              Make sure to download your file before the link expires. You can download it multiple times within this period.
            </p>
          </div>
        </div>

        {/* Key Status */}
        {order && !order.keyReleased && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary mb-1">
                Awaiting Delivery Confirmation
              </p>
              <p className="text-xs text-gray-400">
                The seller needs to upload the file and mark it as available. Once done, you can confirm delivery to release the download.
              </p>
            </div>
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading || timeLeft === 'Expired' || !order?.keyReleased}
          className="btn-primary w-full mb-4 flex items-center justify-center gap-2"
        >
          {downloading ? (
            <>
              <div className="spinner w-5 h-5" />
              Preparing Download...
            </>
          ) : !order?.keyReleased ? (
            <>
              <Lock className="w-5 h-5" />
              Download Locked (Pending Confirmation)
            </>
          ) : downloaded ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Download Again
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download Now
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-primary" />
            Security Notice
          </h3>
          <ul className="space-y-1 text-xs text-gray-400">
            <li>• File is encrypted and decrypted on download</li>
            <li>• No download history is stored</li>
            <li>• Link is time-limited for security</li>
            <li>• Your purchase is completely anonymous</li>
          </ul>
        </div>

        {/* Debug Info (Development Only) */}
        {decryptionKey && import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-dark rounded text-xs">
            <p className="text-gray-500 mb-1">Debug Info (Dev Only):</p>
            <p className="font-mono break-all text-gray-600">Key CID: {decryptionKey}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DownloadPage;