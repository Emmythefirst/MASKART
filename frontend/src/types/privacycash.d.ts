declare module 'privacycash/dist/deposit.js' {
  import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
  export type TransactionSigner = (tx: VersionedTransaction) => Promise<VersionedTransaction> | Promise<any>;
  export default function deposit(opts: {
    lightWasm: any;
    connection: Connection;
    amount_in_lamports: number;
    keyBasePath?: string;
    publicKey: PublicKey;
    transactionSigner: TransactionSigner;
    storage?: Storage;
    encryptionService?: { getEncryptionKey?: () => Uint8Array | undefined } | any;
  }): Promise<any>;
}

declare module 'privacycash/dist/depositSPL.js' {
  import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
  export type TransactionSigner = (tx: VersionedTransaction) => Promise<VersionedTransaction> | Promise<any>;
  export default function depositSPL(opts: {
    referrer?: string;
    lightWasm: any;
    connection: Connection;
    base_units: number;
    keyBasePath?: string;
    publicKey: PublicKey;
    transactionSigner: TransactionSigner;
    storage?: Storage;
    encryptionService?: { getEncryptionKey?: () => Uint8Array | undefined } | any;
    mintAddress: PublicKey;
  }): Promise<any>;
}

declare module 'privacycash/dist/withdraw.js' {
  import { Connection, PublicKey } from '@solana/web3.js';
  export default function withdraw(opts: {
    amount_in_lamports: number;
    connection: Connection;
    encryptionService?: { getEncryptionKey?: () => Uint8Array | undefined } | any;
    keyBasePath?: string;
    publicKey: PublicKey;
    storage?: Storage;
    recipient: string;
    lightWasm: any;
  }): Promise<any>;
}

declare module 'privacycash/dist/withdrawSPL.js' {
  import { Connection, PublicKey } from '@solana/web3.js';
  export default function withdrawSPL(opts: {
    connection: Connection;
    encryptionService?: { getEncryptionKey?: () => Uint8Array | undefined } | any;
    keyBasePath?: string;
    publicKey: PublicKey;
    storage?: Storage;
    recipient: string;
    lightWasm: any;
    mintAddress: PublicKey;
    amount: number;
  }): Promise<any>;
}

declare module 'privacycash/dist/utils/encryption.js' {
  import { Keypair, PublicKey } from '@solana/web3.js';
  import { Utxo } from 'privacycash/dist/models/utxo.js';
  export interface EncryptionKey { v1: Uint8Array; v2: Uint8Array }
  export class EncryptionService {
    deriveEncryptionKeyFromSignature(signature: Uint8Array): EncryptionKey;
    deriveEncryptionKeyFromWallet(keypair: Keypair): EncryptionKey;
    encrypt(data: Buffer | string): Buffer;
    decrypt(data: Buffer): Buffer;
    encryptUtxo(utxo: any): Buffer;
    decryptUtxo(encrypted: Buffer | string, lightWasm?: any): Promise<any>;
    getUtxoPrivateKeyV2(): string;
    getUtxoPrivateKeyV1(): string;
  }
  export function serializeProofAndExtData(proof: any, extData: any, isSpl?: boolean): Buffer;
}

declare module 'privacycash' {
  export class PrivacyCash {
    constructor(opts?: any);
    // Minimal surface; add methods here as needed
  }
  export default PrivacyCash;
}
