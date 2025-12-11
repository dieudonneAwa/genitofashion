import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "customer" | "admin" | "staff";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "admin", "staff"],
      default: "customer",
    },
    phone: { type: String, default: null },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Create unique index for email explicitly
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { sparse: true }); // Sparse index for phone (only indexes documents with phone)

export interface ISession extends Document {
  sessionToken: string;
  userId: mongoose.Types.ObjectId;
  expires: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionToken: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expires: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// sessionToken index is automatically created by unique: true constraint on line 41
// Only create index for userId (not unique, so needs explicit index)
SessionSchema.index({ userId: 1 });

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
    refresh_token: { type: String, default: null },
    access_token: { type: String, default: null },
    expires_at: { type: Number, default: null },
    token_type: { type: String, default: null },
    scope: { type: String, default: null },
    id_token: { type: String, default: null },
    session_state: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

AccountSchema.index({ provider: 1, providerAccountId: 1 });
AccountSchema.index({ userId: 1 });

export const User =
  (mongoose.models && mongoose.models.User) ||
  mongoose.model<IUser>("User", UserSchema);

export const Session =
  (mongoose.models && mongoose.models.Session) ||
  mongoose.model<ISession>("Session", SessionSchema);

export const Account =
  (mongoose.models && mongoose.models.Account) ||
  mongoose.model<IAccount>("Account", AccountSchema);
