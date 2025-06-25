// Script to find projects in the primary dataset with primary properties
const datasetService = require('./src/services/datasetService');

async function findPrimaryProjects() {
  console.log('🔍 Finding projects with primary properties...\n');

  try {
    // Load the primary dataset
    await datasetService.loadPrimaryDataset();
    
    // Get all projects from the primary dataset
    const allProjects = await datasetService.getAllProjects();
    
    console.log(`📊 Total projects in primary dataset: ${allProjects.count}\n`);
    
    // Find projects that have developer_sale properties
    const foundProjects = [];
    
    for (const project of allProjects.projects) {
      // Check if this project has developer_sale properties
      const properties = await datasetService.getProperties(project.name, null, 'developer_sale');
      
      if (properties.count > 0) {
        foundProjects.push({
          name: project.name,
          developer: project.developer_name,
          area: project.area_name,
          propertyCount: properties.count,
          properties: properties.properties.slice(0, 2) // Show first 2 properties
        });
        
        // Stop after finding 3 projects
        if (foundProjects.length >= 3) {
          break;
        }
      }
    }
    
    if (foundProjects.length > 0) {
      console.log(`✅ Found ${foundProjects.length} projects with primary properties:\n`);
      
      foundProjects.forEach((project, index) => {
        console.log(`📋 Project ${index + 1}:`);
        console.log('─'.repeat(50));
        console.log(`Project Name: ${project.name}`);
        console.log(`Developer: ${project.developer}`);
        console.log(`Area: ${project.area}`);
        console.log(`Primary Properties Count: ${project.propertyCount}`);
        console.log('');
        
        console.log('Sample Properties:');
        project.properties.forEach((prop, propIndex) => {
          console.log(`  ${propIndex + 1}. Business Type: ${prop.business_type}`);
          console.log(`     Price: ${prop.price} EGP`);
          console.log(`     Area: ${prop.area} sqm`);
          console.log(`     Property Type: ${prop.property_type_name || 'N/A'}`);
        });
        console.log('');
        
        console.log('💡 For testing:');
        console.log(`   Project Name: "${project.name}"`);
        console.log(`   Campaign Type: "primary"`);
        console.log('');
      });
      
    } else {
      console.log('❌ No projects with primary properties found in the primary dataset.');
    }
    
  } catch (error) {
    console.error('❌ Error finding primary projects:', error);
  }
}

// Run the search
findPrimaryProjects().catch(console.error); 