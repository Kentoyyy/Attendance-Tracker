import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { AttendanceRecord } from '@/app/types';

const AttendanceSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true }, 
  isAbsent: { type: Boolean, default: false },
  reason: { type: String, trim: true },
});

// Create a unique index on studentId and the date part of the timestamp.
// This prevents duplicate records for the same student on the same day.
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });


const AttendanceModel = (models.Attendance as Model<AttendanceRecord & Document>) || mongoose.model<AttendanceRecord & Document>('Attendance', AttendanceSchema);

export default AttendanceModel; 