import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  key: string;
  value: any; // Mixed type for flexibility
  updated_at: Date;
  updated_by: mongoose.Types.ObjectId;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    updated_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: false }
);

// key index is automatically created by unique: true constraint on line 12

export const Settings =
  (mongoose.models && mongoose.models.Settings) ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
