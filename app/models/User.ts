import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string; // Password won't be sent to client
  name: string;
  role: 'teacher' | 'admin';
  archived?: boolean;
}

const UserSchema: Schema<IUser> = new Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email for this user.'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please provide a valid email address.'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    select: false, // Don't return password by default
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