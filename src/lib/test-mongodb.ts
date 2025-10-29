import connectDB from './mongodb';
import User from '../models/User';

export async function testMongoDBConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await connectDB();
    console.log('✅ MongoDB connected successfully!');
    
    // Test creating a user
    const testUser = new User({
      twitterId: 'test_123',
      handle: '@testuser',
      name: 'Test User',
      profileImage: 'https://via.placeholder.com/150',
      bio: 'Test bio',
      walletAddress: 'test_wallet_address',
      isEmbedded: true,
      history: [],
      pendingClaims: []
    });
    
    // Save test user
    await testUser.save();
    console.log('✅ Test user created successfully!');
    
    // Clean up test user
    await User.deleteOne({ twitterId: 'test_123' });
    console.log('✅ Test user cleaned up!');
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
}

