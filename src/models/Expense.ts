import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IExpense extends Document {
  groupId: Types.ObjectId;
  description: string;
  amount: number;
  paidBy: Types.ObjectId;
  category?: string;
  splits?: any; // To store how it's split among members
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema<IExpense> = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String },
    splits: { type: Schema.Types.Mixed }, 
    currency: { type: String, default: 'INR' },
    originalAmount: { type: Number },
    exchangeRate: { type: Number },
  },
  { timestamps: true }
);

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
