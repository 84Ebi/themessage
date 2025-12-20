import { NextRequest, NextResponse } from 'next/server';
import {
  databases,
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
