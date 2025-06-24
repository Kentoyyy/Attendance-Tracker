import mongoose, { Document, Model, Schema, models } from 'mongoose';

// Interface for the Student document
export interface Student extends Document {
  _id: string;
  name: string;
  grade: number;
  gender: 'Male' | 'Female';
  photoUrl?: string;
  attendance?: any[]; // Simplified for this context
  createdBy: mongoose.Schema.Types.ObjectId;
  archived: boolean;
}

// Mongoose schema for the Student
const StudentSchema: Schema<Student> = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this student.'],
    trim: true,
  },
  grade: {
    type: Number,
    required: [true, 'Please provide a grade for this student.'],
  },
  gender: {
    type: String,
    required: [true, 'Please provide a gender.'],
    enum: ['Male', 'Female'],
  },
  photoUrl: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  archived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Create and export the Student model
// This checks if the model is already defined to prevent recompilation errors in development
const StudentModel = (models.Student as Model<Student>) || mongoose.model<Student>('Student', StudentSchema);

export default StudentModel; 