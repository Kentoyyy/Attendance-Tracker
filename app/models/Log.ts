import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface ILog extends Document {
  action: string;
  timestamp: Date;
  details: string;
  grade: number;
}

const LogSchema: Schema<ILog> = new Schema({
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String, required: true },
  grade: { type: Number, required: false },
});

const Log: Model<ILog> = models.Log || mongoose.model<ILog>('Log', LogSchema);

export default Log;
