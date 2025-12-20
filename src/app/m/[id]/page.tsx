'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { decryptMessage } from '@/lib/crypto';
import type { MessageViewData } from '@/types';

export default function MessageViewPage() {
  const params = useParams();
  const messageId = params.id as string;

  const [message, setMessage] = useState<MessageViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [response, setResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);

  useEffect(() => {
    fetchMessage();
  }, [messageId]);

  const fetchMessage = async () => {
    try {
      const res = await fetch(`/api/messages/${messageId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Message not found');
      }
      const data: MessageViewData = await res.json();
      setMessage(data);

      // If not encrypted, show content immediately
      if (!data.isEncrypted) {
        setDecryptedContent(data.content);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !password) return;

    setDecrypting(true);
    setError('');

    try {
      const decrypted = await decryptMessage(message.content, password);
      setDecryptedContent(decrypted);
    } catch (err: any) {
      setError('DECRYPTION FAILED. INVALID PASSWORD.');
    } finally {
      setDecrypting(false);
    }
  };

  const handleDestroy = async () => {
    if (!confirm('DESTROY THIS MESSAGE PERMANENTLY? THIS CANNOT BE UNDONE.')) {
      return;
    }

    try {
      // Try to get admin token from localStorage
      const adminToken = localStorage.getItem(`admin_${messageId}`);
      
      const res = await fetch(`/api/messages/${messageId}/destroy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken }),
      });

      if (!res.ok) {
        throw new Error('Failed to destroy message');
      }

      setDecryptedContent('');
      setError('MESSAGE DESTROYED. THIS LINK IS NOW INVALID.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;

    setSubmittingResponse(true);
    try {
      const res = await fetch(`/api/messages/${messageId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: response }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit response');
      }

      setResponse('');
      setResponseSuccess(true);
      setTimeout(() => setResponseSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="terminal-loading">LOADING MESSAGE...</div>
      </div>
    );
  }

  if (error && !message) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="terminal-error-box">
          ERROR: {error}
        </div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black p-4 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        {/* Password Entry */}
        {message.isEncrypted && !decryptedContent && (
          <div className="terminal-box-minimal">
            <form onSubmit={handleDecrypt} className="space-y-4">
              <div className="terminal-label">ENTER PASSWORD TO DECRYPT:</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="terminal-input w-full"
                placeholder="PASSWORD"
              />
              {error && <div className="terminal-error">{error}</div>}
              <button
                type="submit"
                disabled={decrypting || !password}
                className="terminal-button w-full"
              >
                {decrypting ? 'DECRYPTING...' : 'DECRYPT MESSAGE'}
              </button>
            </form>
          </div>
        )}

        {/* Message Content */}
        {decryptedContent && (
          <div className="space-y-6">
            <div className="terminal-box-minimal">
              <div className="terminal-message-content">
                {decryptedContent}
              </div>
            </div>

            {/* Response Input */}
            {message.allowResponse && (
              <div className="terminal-box-minimal">
                <form onSubmit={handleSubmitResponse} className="space-y-4">
                  <div className="terminal-label">SUBMIT ANONYMOUS RESPONSE:</div>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                    className="terminal-textarea"
                    placeholder="Your response..."
                  />
                  {responseSuccess && (
                    <div className="terminal-success">✓ RESPONSE SUBMITTED</div>
                  )}
                  <button
                    type="submit"
                    disabled={submittingResponse || !response.trim()}
                    className="terminal-button w-full"
                  >
                    {submittingResponse ? 'SUBMITTING...' : 'SUBMIT RESPONSE'}
                  </button>
                </form>
              </div>
            )}

            {/* Destroy Button */}
            <div className="terminal-box-minimal">
              <button
                onClick={handleDestroy}
                className="terminal-button-danger w-full"
              >
                DESTROY MESSAGE
              </button>
            </div>

            {error && (
              <div className="terminal-error-box">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
