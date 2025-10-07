require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB Connected');
  seedAdmin();
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@fnf.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists with email: admin@fnf.com');
      console.log('   Use these credentials to login:');
      console.log('   Email: admin@fnf.com');
      console.log('   Password: admin123');
      process.exit(0);
    }

    // Create default admin
    const admin = await Admin.create({
      username: 'admin',
      email: 'admin@fnf.com',
      password: 'admin123', // Will be hashed automatically
      role: 'super_admin'
    });

    console.log('✅ Default admin created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Email: admin@fnf.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('\n🚀 You can now login to the admin dashboard');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}
