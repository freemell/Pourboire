// Query database for user by wallet address
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  twitterId: String,
  handle: String,
  name: String,
  walletAddress: String,
  encryptedPrivateKey: String,
  isEmbedded: Boolean,
  history: Array,
  pendingClaims: Array
}, { collection: 'users', strict: false });

async function queryDB() {
  // Try to get MongoDB URI from environment
  let uri = process.env.MONGODB_URI;
  
  // Fallback to the MongoDB URI from project summary
  if (!uri) {
    uri = 'mongodb+srv://kikilapipss_db_user:rAWZ7Mhz5PER8aMH@pourboire.nmn0omv.mongodb.net/?appName=Pourboire';
    console.log('⚠️  Using MongoDB URI from fallback');
  }
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected!\n');
  
  const User = mongoose.model('User', UserSchema);
  
  const walletAddress = '8iTRxr4s4aGhf2a8AkzcCUtn3VmomapyA3dmK2GAgVbm';
  
  // Find user by wallet address
  console.log(`Looking for user with wallet: ${walletAddress}\n`);
  const user = await User.findOne({ walletAddress });
  
  if (user) {
    console.log('✅ USER FOUND:');
    console.log('─'.repeat(50));
    console.log(`Handle: ${user.handle}`);
    console.log(`Name: ${user.name}`);
    console.log(`Twitter ID: ${user.twitterId}`);
    console.log(`Wallet Address: ${user.walletAddress}`);
    console.log(`Has Encrypted Private Key: ${!!user.encryptedPrivateKey}`);
    console.log(`Is Embedded: ${user.isEmbedded}`);
    console.log(`Created At: ${user.createdAt}`);
    console.log(`Updated At: ${user.updatedAt}`);
    console.log(`History Count: ${user.history?.length || 0}`);
    console.log(`Pending Claims Count: ${user.pendingClaims?.length || 0}`);
  } else {
    console.log('❌ USER NOT FOUND with that wallet address\n');
    
    // Try to find by handle variations
    console.log('Checking for handle "witchmillaa" variations...');
    const handles = ['@witchmillaa', 'witchmillaa', '@witchmillaa', 'witchmillaa'];
    for (const h of handles) {
      const u = await User.findOne({ handle: h });
      if (u) {
        console.log(`\n✅ Found user with handle "${h}":`);
        console.log(`   Wallet: ${u.walletAddress}`);
        console.log(`   Twitter ID: ${u.twitterId}`);
      }
    }
  }
  
  // Also list all users with wallets
  console.log('\n' + '='.repeat(50));
  console.log('ALL USERS WITH WALLETS:');
  console.log('='.repeat(50));
  const allUsers = await User.find({ 
    walletAddress: { $exists: true, $ne: null } 
  }).sort({ createdAt: -1 });
  
  console.log(`\nTotal users: ${allUsers.length}\n`);
  allUsers.forEach((u, idx) => {
    console.log(`${idx + 1}. Handle: ${u.handle || 'N/A'}`);
    console.log(`   Twitter ID: ${u.twitterId || 'N/A'}`);
    console.log(`   Wallet: ${u.walletAddress}`);
    console.log(`   Has Key: ${!!u.encryptedPrivateKey}`);
    console.log('');
  });
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

queryDB().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

