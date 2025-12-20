'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { encryptMessage, hashPassword, generateSecureToken } from '@/lib/crypto';
import type { CreateMessagePayload, CreateMessageResponse } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [allowResponse, setAllowResponse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate message size (2MB limit)
      const messageSize = new Blob([message]).size;
      if (messageSize > 2 * 1024 * 1024) {
        throw new Error('Message exceeds 2MB limit');
      }

      let finalMessage = message;
      let passwordHashValue = null;

      // If password is provided, encrypt message client-side
      if (password.trim()) {
        finalMessage = await encryptMessage(message, password);
        passwordHashValue = await hashPassword(password);
      }

      // Create message payload
      const payload: CreateMessagePayload & { passwordHash?: string } = {
        message: finalMessage,
        allowResponse,
      };

      if (passwordHashValue) {
        payload.password = passwordHashValue;
      }

      // Send to API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create message');
      }

      const data: CreateMessageResponse = await response.json();

      // Store admin token in localStorage for this session
      localStorage.setItem(`admin_${data.messageId}`, data.adminToken);

      // Navigate to success page with URLs
      const params = new URLSearchParams({
        messageUrl: data.messageUrl,
        adminUrl: data.adminUrl,
        hasPassword: password ? 'true' : 'false',
        password: password || '',
      });

      router.push(`/success?${params.toString()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="terminal-card">
          <div className="terminal-header">
            <span className="terminal-title">CREATE ENCRYPTED MESSAGE</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {error && (
              <div className="terminal-error">
                ERROR: {error}
              </div>
            )}

            <div>
              <label htmlFor="message" className="terminal-label">
                MESSAGE CONTENT *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={8}
                maxLength={2097152}
                placeholder="Enter your secret message..."
                className="terminal-textarea"
              />
              <div className="terminal-hint">
                {Math.round((new Blob([message]).size / 1024 / 1024) * 100) / 100} MB / 2 MB
              </div>
            </div>

            <div>
              <label htmlFor="password" className="terminal-label">
                PASSWORD (OPTIONAL)
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for no encryption"
                className="terminal-input"
              />
              <div className="terminal-hint">
                If set, message will be encrypted client-side
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowResponse"
                checked={allowResponse}
                onChange={(e) => setAllowResponse(e.target.checked)}
                className="terminal-checkbox"
              />
              <label htmlFor="allowResponse" className="terminal-label-inline">
                ALLOW ANONYMOUS RESPONSES
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="terminal-button w-full"
            >
              {loading ? 'CREATING...' : 'CREATE MESSAGE'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
