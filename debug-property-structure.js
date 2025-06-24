const datasetService = require('./src/services/datasetService');

async function debugPropertyStructure() {
  console.log('=== Debugging Property Structure ===\n');

  try {
    // Load the dataset
    console.log('📊 Loading dataset...');
    const loadResult = await datasetService.loadDataset();
    if (!loadResult.success) {
      console.error('❌ Failed to load dataset:', loadResult.error);
      return;
    }
    console.log(`✅ Dataset loaded: ${loadResult.count} projects\n`);

    // Find the parkside project
    console.log('🔍 Finding Parkside project...');
    const parksideResult = await datasetService.getProjectByName('parkside - owest');
    
    if (parksideResult.success) {
      const project = parksideResult.project;
      console.log('✅ Parkside project found:');
      console.log('Name:', project.name);
      console.log('Business Type:', project.business_type);
      console.log('Property Types Names:', project.property_types_names);
      console.log('Business Types:', project.business_types);
      console.log('Property Types Array:', project.property_types);
      
      if (project.property_types && Array.isArray(project.property_types)) {
        console.log('\n🔍 Property Types Array Details:');
        project.property_types.forEach((pt, index) => {
          console.log(`  Property Type ${index + 1}:`);
          console.log(`    Name: ${pt.name}`);
          console.log(`    ID: ${pt.property_type_id}`);
          console.log(`    Count: ${pt.property_types_count}`);
          console.log(`    Properties Array: ${pt.properties ? pt.properties.length : 0} items`);
          
          if (pt.properties && pt.properties.length > 0) {
            console.log(`    Sample Properties:`);
            pt.properties.slice(0, 3).forEach((prop, propIndex) => {
              console.log(`      ${propIndex + 1}. Business Type: ${prop.business_type}`);
              console.log(`         Price: ${prop.price}`);
              console.log(`         Area: ${prop.area}`);
              console.log(`         Bedrooms: ${prop.bedrooms}`);
            });
          } else {
            console.log(`    No individual properties found`);
          }
        });
      } else {
        console.log('❌ No property_types array found');
      }
    } else {
      console.log('❌ Parkside project not found:', parksideResult.error);
    }

    // Check if there are any projects with individual properties
    console.log('\n🔍 Checking for projects with individual properties...');
    let projectsWithProperties = 0;
    let totalProperties = 0;
    
    datasetService.projects.forEach(project => {
      if (project.property_types && Array.isArray(project.property_types)) {
        project.property_types.forEach(pt => {
          if (pt.properties && Array.isArray(pt.properties) && pt.properties.length > 0) {
            projectsWithProperties++;
            totalProperties += pt.properties.length;
          }
        });
      }
    });
    
    console.log(`✅ Found ${projectsWithProperties} projects with individual properties`);
    console.log(`✅ Total individual properties: ${totalProperties}`);

    // Look for any project with resale properties
    console.log('\n🔍 Looking for projects with resale properties...');
    let resaleProjects = 0;
    
    datasetService.projects.forEach(project => {
      if (project.property_types && Array.isArray(project.property_types)) {
        project.property_types.forEach(pt => {
          if (pt.properties && Array.isArray(pt.properties)) {
            pt.properties.forEach(prop => {
              if (prop.business_type && prop.business_type.toLowerCase() === 'resale') {
                resaleProjects++;
                console.log(`  Found resale property in: ${project.name}`);
                console.log(`    Property Type: ${pt.name}`);
                console.log(`    Business Type: ${prop.business_type}`);
                console.log(`    Price: ${prop.price}`);
                console.log(`    Area: ${prop.area}`);
              }
            });
          }
        });
      }
    });
    
    console.log(`✅ Found ${resaleProjects} projects with resale properties`);

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  }
}

debugPropertyStructure(); 