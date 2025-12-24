const { execSync } = require('child_process');

/**
 * Quick sync - Run this anytime to sync live images to local database
 */

console.log('🚀 QUICK SYNC - Live Images → Local Database');
console.log('');

try {
  // Run the sync script
  execSync('node sync-live-images.js', { stdio: 'inherit' });
  
  console.log('');
  console.log('✅ Quick sync completed!');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. The local database now matches the live system');
  console.log('2. React Native app should pick up the changes');
  console.log('3. Use cache clearing if images still don\'t show');
  
} catch (error) {
  console.error('❌ Quick sync failed:', error.message);
  process.exit(1);
}