'use client';

import { useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { encryptMessage, hashPassword } from '@/lib/crypto';
import type { CreateMessagePayload, CreateMessageResponse } from '@/types';

interface MessageData {
  content: string;
  password: string;
  url: string;
  adminUrl: string;
  qrCodeDataUrl: string;
}

export default function SamplePage() {
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [error, setError] = useState('');

  // Generate random 8 character password
  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateMessages = async () => {
    setGenerating(true);
    setError('');
    setMessages([]);

    try {
      const newMessages: MessageData[] = [];

      // Generate 10 messages
      for (let i = 1; i <= 10; i++) {
        const content = `Message ${i}`;
        const password = generatePassword();

        // Encrypt message
        const encryptedContent = await encryptMessage(content, password);
        const passwordHashValue = await hashPassword(password);

        // Create message via API
        const payload: CreateMessagePayload & { passwordHash?: string } = {
          message: encryptedContent,
          allowResponse: false,
          password: passwordHashValue,
        };

        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to create message ${i}`);
        }

        const data: CreateMessageResponse = await response.json();

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(data.messageUrl, {
          width: 300,
          margin: 2,
        });

        newMessages.push({
          content,
          password,
          url: data.messageUrl,
          adminUrl: data.adminUrl,
          qrCodeDataUrl,
        });
      }

      setMessages(newMessages);
    } catch (err: any) {
      setError(err.message || 'Failed to generate messages');
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = async () => {
    if (messages.length === 0) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // A4 dimensions: 210mm x 297mm
    // Card dimensions: 85mm x 55mm (credit card size)
    const pageWidth = 210;
    const pageHeight = 297;
    const cardWidth = 85;
    const cardHeight = 55;
    
    // Calculate layout for 2 columns x 5 rows
    const cols = 2;
    const rows = 5;
    
    // Center the cards on the page
    const totalWidth = cols * cardWidth;
    const totalHeight = rows * cardHeight;
    const startX = (pageWidth - totalWidth) / 2;
    const startY = (pageHeight - totalHeight) / 2;

    // PAGE 1: QR Codes

    for (let i = 0; i < messages.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = startX + col * cardWidth;
      const y = startY + row * cardHeight;

      // Draw card border (solid line)
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, cardWidth, cardHeight);

      // Draw cutting lines (light gray lines extending beyond card)
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.2);
      
      // Vertical cutting lines
      if (col === 0) {
        pdf.line(x, 0, x, pageHeight); // Left edge
      }
      pdf.line(x + cardWidth, 0, x + cardWidth, pageHeight); // Right edge of each card
      
      // Horizontal cutting lines
      if (row === 0) {
        pdf.line(0, y, pageWidth, y); // Top edge
      }
      pdf.line(0, y + cardHeight, pageWidth, y + cardHeight); // Bottom edge of each card

      // Calculate QR code size and position (centered in card with some padding)
      const qrSize = 25;
      const qrX = x + (cardWidth - qrSize) / 2;
      const qrY = y + (cardHeight - qrSize) / 2;

      // Add QR code
      pdf.addImage(messages[i].qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Add message number below QR code
      pdf.setFontSize(10);
      pdf.setDrawColor(0);
 
    }

    // PAGE 2: Passwords
    pdf.addPage();
    for (let i = 0; i < messages.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = startX + col * cardWidth;
      const y = startY + row * cardHeight;

      // Draw card border (solid line)
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, cardWidth, cardHeight);

      // Draw cutting lines (light gray lines)
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.2);
      
      // Vertical cutting lines
      if (col === 0) {
        pdf.line(x, 0, x, pageHeight);
      }
      pdf.line(x + cardWidth, 0, x + cardWidth, pageHeight);
      
      // Horizontal cutting lines
      if (row === 0) {
        pdf.line(0, y, pageWidth, y);
      }
      pdf.line(0, y + cardHeight, pageWidth, y + cardHeight);

      // Add password box with styling
      const contentY = y + cardHeight / 2 - 8;

      // Add text

      pdf.setFontSize(14);
      pdf.setTextColor(0);
      pdf.setFont('Ziracode', 'regular');
      pdf.text(messages[i].password, x + cardWidth / 2, contentY + 12, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
    }

    // Save PDF
    pdf.save('message-qr-codes.pdf');
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="terminal-card">
          <div className="terminal-header">
            <span className="terminal-title">SECRET SAMPLE GENERATOR</span>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="terminal-error-box">ERROR: {error}</div>
            )}

            <div className="space-y-4">
              <button
                onClick={generateMessages}
                disabled={generating}
                className="terminal-button w-full"
              >
                {generating ? 'GENERATING 10 MESSAGES...' : 'GENERATE 10 MESSAGES'}
              </button>

              {messages.length > 0 && (
                <>
                  <button
                    onClick={generatePDF}
                    className="terminal-button w-full"
                  >
                    DOWNLOAD PDF WITH QR CODES
                  </button>

                  <div className="terminal-box">
                    <div className="terminal-label mb-4">
                      GENERATED MESSAGES ({messages.length})
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {messages.map((msg, index) => (
                        <div key={index} className="border border-green-500 p-4">
                          <div className="terminal-hint mb-2">
                            Message {index + 1}
                          </div>
                          <div className="mb-2">
                            <img
                              src={msg.qrCodeDataUrl}
                              alt={`QR Code ${index + 1}`}
                              className="w-32 h-32"
                            />
                          </div>
                          <div className="text-xs break-all mb-1">
                            <span className="text-green-500">URL:</span> {msg.url}
                          </div>
                          <div className="text-xs break-all mb-1">
                            <span className="text-green-500">Admin:</span> {msg.adminUrl}
                          </div>
                          <div className="text-xs">
                            <span className="text-green-500">Password:</span>{' '}
                            <span className="font-mono font-bold">{msg.password}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
