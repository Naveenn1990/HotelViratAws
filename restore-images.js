const mongoose = require('mongoose');

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    restoreImages();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Import the Menu model
const Menu = require('./model/menuModel');

// This is the data from the logs showing what the images should be
const imageMapping = {
  'Babycorn 65': 'uploads/menu/1766553393996_OIP.jpg',
  'Babycorn Chilly': 'uploads/menu/1766553485416_Chilli-Baby-Corn-1536x864.jpg',
  'Babycorn Pepper Dry': 'uploads/menu/1766553544418_maxresdefault.jpg',
  'Butter Roti': 'uploads/menu/1766553965331_butter-roti-isolated-rustic-wooden-background-selective-focus_726363-627.avif',
  'Chilli Milli Roti': 'uploads/menu/1766554232036_Onion-Chilli-Roti.jpg',
  'Cream of Mushroom Soup': 'uploads/menu/1766554432026_7af1259ddb60d4e241ed891b87091f43.0000000.jpg',
  'Cream of Veg Soup': 'uploads/menu/1766554483489_Homemade-Creamy-Vegetable-Soup-3.jpg',
  'French Fries': 'uploads/menu/1766554561393_delicious-french-fries-on-a-white-background-photo.jpg',
  'Fresh Lime Soda': 'uploads/menu/1766554808676_hqdefault.jpg',
  'Fried / Roasted Papad': 'uploads/menu/1766554867874_istockphoto-666595984-612x612.jpg',
  'Gobi 65': 'uploads/menu/1766555914570_65-Gobi.png',
  'Gobi Pepper dry': 'uploads/menu/1766556675031_9ab7e6c27f906c5c70539ab30eb5b33a.jpg',
  'Green Salad': 'uploads/menu/1766556842567_GREEN-SALAD.webp',
  'Groundnut Masala': 'uploads/menu/1766556927783_Peanut-Chaat-Blog.jpg',
  'Hariyali Babycorn': 'uploads/menu/1766557047823_hq720.jpg',
  'Hariyali Gobi': 'uploads/menu/1766562670918_f257ed_6205f3f028444f15b717f46c2a5e913a~mv2.avif',
  'Hot & Sour Veg Soup': 'uploads/menu/1766557241859_vegetable-hot-and-sour-soup.webp',
  'Jaljeera': 'uploads/menu/1766560933092_a3284db02d2942849d85959d105a8733.jpg',
  'Kulcha': 'uploads/menu/1766561289597_kulcha-recipe-1.jpg',
  'Lemon Coriander Soup': 'uploads/menu/1766561332899_Lemon-Coriander-Soup-1.webp',
  'Malai Paneer Tikka': 'uploads/menu/1766561453209_maxresdefault (3).jpg',
  'Masala Papad': 'uploads/menu/1766561496218_OIP (8).jpg',
  'Masala soda': 'uploads/menu/1766561742237_masala_soda.avif',
  'Methi roti': 'uploads/menu/1766561790386_thepla-methi-fenugreek-roti-rotli-flatbread-mango-pickle-338482329.webp',
  'Missi Roti': 'uploads/menu/1766561964885_photo.jpg',
  'Mushroom 65': 'uploads/menu/1766562022539_IMG_20200725_151637-01-1024x1024.jpeg',
  'Mushroom Chilly': 'uploads/menu/1766562115802_OIP (10).jpg',
  'Mushroom Manchurian': 'uploads/menu/1766562163564_Mushroom-Manchurian-3.webp',
  'Mushroom Spinach Soup': 'uploads/menu/1766562206758_mushroom-spinach-soup-with-cinnamon-coriander-and-cumin.jpg',
  'Onion Pakoda': 'uploads/menu/1766562265671_pakoda-1024x687.jpg',
  'Onion Rings': 'uploads/menu/1766562284520_OIP (11).jpg',
  'Paneer 65': 'uploads/menu/1766562440202_OIP (12).jpg',
  'Paneer Chilly': 'uploads/menu/1766562488593_OIP (13).jpg',
  'Paneer Hariyali Tikka': 'uploads/menu/1766562530920_paneer_hariyali_tikka_01.png',
  'Paneer Manchurian': 'uploads/menu/1766562573049_05-03-2021_03-40-37_paneer.jpg',
  'Paneer Pepper Dry': 'uploads/menu/1766562611645_maxresdefault (4).jpg',
  'Paneer Tikka': 'uploads/menu/1766562377356_paneer-tikka-is-indian-dish-made-from-chunks-cottage-cheese-marinated-spices-grilled-tandoor_466689-76798.avif',
  'Pudina Roti': 'uploads/menu/1766560098311_unnamed.jpg',
  'Sweet Corn Veg Soup': 'uploads/menu/1766559130724_veg-sweet-corn-soup.jpg',
  'Tandoori Babycorn': 'uploads/menu/1766559052419_tandoori-babycorn.webp',
  'Tandoori Gobi': 'uploads/menu/1766559001238_tandoori-gobi-chou-fleur-roti-tikka-est-plat-sec-prepare-rotissant-choux-fleurs-au-four-au-tandoor-est-entree-populaire-inde-servi-du-ketchup-mise-au-point-selective_466689-32522.avif',
  'Tandoori Mushroom': 'uploads/menu/1766558951042_mushroom-tikka-recipe-11.jpg',
  'Tandoori Roti': 'uploads/menu/1766558838915_Tandoori-roti-5.jpg',
  'Tomato Soup': 'uploads/menu/1766558307040_OIP (3).jpg',
  'Tri colour Paneer tikka': 'uploads/menu/1766558162219_tri-colour-paneer-tikka.avif',
  'Veg Clear Soup': 'uploads/menu/1766557700117_vegetable-clear-soup.jpg',
  'Veg Grill Sandwich': 'uploads/menu/1766557653223_veg-grilled-sandwich-served-with-ketchup-isolated-rustic-wooden-background-selective-focus_726363-1356.avif',
  'Veg Manchow Soup': 'uploads/menu/1766557594594_Vegetable_Manchow_Soup_thumbnail_1280x800.jpg',
  'Veg Sandwich': 'uploads/menu/1766557552826_Vegetable-Sandwich.jpg',
  'Veg seekh Kabab': 'uploads/menu/1766557409467_o6dib21hju9.webp',
  'Veg. Balls Manchurian': 'uploads/menu/1766557348782_maxresdefault (2).jpg',
  'Virat spl. Tandoori Platter': 'uploads/menu/1766557311867_vibrant-aromatic-this-platter-features-array-vegetables-coated-rich-blend-tandoori_216520-84721.avif',
  'Akki Rotti': 'uploads/menu/1766553298706_Akki_Roti@palates_desire-scaled (1).webp',
  'Plain Dosa': 'uploads/menu/1766560324675_rava-dosa.webp',
  'Vada': 'uploads/menu/1766558078757_u113o4r_medu-vada_625x300_06_September_23.jpg',
  'Rava Idly': 'uploads/menu/1766559514503_Barley-Rava-Idli.jpg',
  'Idly 2, Vada 1': 'uploads/menu/1766560855363_OIP (5).jpg',
  'Idly 1, Vada 1': 'uploads/menu/1766558880973_south-indian-breakfast-combination-medu-vada-idli-idly-is-traditional-popular-food-served-with-bowls-chutney-sambar-as-side-dishesselective-focus_726363-406.avif',
  'Rice Bath': 'uploads/menu/1766559363711_images.jpg',
  'Chow Chow Bath': 'uploads/menu/1766554297718_2kw3tta0npe.webp',
  'Kesari Bath': 'uploads/menu/1766561133083_rava-kesari-sheerasuji-halwakesaribath-recipe-main-photo.jpg',
  'Khara Bath': 'uploads/menu/1766561220437_img201908161053451336713087275706865.jpg',
  'Puri Sagu': 'uploads/menu/1766560037842_dad9ea6e2ef05b460f06b5b02e4b991a.avif',
  'Ragi Rotti': 'uploads/menu/1766559928913_traditional_ragi_roti_rotti_recipe-720x1080.jpg',
  'Mirchi [2 Piece]': 'uploads/menu/1766561855540_mirchi_vada-NNN-1.webp',
  'Ghee Khali Dosa': 'uploads/menu/1766555729598_Plain-Dosa.webp',
  'Ghee Roast Plain': 'uploads/menu/1766555714085_9940727be218793f5de3450a6cc9cd14.jpg',
  'Ghee Roast Masala Dosa': 'uploads/menu/1766555389598_GHEE-ROAST.png',
  'Onion Uttapam': 'uploads/menu/1766562331495_onion-uttapam-1.jpg',
  'Rava Masala Dosa': 'uploads/menu/1766559419225_Onion_Rava_Dosa@palates_desire-scaled.webp',
  'Rava Onion Masala Dosa': 'uploads/menu/1766560598346_4x3-instant-onion-rava-dosa-recipe.jpg',
  'Tomato Uttapam': 'uploads/menu/1766558234001_instant-uttapam-recipe.jpg',
  'Paper Dosa': 'uploads/menu/1766561610914_53239433.jpg',
  'Paper Masala Dosa': 'uploads/menu/1766561566908_images (1).jpg',
  'Pudi Masala Dosa': 'uploads/menu/1766560197393_download (8).jpg',
  'Tea / Coffee': 'uploads/menu/1766558797703_51wDJVPAuRL._SY300_SX300_QL70_FMwebp_.webp',
  'Badam Milk': 'uploads/menu/1766553741380_7a6f82b8f824f5dae6cf7a515e0b498e189267778f63fe7742d1fca6da678df6.webp',
  'Kashaya': 'uploads/menu/1766561070985_OIP (6).jpg',
  'Lemon Tea': 'uploads/menu/1766561401189_OIP (7).jpg',
  'Ginger Tea': 'uploads/menu/1766555827094_Ginger-Tea-Recipes-scaled.jpeg',
  'Cheese Sandwich': 'uploads/menu/1766554180232_OIP (1).jpg',
  'Cheese Grill Sandwich': 'uploads/menu/1766554113736_grilled-cheese-sandwich-white-background-generative-ai_971989-9073.avif',
  'Bhel Puri': 'uploads/menu/1766553917974_maxresdefault (1).jpg',
  'Masala Puri': 'uploads/menu/1766561649860_masala-puri-chaat-recipe28.webp',
  'Dahi Puri': 'uploads/menu/1766554522672_dahi-puri-chat-is-indian-road-side-snack-item-which-is-especially-popular-state-maharashtra-india-scaled.webp',
  'Pani Puri': 'uploads/menu/1766562063128_OIP (9).jpg',
  'Pav Bhaji': 'uploads/menu/1766560431402_indian-mumbai-street-style-pav-bhaji-garnished-with-peas-raw-onions-coriander-and-butter-spicy-thick-curry-made-of-out-mixed-vegetables-served-with-pav-over-white-background-with-copy-space-photo.jpg',
  'Vada Pav': 'uploads/menu/1766558016472_indian-famous-street-food-vada-pav_55610-2880.avif',
  'Samosa': 'uploads/menu/1766559290268_6416733eeda35bf65bfa757d6d4c39c0.jpg',
  'Samosa Chat': 'uploads/menu/1766559180054_OIP (4).jpg',
  'Kachori': 'uploads/menu/1766561020182_spicy-urad-dal-kachori-dish-on-transparent-background-png.png',
  'Fried Rice': 'uploads/menu/1766554948303_veg-fried-rice-recipe.jpg'
};

async function restoreImages() {
  try {
    console.log('🔄 Restoring image references...');
    
    let restoredCount = 0;
    
    for (const [itemName, imagePath] of Object.entries(imageMapping)) {
      try {
        const result = await Menu.updateOne(
          { name: itemName },
          { $set: { image: imagePath } }
        );
        
        if (result.matchedCount > 0) {
          console.log(`✅ Restored image for "${itemName}": ${imagePath}`);
          restoredCount++;
        } else {
          console.log(`⚠️  Item not found: "${itemName}"`);
        }
      } catch (error) {
        console.error(`❌ Error updating "${itemName}":`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Items to restore: ${Object.keys(imageMapping).length}`);
    console.log(`   - Successfully restored: ${restoredCount}`);
    
    console.log('\n✅ Image restoration completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error restoring images:', error);
    process.exit(1);
  }
}