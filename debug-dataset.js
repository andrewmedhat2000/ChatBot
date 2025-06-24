const datasetService = require('./src/services/datasetService');

async function debugDataset() {
  console.log('=== Debugging Dataset Structure ===\n');

  try {
    // Load the dataset
    console.log('📊 Loading dataset...');
    const loadResult = await datasetService.loadDataset();
    if (!loadResult.success) {
      console.error('❌ Failed to load dataset:', loadResult.error);
      return;
    }
    console.log(`✅ Dataset loaded: ${loadResult.count} projects\n`);

    // Find all unique business types
    console.log('🏢 Finding all unique business types...');
    const businessTypes = new Set();
    const propertyTypes = new Set();
    
    datasetService.projects.forEach(project => {
      if (project.business_type) {
        businessTypes.add(project.business_type);
      }
      if (project.property_types_names) {
        propertyTypes.add(project.property_types_names);
      }
    });

    console.log('📋 Unique Business Types:');
    Array.from(businessTypes).sort().forEach(type => {
      console.log(`   - ${type}`);
    });
    console.log('');

    console.log('🏠 Unique Property Types:');
    Array.from(propertyTypes).sort().forEach(type => {
      console.log(`   - ${type}`);
    });
    console.log('');

    // Find projects with "resale" in business type or property types
    console.log('🔄 Finding projects with "resale" in any field...');
    const resaleProjects = datasetService.projects.filter(project => {
      const businessType = project.business_type?.toLowerCase() || '';
      const propertyTypes = project.property_types_names?.toLowerCase() || '';
      const name = project.name?.toLowerCase() || '';
      
      return businessType.includes('resale') || 
             propertyTypes.includes('resale') || 
             name.includes('resale');
    });

    console.log(`✅ Found ${resaleProjects.length} projects with "resale" references:`);
    resaleProjects.slice(0, 10).forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name}`);
      console.log(`      Business Type: ${project.business_type}`);
      console.log(`      Property Types: ${project.property_types_names}`);
      console.log(`      Price: EGP ${project.min_price?.toLocaleString()} - ${project.max_price?.toLocaleString()}`);
    });

    if (resaleProjects.length > 10) {
      console.log(`   ... and ${resaleProjects.length - 10} more`);
    }
    console.log('');

    // Find projects with "apartment" in property types
    console.log('🏢 Finding projects with "apartment" in property types...');
    const apartmentProjects = datasetService.projects.filter(project => {
      const propertyTypes = project.property_types_names?.toLowerCase() || '';
      return propertyTypes.includes('apartment');
    });

    console.log(`✅ Found ${apartmentProjects.length} projects with apartments:`);
    apartmentProjects.slice(0, 5).forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name}`);
      console.log(`      Business Type: ${project.business_type}`);
      console.log(`      Property Types: ${project.property_types_names}`);
      console.log(`      Price: EGP ${project.min_price?.toLocaleString()} - ${project.max_price?.toLocaleString()}`);
    });
    console.log('');

    // Check the specific "parkside - owest" project
    console.log('🔍 Detailed analysis of "parkside - owest":');
    const parksideProject = datasetService.projects.find(p => 
      p.name?.toLowerCase() === 'parkside - owest'
    );
    
    if (parksideProject) {
      console.log('   Project found!');
      console.log('   Name:', parksideProject.name);
      console.log('   Developer:', parksideProject.developer_name);
      console.log('   Area:', parksideProject.area_name);
      console.log('   Business Type:', parksideProject.business_type);
      console.log('   Property Types:', parksideProject.property_types_names);
      console.log('   Price Range:', parksideProject.min_price, '-', parksideProject.max_price);
      console.log('   Area Range:', parksideProject.min_area, '-', parksideProject.max_area);
      console.log('   Bedrooms:', parksideProject.min_bedrooms, '-', parksideProject.max_bedrooms);
    } else {
      console.log('   Project not found');
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  }
}

// Run the debug
debugDataset().catch(console.error); 