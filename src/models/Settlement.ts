import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISettlement extends Document {
  groupId: Types.ObjectId;
  paidBy: Types.ObjectId;
  paidTo: Types.ObjectId;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema: Schema<ISettlement> = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paidTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

const Settlement: Model<ISettlement> = mongoose.models.Settlement || mongoose.model<ISettlement>('Settlement', SettlementSchema);

export default Settlement;
