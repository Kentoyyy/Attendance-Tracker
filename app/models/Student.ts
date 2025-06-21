import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for the Student document
export interface IStudent extends Document {
  name: string;
  grade: number;
  gender: string;
}

// Mongoose schema for the Student
const StudentSchema: Schema<IStudent> = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the student.'],
    trim: true,
  },
  grade: {
    type: Number,
    required: [true, 'Please provide a grade for the student.'],
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female'],
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Create and export the Student model
// This checks if the model is already defined to prevent recompilation errors in development
const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);

export default Student; 