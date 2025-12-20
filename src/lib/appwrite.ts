import { Client, Databases } from 'appwrite';

// Client-side Appwrite client (public operations)
export const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const databases = new Databases(client);

// Server-side Appwrite client (admin operations)
export const createAdminClient = () => {
  const adminClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  // Set API key as a header for server-side operations
  if (process.env.APPWRITE_API_KEY) {
    adminClient.headers['X-Appwrite-Key'] = process.env.APPWRITE_API_KEY;
  }

  return {
    databases: new Databases(adminClient),
  };
};

// Collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!;
export const RESPONSES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID!;
