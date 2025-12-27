'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { encryptMessage, hashPassword, decryptMessage } from '@/lib/crypto';

interface Response {
  id: string;
  content: string;
  createdAt: string;
}

interface MessageData {
  content: string;
  isEncrypted: boolean;
}

export default function AdminPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const messageId = params.id as string;
  const adminToken = searchParams.get('token') || '';

  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageData, setMessageData] = useState<MessageData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (adminToken) {
      fetchData();
    }
  }, [messageId, adminToken]);

  const fetchData = async () => {
    try {
      // Fetch message data
      const msgRes = await fetch(`/api/messages/${messageId}`);
      if (!msgRes.ok) {
        throw new Error('Failed to fetch message');
      }
      const msgData = await msgRes.json();
      setMessageData(msgData);

      // Fetch responses
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

  const handleStartEdit = async () => {
    if (!messageData) return;
    
    setIsEditing(true);
    setError('');
    
    // If message is encrypted, we need the password to decrypt it first
    if (messageData.isEncrypted) {
      // User will need to provide password to decrypt
      setEditContent('');
    } else {
      setEditContent(messageData.content);
    }
  };

  const handleDecryptForEdit = async () => {
    if (!messageData || !currentPassword) return;
    
    try {
      const decrypted = await decryptMessage(messageData.content, currentPassword);
      setEditContent(decrypted);
      setEditPassword(currentPassword);
      setError('');
    } catch (err: any) {
      setError('DECRYPTION FAILED. INVALID PASSWORD.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    
    setSaving(true);
    setError('');
    
    try {
      let finalContent = editContent;
      let passwordHashValue = null;
      
      // If message was encrypted, re-encrypt with same password
      if (messageData?.isEncrypted && editPassword) {
        finalContent = await encryptMessage(editContent, editPassword);
        passwordHashValue = await hashPassword(editPassword);
      }
      
      const updateData: any = {
        adminToken,
        content: finalContent,
      };
      
      if (passwordHashValue) {
        updateData.passwordHash = passwordHashValue;
      }
      
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update message');
      }
      
      setIsEditing(false);
      setEditContent('');
      setEditPassword('');
      setCurrentPassword('');
      await fetchData();
      alert('MESSAGE UPDATED SUCCESSFULLY');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!messageData) return;
    
    setSavingPassword(true);
    setError('');
    
    try {
      let finalContent = messageData.content;
      let wasEncrypted = messageData.isEncrypted;
      
      // If currently encrypted, decrypt with current password first
      if (wasEncrypted && currentPassword) {
        const decrypted = await decryptMessage(messageData.content, currentPassword);
        // Re-encrypt with new password
        finalContent = await encryptMessage(decrypted, newPassword);
      } else if (!wasEncrypted) {
        // If not encrypted, encrypt with new password
        finalContent = await encryptMessage(messageData.content, newPassword);
      } else {
        throw new Error('Current password required to change password');
      }
      
      const passwordHashValue = await hashPassword(newPassword);
      
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminToken,
          content: finalContent,
          passwordHash: passwordHashValue,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update password');
      }
      
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      await fetchData();
      alert('PASSWORD UPDATED SUCCESSFULLY');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingPassword(false);
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

            {/* Edit Message Section */}
            {isEditing ? (
              <div className="space-y-4">
                <div className="terminal-label">EDIT MESSAGE CONTENT</div>
                
                {messageData?.isEncrypted && !editContent && (
                  <div className="space-y-4">
                    <div className="terminal-hint">Enter current password to decrypt and edit:</div>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="terminal-input w-full"
                      placeholder="Current password"
                    />
                    <button
                      onClick={handleDecryptForEdit}
                      className="terminal-button w-full"
                    >
                      DECRYPT FOR EDITING
                    </button>
                  </div>
                )}
                
                {(!messageData?.isEncrypted || editContent) && (
                  <>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={8}
                      className="terminal-textarea"
                      placeholder="Message content..."
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving || !editContent.trim()}
                        className="terminal-button flex-1"
                      >
                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditContent('');
                          setCurrentPassword('');
                          setError('');
                        }}
                        className="terminal-button flex-1"
                      >
                        CANCEL
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : isChangingPassword ? (
              <div className="space-y-4">
                <div className="terminal-label">CHANGE MESSAGE PASSWORD</div>
                
                {messageData?.isEncrypted && (
                  <>
                    <div className="terminal-hint">Current password:</div>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="terminal-input w-full"
                      placeholder="Current password"
                    />
                  </>
                )}
                
                <div className="terminal-hint">
                  {messageData?.isEncrypted ? 'New password:' : 'Set password (message will be encrypted):'}
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="terminal-input w-full"
                  placeholder="New password"
                />
                
                <div className="terminal-hint">Confirm password:</div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="terminal-input w-full"
                  placeholder="Confirm password"
                />
                
                <div className="flex gap-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={savingPassword || !newPassword || !confirmPassword}
                    className="terminal-button flex-1"
                  >
                    {savingPassword ? 'SAVING...' : 'CHANGE PASSWORD'}
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setCurrentPassword('');
                      setError('');
                    }}
                    className="terminal-button flex-1"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Link
                    href={`/m/${messageId}`}
                    className="terminal-button flex-1 text-center"
                  >
                    VIEW MESSAGE
                  </Link>
                  <button
                    onClick={handleStartEdit}
                    className="terminal-button flex-1"
                  >
                    EDIT MESSAGE
                  </button>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="terminal-button flex-1"
                  >
                    {messageData?.isEncrypted ? 'CHANGE PASSWORD' : 'ADD PASSWORD'}
                  </button>
                  <button
                    onClick={handleDestroy}
                    className="terminal-button-danger flex-1"
                  >
                    DESTROY MESSAGE
                  </button>
                </div>
              </div>
            )}

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
