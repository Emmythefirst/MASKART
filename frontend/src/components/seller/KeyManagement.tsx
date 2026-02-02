import { useState } from 'react';
import { Key, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { keyAPI } from '../../services/api';

interface KeyManagementProps {
  orderId: string;
  productId: string;
  encryptedFileHash: string;
  onKeyUploaded?: () => void;
}

export default function KeyManagement({ 
  orderId, 
  productId,
  encryptedFileHash,
  onKeyUploaded 
}: KeyManagementProps) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [keyCid, setKeyCid] = useState<string | null>(null);

  const handleUploadKey = async () => {
    setUploading(true);

    try {
      toast.loading('Generating and uploading encryption key...', { id: 'key-upload' });

      // In production:
      // 1. Retrieve the product's encryption key from secure storage
      // 2. Re-encrypt it with buyer's public key (or use asymmetric encryption)
      // 3. Upload encrypted key to IPFS
      // 4. Store the IPFS CID in the order

      // For MVP, we'll simulate this:
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock CID (in production, this would be real IPFS hash)
      const mockKeyCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      // Upload key CID to backend
      const response = await keyAPI.uploadKey(orderId, mockKeyCid);

      if (response.success) {
        setKeyCid(mockKeyCid);
        setUploaded(true);
        toast.success('Encryption key uploaded successfully!', { id: 'key-upload' });
        onKeyUploaded?.();
      } else {
        throw new Error(response.error || 'Failed to upload key');
      }

      /* Production implementation:
      
      // 1. Get encryption key from product (stored securely)
      const encryptionKey = await getStoredEncryptionKey(productId);
      
      // 2. Encrypt key for buyer (using their wallet public key)
      const { encryptKeyForBuyer } = await import('../../utils/encryption');
      const encryptedKeyData = encryptKeyForBuyer(encryptionKey, buyerPublicKey);
      
      // 3. Upload to IPFS
      const { uploadToIPFS } = await import('../../services/ipfs');
      const keyCid = await uploadToIPFS(encryptedKeyData, `key_${orderId}.enc`);
      
      // 4. Store CID in backend
      await keyAPI.uploadKey(orderId, keyCid);
      */

    } catch (error: any) {
      console.error('Key upload error:', error);
      toast.error(error.message || 'Failed to upload key', { id: 'key-upload' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card bg-primary/10 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Key className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold mb-2">Encryption Key Management</h3>
          
          {uploaded ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Key uploaded successfully</span>
              </div>
              
              {keyCid && (
                <div className="bg-dark rounded p-3">
                  <p className="text-xs text-gray-500 mb-1">IPFS CID:</p>
                  <p className="text-xs font-mono break-all text-gray-300">{keyCid}</p>
                </div>
              )}

              <p className="text-xs text-gray-400">
                The buyer can now decrypt and download the file after confirming delivery.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Upload the encryption key to IPFS to allow the buyer to decrypt the file after purchase confirmation.
              </p>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300">
                  Make sure you have the original encryption key for this product before uploading.
                </p>
              </div>

              <button
                onClick={handleUploadKey}
                disabled={uploading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="spinner w-5 h-5" />
                    Uploading Key...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Encryption Key
                  </>
                )}
              </button>

              <div className="text-xs text-gray-500">
                <p className="font-semibold mb-1">Product Info:</p>
                <p>Product ID: <span className="font-mono">{productId}</span></p>
                <p>Order ID: <span className="font-mono">{orderId}</span></p>
                <p className="truncate">File Hash: <span className="font-mono">{encryptedFileHash}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}