const datasetService = require('./src/services/datasetService');

async function testParsing() {
  console.log('=== Testing Updated CSV Parsing ===\n');

  try {
    // Load the dataset
    const loadResult = await datasetService.loadDataset();
    console.log('Load result:', loadResult);

    if (!loadResult.success) {
      console.error('Failed to load dataset');
      return;
    }

    // Test getting Parkside project
    console.log('\n--- Testing Parkside Project ---');
    const parksideResult = await datasetService.getProjectByName('parkside - owest');
    console.log('Parkside result:', JSON.stringify(parksideResult, null, 2));

    if (parksideResult.success) {
      const project = parksideResult.project;
      console.log('\nParsed Parkside data:');
      console.log('Name:', project.name);
      console.log('Business Type:', project.business_type);
      console.log('Property Types Names:', project.property_types_names);
      console.log('Business Types:', project.business_types);
      console.log('Finishing:', project.finishing);
      console.log('Property Types Array:', project.property_types);
    }

    // Test getting properties for resale
    console.log('\n--- Testing Resale Properties ---');
    const resaleResult = await datasetService.getProperties(null, null, 'resale');
    console.log('Resale properties count:', resaleResult.count);
    console.log('Sample resale properties:');
    if (resaleResult.success && resaleResult.properties.length > 0) {
      resaleResult.properties.slice(0, 3).forEach((prop, index) => {
        console.log(`  ${index + 1}. ${prop.project_name} - ${prop.business_type} - ${prop.property_type_name}`);
      });
    }

    // Test getting properties for Parkside specifically
    console.log('\n--- Testing Parkside Properties ---');
    const parksidePropsResult = await datasetService.getProperties('parkside - owest');
    console.log('Parkside properties count:', parksidePropsResult.count);
    if (parksidePropsResult.success && parksidePropsResult.properties.length > 0) {
      parksidePropsResult.properties.forEach((prop, index) => {
        console.log(`  ${index + 1}. ${prop.project_name} - ${prop.business_type} - ${prop.property_type_name}`);
      });
    }

    // Test getting all projects to see the data structure
    console.log('\n--- Testing All Projects ---');
    const allProjectsResult = await datasetService.getAllProjects();
    console.log('Total projects:', allProjectsResult.count);
    
    if (allProjectsResult.success && allProjectsResult.projects.length > 0) {
      console.log('\nSample projects with property types:');
      allProjectsResult.projects.slice(0, 5).forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name}`);
        console.log(`     Business Type: ${project.business_type}`);
        console.log(`     Property Types: ${project.property_types_names || 'None'}`);
        console.log(`     Business Types: ${project.business_types ? project.business_types.join(', ') : 'None'}`);
        console.log(`     Finishing: ${project.finishing ? project.finishing.join(', ') : 'None'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testParsing(); 