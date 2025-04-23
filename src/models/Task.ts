import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: "pending" | "approved" | "done" | "rejected";
  createdBy: mongoose.Types.ObjectId;
  updatedAt?: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ["pending", "approved", "done", "rejected"],
    default: "pending",
    required: true 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true }); // This automatically adds createdAt and updatedAt fields

export default mongoose.model<ITask>('Task', TaskSchema);