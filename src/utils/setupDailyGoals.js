/**
 * Daily Goals Collection Setup Script
 * 
 * This script helps set up the required Appwrite collections for the Daily Goals feature.
 * Since Appwrite SDK doesn't support creating collections programmatically,
 * this script provides detailed instructions and validation.
 */

import { databases, DATABASE_ID, COLLECTIONS } from '../services/appwrite.js';

export const setupDailyGoalsCollections = async () => {
  console.log('🎯 Setting up Daily Goals collections...\n');
  
  console.log('📋 Please create the following collections in your Appwrite Console:\n');
  
  // DAILY_PLANS Collection
  console.log('1. DAILY_PLANS Collection');
  console.log('   Collection ID: daily_plans');
  console.log('   Attributes:');
  console.log('   - title (string, required, size: 255)');
  console.log('   - description (string, optional, size: 1000)');
  console.log('   - userId (string, required, size: 36)');
  console.log('   - planDate (string, required, size: 10)');
  console.log('   - createdAt (datetime, required)');
  console.log('   - updatedAt (datetime, required)');
  console.log('   Indexes:');
  console.log('   - userId_planDate: userId (ASC), planDate (DESC)');
  console.log('   - userId_createdAt: userId (ASC), createdAt (DESC)\n');
  
  // DAILY_TASKS Collection
  console.log('2. DAILY_TASKS Collection');
  console.log('   Collection ID: daily_tasks');
  console.log('   Attributes:');
  console.log('   - title (string, required, size: 255)');
  console.log('   - description (string, optional, size: 1000)');
  console.log('   - priority (string, required, size: 10, default: "medium")');
  console.log('   - tag (string, optional, size: 50)');
  console.log('   - tagColor (string, optional, size: 7)');
  console.log('   - planId (string, required, size: 36)');
  console.log('   - userId (string, required, size: 36)');
  console.log('   - completed (boolean, required, default: false)');
  console.log('   - completedAt (datetime, optional)');
  console.log('   - createdAt (datetime, required)');
  console.log('   - updatedAt (datetime, required)');
  console.log('   Indexes:');
  console.log('   - planId: planId (ASC)');
  console.log('   - userId_completed: userId (ASC), completed (ASC)');
  console.log('   - userId_tag: userId (ASC), tag (ASC)\n');
  
  // USER_TAGS Collection
  console.log('3. USER_TAGS Collection');
  console.log('   Collection ID: user_tags');
  console.log('   Attributes:');
  console.log('   - name (string, required, size: 50)');
  console.log('   - color (string, required, size: 7)');
  console.log('   - userId (string, required, size: 36)');
  console.log('   - createdAt (datetime, required)');
  console.log('   Indexes:');
  console.log('   - userId_name: userId (ASC), name (ASC)\n');
  
  console.log('📋 Required permissions for all collections:');
  console.log('   - Create: Users');
  console.log('   - Read: Users');
  console.log('   - Update: Users');
  console.log('   - Delete: Users\n');
  
  console.log('🌍 Environment variables to add to .env:');
  console.log('   VITE_APPWRITE_DAILY_PLANS_COLLECTION_ID=daily_plans');
  console.log('   VITE_APPWRITE_DAILY_TASKS_COLLECTION_ID=daily_tasks');
  console.log('   VITE_APPWRITE_USER_TAGS_COLLECTION_ID=user_tags\n');
  
  console.log('✅ Setup instructions provided!');
  console.log('   Please complete the setup in Appwrite Console, then run validation.');
};

export const validateDailyGoalsSetup = async () => {
  console.log('🔍 Validating Daily Goals setup...\n');
  
  const collections = [
    { name: 'DAILY_PLANS', id: COLLECTIONS.DAILY_PLANS },
    { name: 'DAILY_TASKS', id: COLLECTIONS.DAILY_TASKS },
    { name: 'USER_TAGS', id: COLLECTIONS.USER_TAGS }
  ];
  
  const results = {};
  
  for (const collection of collections) {
    try {
      const collectionData = await databases.getCollection(DATABASE_ID, collection.id);
      console.log(`✅ ${collection.name} collection exists`);
      
      console.log(`   Attributes (${collectionData.attributes.length}):`);
      collectionData.attributes.forEach(attr => {
        console.log(`   - ${attr.key}: ${attr.type}${attr.required ? ' (required)' : ''}`);
      });
      
      if (collectionData.indexes && collectionData.indexes.length > 0) {
        console.log(`   Indexes (${collectionData.indexes.length}):`);
        collectionData.indexes.forEach(index => {
          console.log(`   - ${index.key}: ${index.type}`);
        });
      }
      
      results[collection.name] = true;
      console.log('');
      
    } catch (error) {
      console.error(`❌ ${collection.name} collection missing or inaccessible`);
      console.error(`   Error: ${error.message}`);
      results[collection.name] = false;
      console.log('');
    }
  }
  
  const allValid = Object.values(results).every(valid => valid);
  
  if (allValid) {
    console.log('🎉 All collections are properly set up!');
    console.log('   Daily Goals feature is ready to use.');
  } else {
    console.log('⚠️  Some collections need attention.');
    console.log('   Please complete the setup before using Daily Goals.');
  }
  
  return results;
};

export const testDailyGoalsAccess = async () => {
  console.log('🧪 Testing Daily Goals collection access...\n');
  
  const collections = [
    { name: 'DAILY_PLANS', id: COLLECTIONS.DAILY_PLANS },
    { name: 'DAILY_TASKS', id: COLLECTIONS.DAILY_TASKS },
    { name: 'USER_TAGS', id: COLLECTIONS.USER_TAGS }
  ];
  
  for (const collection of collections) {
    try {
      const documents = await databases.listDocuments(DATABASE_ID, collection.id, []);
      console.log(`✅ ${collection.name} read access: ${documents.total} documents`);
    } catch (error) {
      console.error(`❌ ${collection.name} access failed: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Daily Goals access test completed!');
};

export const createSampleData = async (userId) => {
  console.log('🎨 Creating sample daily goals data...\n');
  
  if (!userId) {
    console.error('❌ User ID required for sample data creation');
    return;
  }
  
  try {
    // Create sample tags
    const sampleTags = [
      { name: 'Health', color: '#10B981' },
      { name: 'Work', color: '#3B82F6' },
      { name: 'Personal', color: '#8B5CF6' },
      { name: 'Learning', color: '#F59E0B' }
    ];
    
    console.log('Creating sample tags...');
    const createdTags = [];
    for (const tag of sampleTags) {
      const createdTag = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_TAGS,
        'unique()',
        {
          name: tag.name,
          color: tag.color,
          userId,
          createdAt: new Date().toISOString()
        }
      );
      createdTags.push(createdTag);
      console.log(`✅ Created tag: ${tag.name}`);
    }
    
    // Create sample daily plan
    console.log('\nCreating sample daily plan...');
    const samplePlan = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.DAILY_PLANS,
      'unique()',
      {
        title: 'Sample Daily Goals',
        description: 'Your first daily goal plan with sample tasks',
        userId,
        planDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );
    console.log(`✅ Created plan: ${samplePlan.title}`);
    
    // Create sample tasks
    const sampleTasks = [
      { title: 'Morning workout', priority: 'high', tag: 'Health', description: '30 minutes cardio' },
      { title: 'Review project status', priority: 'high', tag: 'Work', description: 'Check quarterly goals' },
      { title: 'Read for 20 minutes', priority: 'medium', tag: 'Personal', description: 'Continue current book' },
      { title: 'Practice coding', priority: 'medium', tag: 'Learning', description: 'Work on new framework' },
      { title: 'Plan tomorrow', priority: 'low', tag: 'Personal', description: 'Review and plan next day' }
    ];
    
    console.log('\nCreating sample tasks...');
    for (const task of sampleTasks) {
      const tagData = createdTags.find(t => t.name === task.tag);
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DAILY_TASKS,
        'unique()',
        {
          title: task.title,
          description: task.description,
          priority: task.priority,
          tag: task.tag,
          tagColor: tagData ? tagData.color : '#6B7280',
          planId: samplePlan.$id,
          userId,
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      console.log(`✅ Created task: ${task.title}`);
    }
    
    console.log('\n🎉 Sample data created successfully!');
    console.log('   Go to Daily Goals to see your sample plan.');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  }
};

// Export for use in other files
export default {
  setupDailyGoalsCollections,
  validateDailyGoalsSetup,
  testDailyGoalsAccess,
  createSampleData
};

// Run setup if called directly
if (import.meta.env.DEV) {
  if (process.argv[2] === 'setup') {
    setupDailyGoalsCollections().catch(console.error);
  } else if (process.argv[2] === 'validate') {
    validateDailyGoalsSetup().catch(console.error);
  } else if (process.argv[2] === 'test') {
    testDailyGoalsAccess().catch(console.error);
  } else if (process.argv[2] === 'sample') {
    const userId = process.argv[3];
    if (userId) {
      createSampleData(userId).catch(console.error);
    } else {
      console.error('Please provide a user ID: node script.js sample <userId>');
    }
  }
}
