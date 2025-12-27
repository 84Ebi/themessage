import { NextRequest, NextResponse } from 'next/server';
import {
  databases,
  createAdminClient,
  DATABASE_ID,
  MESSAGES_COLLECTION_ID,
} from '@/lib/appwrite';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch message from Appwrite
    const message = await databases.getDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      id
    );

    // Return only public fields (no admin token)
    return NextResponse.json({
      messageId: message.$id,
      content: message.content,
      isEncrypted: !!message.passwordHash,
      allowResponse: message.allowResponse,
    });
  } catch (error: any) {
    if (error?.code === 404) {
      return NextResponse.json(
        { error: 'Message not found or has been destroyed' },
        { status: 404 }
      );
    }

    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminToken, content, passwordHash } = body;

    if (!adminToken) {
      return NextResponse.json(
        { error: 'Admin token is required' },
        { status: 400 }
      );
    }

    const { databases: adminDb } = createAdminClient();

    // Fetch the message to verify admin token
    const message = await adminDb.getDocument(
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

    // Prepare update data
    const updateData: any = {};
    if (content !== undefined) {
      updateData.content = content;
    }
    if (passwordHash !== undefined) {
      updateData.passwordHash = passwordHash;
    }

    // Update the message
    const updatedMessage = await adminDb.updateDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      id,
      updateData
    );

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully',
      messageId: updatedMessage.$id,
    });
  } catch (error: any) {
    if (error?.code === 404) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}
