import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction {
  type: 'tip' | 'transfer';
  amount: number;
  token: 'SOL' | 'USDC';
  counterparty: string;
  txHash: string;
  date: Date;
}

export interface IPendingClaim {
  _id?: string;
  amount: number;
  token: string;
  fromTx: string;
  sender: string;
}

export interface IUser extends Document {
  twitterId: string;
  handle: string;
  name: string;
  profileImage: string;
  bio: string;
  walletAddress: string;
  encryptedPrivateKey?: string; // Only for custodial wallets
  isEmbedded: boolean;
  history: ITransaction[];
  pendingClaims: IPendingClaim[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  type: { type: String, enum: ['tip', 'transfer'], required: true },
  amount: { type: Number, required: true },
  token: { type: String, enum: ['SOL', 'USDC'], required: true },
  counterparty: { type: String, required: true },
  txHash: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const PendingClaimSchema = new Schema<IPendingClaim>({
  amount: { type: Number, required: true },
  token: { type: String, required: true },
  fromTx: { type: String, required: true },
  sender: { type: String, required: true }
});

const UserSchema = new Schema<IUser>({
  twitterId: { type: String, required: true, unique: true },
  handle: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  profileImage: { type: String, required: true },
  bio: { type: String, default: '' },
  walletAddress: { type: String, required: true, unique: true },
  encryptedPrivateKey: { type: String }, // Only for custodial wallets
  isEmbedded: { type: Boolean, default: false },
  history: [TransactionSchema],
  pendingClaims: [PendingClaimSchema]
}, {
  timestamps: true
});

// Create indexes for efficient queries
UserSchema.index({ twitterId: 1 });
UserSchema.index({ handle: 1 });
UserSchema.index({ walletAddress: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

