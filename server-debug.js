const fs = require('fs');
const path = require('path');

console.log('🔧 Server-Side Debug Script');
console.log('============================');

// Check build directory
const buildPath = path.join(__dirname, 'build');
console.log('\n📁 Build Directory Check:');
console.log('Build path:', buildPath);

if (fs.existsSync(buildPath)) {
  console.log('✅ Build directory exists');
  
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    const stats = fs.statSync(indexPath);
    console.log('✅ index.html exists');
    console.log('   Last modified:', stats.mtime);
    console.log('   Size:', stats.size, 'bytes');
    
    // Read first few lines of index.html to check content
    const content = fs.readFileSync(indexPath, 'utf8');
    const firstLines = content.split('\n').slice(0, 5).join('\n');
    console.log('   First few lines:');
    console.log('   ' + firstLines.replace(/\n/g, '\n   '));
  } else {
    console.log('❌ index.html not found');
  }
  
  // Check assets directory
  const assetsPath = path.join(buildPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    console.log(`✅ Assets directory exists with ${assetFiles.length} files`);
    console.log('   Asset files:', assetFiles.slice(0, 5).join(', ') + (assetFiles.length > 5 ? '...' : ''));
  } else {
    console.log('❌ Assets directory not found');
  }
} else {
  console.log('❌ Build directory does not exist');
  console.log('   Current directory:', __dirname);
  console.log('   Directory contents:');
  try {
    const files = fs.readdirSync(__dirname);
    files.forEach(file => {
      const stat = fs.statSync(path.join(__dirname, file));
      console.log(`   ${stat.isDirectory() ? 'd' : '-'} ${file}`);
    });
  } catch (error) {
    console.log('   Error reading directory:', error.message);
  }
}

// Check server process
console.log('\n🖥️ Server Process Check:');
console.log('Node.js version:', process.version);
console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);

// Check environment
console.log('\n🌍 Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');

// Test static file serving
console.log('\n🔍 Static File Test:');
const testPath = path.join(__dirname, 'build', 'index.html');
if (fs.existsSync(testPath)) {
  try {
    const content = fs.readFileSync(testPath, 'utf8');
    if (content.includes('<title>')) {
      console.log('✅ index.html is readable and contains HTML');
    } else {
      console.log('⚠️ index.html exists but may be corrupted');
    }
  } catch (error) {
    console.log('❌ Error reading index.html:', error.message);
  }
} else {
  console.log('❌ Cannot test - index.html not found');
}

console.log('\n📋 Deployment Checklist:');
console.log('□ Build directory exists in server');
console.log('□ index.html exists and is not empty');
console.log('□ Assets directory exists with files');
console.log('□ PM2 process is running');
console.log('□ Server is accessible on correct port');
console.log('□ Browser cache is cleared');
console.log('□ No 404 errors in browser console');