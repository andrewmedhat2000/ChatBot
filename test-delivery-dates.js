const datasetService = require('./src/services/datasetService');

async function testDeliveryDates() {
  console.log('=== Testing Delivery Date and Financing Extraction ===\n');

  try {
    // Load the dataset
    console.log('📊 Loading dataset...');
    const loadResult = await datasetService.loadDataset();
    if (!loadResult.success) {
      console.error('❌ Failed to load dataset:', loadResult.error);
      return;
    }
    console.log(`✅ Dataset loaded: ${loadResult.count} projects\n`);

    // Get Parkside project
    console.log('🔍 Getting Parkside project...');
    const parksideResult = await datasetService.getProjectByName('parkside - owest');
    
    if (parksideResult.success) {
      const project = parksideResult.project;
      console.log('✅ Parkside project found');
      console.log('Project-level delivery dates:');
      console.log('  min_delivery_date:', project.min_delivery_date);
      console.log('  max_delivery_date:', project.max_delivery_date);
      console.log('Project-level financing:');
      console.log('  financing_eligibility:', project.financing_eligibility);
      console.log('  min_installments:', project.min_installments);
      console.log('  max_installments:', project.max_installments);
      console.log('  min_down_payment:', project.min_down_payment);
      console.log('  max_down_payment:', project.max_down_payment);
      console.log('');

      // Check individual properties
      if (project.property_types && Array.isArray(project.property_types)) {
        console.log('🔍 Checking individual properties for delivery dates and financing...');
        
        let totalProperties = 0;
        let propertiesWithDeliveryDates = 0;
        let resaleProperties = 0;
        let resaleWithDeliveryDates = 0;
        let resaleWithFinancing = 0;

        project.property_types.forEach((pt, ptIndex) => {
          if (pt.properties && Array.isArray(pt.properties)) {
            pt.properties.forEach((property, propIndex) => {
              totalProperties++;
              
              if (property.min_delivery_date || property.max_delivery_date) {
                propertiesWithDeliveryDates++;
              }
              
              if (property.business_type === 'resale') {
                resaleProperties++;
                if (property.min_delivery_date || property.max_delivery_date) {
                  resaleWithDeliveryDates++;
                }
                if (property.financing_available) {
                  resaleWithFinancing++;
                }
                
                // Show detailed info for first few resale properties
                if (resaleProperties <= 5) {
                  console.log(`  Resale Property ${resaleProperties}:`);
                  console.log(`    Property Type: ${pt.name}`);
                  console.log(`    Property ID: ${property.property_id}`);
                  console.log(`    min_delivery_date: ${property.min_delivery_date}`);
                  console.log(`    max_delivery_date: ${property.max_delivery_date}`);
                  console.log(`    financing_available: ${property.financing_available}`);
                  console.log(`    installments: ${property.installments}`);
                  console.log(`    min_installments: ${property.min_installments}`);
                  console.log(`    max_installments: ${property.max_installments}`);
                  console.log(`    down_payment: ${property.down_payment}`);
                  console.log(`    min_down_payment: ${property.min_down_payment}`);
                  console.log(`    max_down_payment: ${property.max_down_payment}`);
                  console.log(`    Price: ${property.price || property.min_price || property.max_price}`);
                  console.log(`    Area: ${property.area || property.min_area || property.max_area}`);
                  console.log('');
                }
              }
            });
          }
        });

        console.log('📊 Summary:');
        console.log(`  Total properties: ${totalProperties}`);
        console.log(`  Properties with delivery dates: ${propertiesWithDeliveryDates}`);
        console.log(`  Resale properties: ${resaleProperties}`);
        console.log(`  Resale properties with delivery dates: ${resaleWithDeliveryDates}`);
        console.log(`  Resale properties with financing: ${resaleWithFinancing}`);
      }
    } else {
      console.log('❌ Parkside project not found:', parksideResult.error);
    }

    // Test the getProperties method specifically for resale apartments
    console.log('\n🔍 Testing getProperties for resale apartments...');
    const resaleResult = await datasetService.getProperties('parkside - owest', 'apartment', 'resale');
    
    if (resaleResult.success) {
      console.log(`✅ Found ${resaleResult.count} resale apartment properties`);
      
      if (resaleResult.properties.length > 0) {
        console.log('\nSample resale apartment properties:');
        resaleResult.properties.slice(0, 5).forEach((property, index) => {
          console.log(`  ${index + 1}. Property ID: ${property.property_id}`);
          console.log(`     min_delivery_date: ${property.min_delivery_date}`);
          console.log(`     max_delivery_date: ${property.max_delivery_date}`);
          console.log(`     financing_available: ${property.financing_available}`);
          console.log(`     installments: ${property.installments}`);
          console.log(`     min_installments: ${property.min_installments}`);
          console.log(`     max_installments: ${property.max_installments}`);
          console.log(`     down_payment: ${property.down_payment}`);
          console.log(`     min_down_payment: ${property.min_down_payment}`);
          console.log(`     max_down_payment: ${property.max_down_payment}`);
          console.log(`     Price: ${property.price || property.min_price || property.max_price}`);
          console.log(`     Area: ${property.area || property.min_area || property.max_area}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Failed to get resale properties:', resaleResult.error);
    }

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testDeliveryDates(); 