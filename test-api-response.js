const axios = require('axios');

async function testApiResponse() {
  try {
    console.log('🔍 Testing API response...');
    
    // Test the actual API endpoint that the React Native app uses
    const response = await axios.get('https://hotelvirat.com/api/v1/hotel/menu');
    
    console.log(`📊 Total items returned: ${response.data.length}`);
    console.log('\n=== FIRST 10 ITEMS WITH IMAGE STATUS ===');
    
    response.data.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`);
      console.log(`   Image: ${item.image || 'NULL'}`);
      console.log(`   Has Image: ${item.image ? '✅' : '❌'}`);
      console.log('---');
    });
    
    // Check specific items that should have been updated
    const testItems = ['Babycorn 65', 'Paneer Tikka', 'Butter Roti'];
    console.log('\n=== SPECIFIC TEST ITEMS ===');
    
    
    testItems.forEach(itemName => {
      const item = response.data.find(i => i.name === itemName);
      if (item) {
        console.log(`✅ ${itemName}: ${item.image || 'NULL'}`);
      } else {
        console.log(`❌ ${itemName}: NOT FOUND`);
      }
    });
    
    // Count items with and without images
    const withImages = response.data.filter(item => item.image && item.image.trim() !== '').length;
    const withoutImages = response.data.length - withImages;
    
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Items with images: ${withImages}`);
    console.log(`❌ Items without images: ${withoutImages}`);
    console.log(`📈 Coverage: ${((withImages / response.data.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testApiResponse();