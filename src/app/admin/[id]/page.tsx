'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Response {
  id: string;
  content: string;
  createdAt: string;
}

export default function AdminPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const messageId = params.id as string;
  const adminToken = searchParams.get('token') || '';

  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (adminToken) {
      fetchResponses();
    }
  }, [messageId, adminToken]);

  const fetchResponses = async () => {
    try {
      const res = await fetch(
        `/api/messages/${messageId}/responses?adminToken=${adminToken}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch responses');
      }

      const data = await res.json();
      setResponses(data.responses);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDestroy = async () => {
    if (
      !confirm('DESTROY THIS MESSAGE PERMANENTLY? THIS CANNOT BE UNDONE.')
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/messages/${messageId}/destroy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken }),
      });

      if (!res.ok) {
        throw new Error('Failed to destroy message');
      }

      alert('MESSAGE DESTROYED SUCCESSFULLY');
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="terminal-loading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="terminal-card">
          <div className="terminal-header">
            <span className="terminal-title">MESSAGE ADMIN PANEL</span>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="terminal-error-box">ERROR: {error}</div>
            )}

            <div className="flex gap-4">
              <Link
                href={`/m/${messageId}`}
                className="terminal-button flex-1 text-center"
              >
                VIEW MESSAGE
              </Link>
              <button
                onClick={handleDestroy}
                className="terminal-button-danger flex-1"
              >
                DESTROY MESSAGE
              </button>
            </div>

            <div>
              <div className="terminal-label mb-4">
                ANONYMOUS RESPONSES ({responses.length})
              </div>

              {responses.length === 0 ? (
                <div className="terminal-hint">No responses yet</div>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => (
                    <div key={response.id} className="terminal-box">
                      <div className="terminal-hint mb-2">
                        {new Date(response.createdAt).toLocaleString()}
                      </div>
                      <div className="terminal-message-content">
                        {response.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
