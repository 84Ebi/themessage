import { NextRequest, NextResponse } from 'next/server';
import { ID, Query } from 'appwrite';
import {
  createAdminClient,
  databases,
  DATABASE_ID,
  MESSAGES_COLLECTION_ID,
  RESPONSES_COLLECTION_ID,
} from '@/lib/appwrite';

const MAX_RESPONSE_SIZE = 2 * 1024 * 1024; // 2MB

// POST: Submit anonymous response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Response content is required' },
        { status: 400 }
      );
    }

    // Check response size
    const responseSize = new Blob([content]).size;
    if (responseSize > MAX_RESPONSE_SIZE) {
      return NextResponse.json(
        { error: 'Response exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Verify message exists and allows responses
    const message = await databases.getDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      id
    );

    if (!message.allowResponse) {
      return NextResponse.json(
        { error: 'Responses are not enabled for this message' },
        { status: 403 }
      );
    }

    // Create response using admin client
    const { databases: adminDatabases } = createAdminClient();

    const response = await adminDatabases.createDocument(
      DATABASE_ID,
      RESPONSES_COLLECTION_ID,
      ID.unique(),
      {
        messageId: id,
        content: content,
        createdAt: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      { success: true, responseId: response.$id },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === 404) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}

// GET: Retrieve responses (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const adminToken = searchParams.get('adminToken');

    if (!adminToken) {
      return NextResponse.json(
        { error: 'Admin token required' },
        { status: 401 }
      );
    }

    const { databases: adminDatabases } = createAdminClient();

    // Verify admin token
    const message = await adminDatabases.getDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      id
    );

    if (message.adminToken !== adminToken) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 403 }
      );
    }

    // Fetch all responses for this message
    const responses = await adminDatabases.listDocuments(
      DATABASE_ID,
      RESPONSES_COLLECTION_ID,
      [Query.equal('messageId', id), Query.orderDesc('createdAt')]
    );

    return NextResponse.json({
      responses: responses.documents.map((doc) => ({
        id: doc.$id,
        content: doc.content,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error: any) {
    if (error?.code === 404) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
