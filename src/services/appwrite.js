import { Client, Account, Databases, Storage, Functions, Messaging } from 'appwrite';

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'focusflux-demo');

// Initialize services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);
const messaging = new Messaging(client);

// Database and Collection IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'focusflux_db';
export const COLLECTIONS = {
  TODOS: import.meta.env.VITE_APPWRITE_TODOS_COLLECTION_ID || 'todos',
  USERS: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users', 
  FEEDBACK: import.meta.env.VITE_APPWRITE_FEEDBACK_COLLECTION_ID || 'feedback',
  DAILY_COMPLETIONS: import.meta.env.VITE_APPWRITE_DAILY_COMPLETIONS_COLLECTION_ID || 'daily_completions',
  DAILY_PLANS: import.meta.env.VITE_APPWRITE_DAILY_PLANS_COLLECTION_ID || 'daily_plans',
  DAILY_TASKS: import.meta.env.VITE_APPWRITE_DAILY_TASKS_COLLECTION_ID || 'daily_tasks',
  USER_TAGS: import.meta.env.VITE_APPWRITE_USER_TAGS_COLLECTION_ID || 'user_tags',
  USER_SETTINGS: import.meta.env.VITE_APPWRITE_USER_SETTINGS_COLLECTION_ID || 'user_settings',
  // Social feature collections
  FRIEND_REQUESTS: import.meta.env.VITE_APPWRITE_FRIEND_REQUESTS_COLLECTION_ID || 'friend_requests',
  FRIENDSHIPS: import.meta.env.VITE_APPWRITE_FRIENDSHIPS_COLLECTION_ID || 'friendships',
  CHATS: import.meta.env.VITE_APPWRITE_CHATS_COLLECTION_ID || 'chats',
  MESSAGES: import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
  SHARED_PLANS: import.meta.env.VITE_APPWRITE_SHARED_PLANS_COLLECTION_ID || 'shared_plans'
};

export { client, account, databases, storage, functions, messaging };

export default client;
