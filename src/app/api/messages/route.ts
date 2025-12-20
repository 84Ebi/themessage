import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ID } from 'appwrite';
import {
  createAdminClient,
  DATABASE_ID,
  MESSAGES_COLLECTION_ID,
} from '@/lib/appwrite';
import type { CreateMessagePayload, CreateMessageResponse } from '@/types';

const MAX_MESSAGE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const EXPIRATION_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const body: CreateMessagePayload = await request.json();

    // Validate payload
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Check message size (2MB limit)
    const messageSize = new Blob([body.message]).size;
    if (messageSize > MAX_MESSAGE_SIZE) {
      return NextResponse.json(
        { error: 'Message exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Generate unique message ID and admin token
    const messageId = nanoid(21); // URL-safe unique ID
    const adminToken = nanoid(32); // Secure admin token

    // Calculate expiration date (30 days from now)
    const createdAt = new Date();
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + EXPIRATION_DAYS);

    // Create message document in Appwrite
    const { databases } = createAdminClient();

    const messageDoc = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      messageId,
      {
        content: body.message, // Client handles encryption
        passwordHash: body.password || null, // Client sends hash if password set
        allowResponse: body.allowResponse || false,
        adminToken: adminToken,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      }
    );

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const messageUrl = `${baseUrl}/m/${messageId}`;
    const adminUrl = `${baseUrl}/admin/${messageId}?token=${adminToken}`;

    const response: CreateMessageResponse = {
      messageId: messageDoc.$id,
      messageUrl,
      adminUrl,
      adminToken,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
