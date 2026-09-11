import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  supabaseId: string;
  email: string;
  full_name: string;
  upi_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    upi_id: { type: String },
  },
  { timestamps: true }
);

// Prevent mongoose from compiling the model multiple times in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
