import mongoose, { Schema } from "mongoose";

export interface ISearchAnalytics {
  query: string;
  count: number;
  totalResults: number;
  lastSearched: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SearchAnalyticsSchema = new Schema<ISearchAnalytics>(
  {
    query: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    totalResults: {
      type: Number,
      default: 0,
    },
    lastSearched: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
SearchAnalyticsSchema.index({ count: -1, lastSearched: -1 });
// query index is created by unique: true constraint below
SearchAnalyticsSchema.index({ query: 1 }, { unique: true });

export const SearchAnalytics =
  mongoose.models.SearchAnalytics ||
  mongoose.model<ISearchAnalytics>("SearchAnalytics", SearchAnalyticsSchema);
