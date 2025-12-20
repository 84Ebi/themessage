'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const messageUrl = searchParams.get('messageUrl') || '';
  const adminUrl = searchParams.get('adminUrl') || '';
  const hasPassword = searchParams.get('hasPassword') === 'true';
  const password = searchParams.get('password') || '';

  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  const copyToClipboard = (text: string, type: 'message' | 'admin') => {
    navigator.clipboard.writeText(text);
    if (type === 'message') {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } else {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
    }
  };

  const handlePrintCard = () => {
    const messageId = messageUrl.split('/m/')[1];
    window.open(`/api/messages/${messageId}/card?password=${encodeURIComponent(password)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="terminal-card">
          <div className="terminal-header">
            <span className="terminal-title">MESSAGE CREATED SUCCESSFULLY</span>
          </div>

          <div className="space-y-6 p-6">
            <div className="terminal-success">
              ✓ YOUR SECRET MESSAGE HAS BEEN CREATED
            </div>

            <div>
              <div className="terminal-label">SHAREABLE MESSAGE URL:</div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={messageUrl}
                  readOnly
                  className="terminal-input flex-1"
                />
                <button
                  onClick={() => copyToClipboard(messageUrl, 'message')}
                  className="terminal-button-small"
                >
                  {copiedMessage ? 'COPIED!' : 'COPY'}
                </button>
              </div>
              <div className="terminal-hint">
                Share this link with the recipient
              </div>
            </div>

            <div>
              <div className="terminal-label">ADMIN URL (KEEP SECRET):</div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={adminUrl}
                  readOnly
                  className="terminal-input flex-1"
                />
                <button
                  onClick={() => copyToClipboard(adminUrl, 'admin')}
                  className="terminal-button-small"
                >
                  {copiedAdmin ? 'COPIED!' : 'COPY'}
                </button>
              </div>
              <div className="terminal-hint">
                Use this link to view responses or destroy the message
              </div>
            </div>

            {hasPassword && (
              <div>
                <div className="terminal-label">PASSWORD:</div>
                <div className="terminal-box">
                  {password}
                </div>
                <div className="terminal-hint">
                  The recipient will need this password to decrypt the message
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handlePrintCard}
                className="terminal-button flex-1"
              >
                PRINT VISIT CARD (QR + PASSWORD)
              </button>
              <Link href="/" className="terminal-button flex-1 text-center">
                CREATE ANOTHER MESSAGE
              </Link>
            </div>

            <div className="terminal-warning">
              ⚠ SAVE THE ADMIN URL - YOU WILL NOT SEE IT AGAIN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="terminal-loading">LOADING...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
