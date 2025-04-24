import mongoose, { Document, Schema } from 'mongoose';

export interface ILog extends Document {
  taskId: mongoose.Types.ObjectId;
  taskTitle: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  fromStatus?: string;
  toStatus: string;
  timestamp: Date;
  action: 'create' | 'update' | 'delete' | 'status_change';
}

const LogSchema = new Schema<ILog>({
  taskId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  taskTitle: { type: String, required: true },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userName: { type: String, required: true },
  fromStatus: { type: String },
  toStatus: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  action: { 
    type: String, 
    enum: ['create', 'update', 'delete', 'status_change'],
    required: true
  }
});

export default mongoose.model<ILog>('Log', LogSchema);