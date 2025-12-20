export interface Message {
  $id: string;
  content: string; // encrypted if password-protected, plain if not
  passwordHash: string | null; // SHA-256 hash for verification
  allowResponse: boolean;
  adminToken: string; // cryptographically secure token for admin operations
  createdAt: string;
  expiresAt: string; // 30 days from creation
}

export interface Response {
  $id: string;
  messageId: string;
  content: string;
  createdAt: string;
}

export interface CreateMessagePayload {
  message: string;
  password?: string;
  allowResponse?: boolean;
}

export interface CreateMessageResponse {
  messageId: string;
  messageUrl: string;
  adminUrl: string;
  adminToken: string;
}

export interface MessageViewData {
  messageId: string;
  content: string;
  isEncrypted: boolean;
  allowResponse: boolean;
}
