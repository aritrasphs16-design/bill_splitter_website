import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  groupId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId; // References the User document _id
  message: string;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
