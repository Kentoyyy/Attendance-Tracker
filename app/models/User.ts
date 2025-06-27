import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IUser extends Document {
  email?: string;
  password?: string; // Password won't be sent to client
  name: string;
  role: 'teacher' | 'admin';
  pin?: string; // Add PIN for teachers
  archived?: boolean;
}

const UserSchema: Schema<IUser> = new Schema({
  email: {
    type: String,
    required: function(this: any) { return this.role === 'admin'; },
    unique: false, // Only unique for admins, not teachers
    sparse: true,
    match: [/.+\@.+\..+/, 'Please provide a valid email address.'],
  },
  password: {
    type: String,
    required: function(this: any) { return this.role === 'admin'; },
    select: false, // Don't return password by default
  },
  pin: {
    type: String,
    required: function(this: any) { return this.role === 'teacher'; },
    select: false, // Don't return PIN by default
  },
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
  },
  role: {
    type: String,
    enum: ['teacher', 'admin'],
    default: 'teacher',
  },
  archived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const User = (models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User; 