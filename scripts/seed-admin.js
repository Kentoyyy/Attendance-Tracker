const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
// Correctly configure dotenv to find the .env file in the root directory
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

// We need to define the User schema here because this script runs outside of Next.js
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'admin'], default: 'teacher' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

const seedAdmin = async () => {
  try {
    await connectToDatabase();

    const adminEmail = 'admin@example.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Admin user already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash('adminpassword', 10);

    await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: adminpassword');

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedAdmin(); 