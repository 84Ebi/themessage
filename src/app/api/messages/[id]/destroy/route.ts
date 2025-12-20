import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'appwrite';
import {
  createAdminClient,
  DATABASE_ID,
  MESSAGES_COLLECTION_ID,
  RESPONSES_COLLECTION_ID,
} from '@/lib/appwrite';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminToken } = body;

    const { databases } = createAdminClient();

    // Fetch the message to verify admin token
    const message = await databases.getDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      id
    );

    // Verify admin token
    if (message.adminToken !== adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid admin token.' },
        { status: 403 }
      );
    }

    // Delete all responses associated with this message
    const responses = await databases.listDocuments(
      DATABASE_ID,
      RESPONSES_COLLECTION_ID,
      [Query.equal('messageId', id)]
    );

    for (const response of responses.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        RESPONSES_COLLECTION_ID,
        response.$id
      );
    }

    // Delete the message
    await databases.deleteDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      id
    );

    return NextResponse.json(
      { success: true, message: 'Message destroyed permanently' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.code === 404) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    console.error('Error destroying message:', error);
    return NextResponse.json(
      { error: 'Failed to destroy message' },
      { status: 500 }
    );
  }
}
