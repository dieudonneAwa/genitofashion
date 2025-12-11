import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  user_id: mongoose.Types.ObjectId;
  action: string; // "create_product", "update_stock", "complete_sale", "create_return", etc.
  entity_type: string; // "Product", "Sale", "Stock", "Return", "Customer", etc.
  entity_id?: mongoose.Types.ObjectId;
  changes?: {
    before?: any;
    after?: any;
  };
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: Schema.Types.ObjectId },
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
    ip_address: { type: String },
    user_agent: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ActivityLogSchema.index({ user_id: 1, created_at: -1 });
ActivityLogSchema.index({ created_at: -1 });
ActivityLogSchema.index({ entity_type: 1, entity_id: 1 });
ActivityLogSchema.index({ action: 1 });

export const ActivityLog =
  (mongoose.models && mongoose.models.ActivityLog) ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

