import { Request, Response, NextFunction } from 'express';
import { isValidSolanaAddress } from '../utils/validators.js';

/**
 * Verify wallet signature (placeholder for future implementation)
 * In production, this would verify a signed message from the wallet
 */
export const verifyWalletSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        error: 'Wallet address required'
      });
      return;
    }

    if (!isValidSolanaAddress(walletAddress)) {
      res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
      return;
    }

    // TODO: Implement actual signature verification
    // const nacl = require('tweetnacl');
    // const publicKey = new PublicKey(walletAddress);
    // const messageBytes = new TextEncoder().encode(message);
    // const signatureBytes = Buffer.from(signature, 'base64');
    // const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());

    // For now, we just validate the address exists
    req.body.verifiedWallet = walletAddress;
    next();
  } catch (error) {
    console.error('Wallet verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Wallet verification failed'
    });
  }
};

/**
 * Require wallet address in request
 */
export const requireWallet = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const walletAddress = req.body.walletAddress || req.query.walletAddress;

  if (!walletAddress) {
    res.status(401).json({
      success: false,
      error: 'Wallet address required'
    });
    return;
  }

  if (!isValidSolanaAddress(walletAddress as string)) {
    res.status(400).json({
      success: false,
      error: 'Invalid wallet address'
    });
    return;
  }

  next();
};

/**
 * Optional wallet authentication
 * Adds wallet info to request if provided, but doesn't require it
 */
export const optionalWallet = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const walletAddress = req.body.walletAddress || req.query.walletAddress;

  if (walletAddress && isValidSolanaAddress(walletAddress as string)) {
    req.body.verifiedWallet = walletAddress;
  }

  next();
};

/**
 * Rate limiting by wallet address
 */
export const rateLimitByWallet = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // TODO: Implement rate limiting logic
  // Could use Redis or in-memory store
  next();
};