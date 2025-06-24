const datasetService = require('./src/services/datasetService');

async function testResaleFix() {
  console.log('=== Testing Resale Apartments Fix ===\n');

  try {
    // Load the dataset
    console.log('📊 Loading dataset...');
    const loadResult = await datasetService.loadDataset();
    if (!loadResult.success) {
      console.error('❌ Failed to load dataset:', loadResult.error);
      return;
    }
    console.log(`✅ Dataset loaded: ${loadResult.count} projects\n`);

    // Test 1: Get project by name
    console.log('🔍 Test 1: Getting project by name');
    const projectResult = await datasetService.getProjectByName('parkside - owest');
    if (projectResult.success) {
      console.log('✅ Project found:', projectResult.project.name);
      console.log('   Business Type:', projectResult.project.business_type);
      console.log('   Property Types:', projectResult.project.property_types_names);
      console.log('   Price Range:', projectResult.project.min_price, '-', projectResult.project.max_price);
    } else {
      console.log('❌ Project not found:', projectResult.error);
    }
    console.log('');

    // Test 2: Get all properties for the project
    console.log('🏠 Test 2: Getting all properties for the project');
    const allPropertiesResult = await datasetService.getProperties('parkside - owest');
    console.log('allPropertiesResult', allPropertiesResult);
    if (allPropertiesResult.success) {
      console.log(`✅ Found ${allPropertiesResult.count} properties (total: ${allPropertiesResult.total})`);
      allPropertiesResult.properties.forEach((prop, index) => {
        console.log(`   ${index + 1}. ${prop.property_type_name} - ${prop.business_type}`);
        console.log(`      Price: EGP ${prop.price?.toLocaleString() || 'N/A'}`);
        console.log(`      Area: ${prop.area} sqm`);
        console.log(`      Bedrooms: ${prop.bedrooms}`);
      });
    } else {
      console.log('❌ Failed to get properties:', allPropertiesResult.error);
    }
    console.log('');

    // Test 3: Get only resale properties
    console.log('🔄 Test 3: Getting only resale properties');
    const resalePropertiesResult = await datasetService.getProperties('parkside - owest', null, 'resale');
    if (resalePropertiesResult.success) {
      console.log(`✅ Found ${resalePropertiesResult.count} resale properties`);
      if (resalePropertiesResult.count > 0) {
        resalePropertiesResult.properties.forEach((prop, index) => {
          console.log(`   ${index + 1}. ${prop.property_type_name} - ${prop.business_type}`);
          console.log(`      Price: EGP ${prop.price?.toLocaleString() || 'N/A'}`);
          console.log(`      Area: ${prop.area} sqm`);
          console.log(`      Bedrooms: ${prop.bedrooms}`);
        });
      } else {
        console.log('   ℹ️  No resale properties found');
      }
    } else {
      console.log('❌ Failed to get resale properties:', resalePropertiesResult.error);
    }
    console.log('');

    // Test 4: Get only apartment properties
    console.log('🏢 Test 4: Getting only apartment properties');
    const apartmentPropertiesResult = await datasetService.getProperties('parkside - owest', 'apartment');
    if (apartmentPropertiesResult.success) {
      console.log(`✅ Found ${apartmentPropertiesResult.count} apartment properties`);
      if (apartmentPropertiesResult.count > 0) {
        apartmentPropertiesResult.properties.forEach((prop, index) => {
          console.log(`   ${index + 1}. ${prop.property_type_name} - ${prop.business_type}`);
          console.log(`      Price: EGP ${prop.price?.toLocaleString() || 'N/A'}`);
          console.log(`      Area: ${prop.area} sqm`);
          console.log(`      Bedrooms: ${prop.bedrooms}`);
        });
      } else {
        console.log('   ℹ️  No apartment properties found');
      }
    } else {
      console.log('❌ Failed to get apartment properties:', apartmentPropertiesResult.error);
    }
    console.log('');

    // Test 5: Get resale apartments specifically
    console.log('🏢🔄 Test 5: Getting resale apartments specifically');
    const resaleApartmentsResult = await datasetService.getProperties('parkside - owest', 'apartment', 'resale');
    if (resaleApartmentsResult.success) {
      console.log(`✅ Found ${resaleApartmentsResult.count} resale apartment properties`);
      if (resaleApartmentsResult.count > 0) {
        resaleApartmentsResult.properties.forEach((prop, index) => {
          console.log(`   ${index + 1}. ${prop.property_type_name} - ${prop.business_type}`);
          console.log(`      Price: EGP ${prop.price?.toLocaleString() || 'N/A'}`);
          console.log(`      Area: ${prop.area} sqm`);
          console.log(`      Bedrooms: ${prop.bedrooms}`);
        });
      } else {
        console.log('   ℹ️  No resale apartment properties found');
      }
    } else {
      console.log('❌ Failed to get resale apartment properties:', resaleApartmentsResult.error);
    }

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testResaleFix().catch(console.error); 