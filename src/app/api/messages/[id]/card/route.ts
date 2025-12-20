import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Readable } from 'stream';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const password = searchParams.get('password') || '';

    // Generate message URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const messageUrl = `${baseUrl}/m/${id}`;

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(messageUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
    });

    // Create PDF
    const doc = new PDFDocument({
      size: [252, 153], // Visit card size (3.5" x 2.5" at 72 DPI)
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Page 1: QR Code
    doc
      .fontSize(10)
      .fillColor('#00ff00')
      .text('SECRET MESSAGE', { align: 'center' });

    doc.moveDown(0.5);

    // Add QR code image
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, {
      fit: [180, 180],
      align: 'center',
      valign: 'center',
    });

    doc.moveDown(0.5);
    doc
      .fontSize(6)
      .fillColor('#00ff00')
      .text(messageUrl, { align: 'center', width: 210 });

    // Page 2: Password (if provided)
    if (password) {
      doc.addPage();
      doc
        .fontSize(10)
        .fillColor('#00ff00')
        .text('DECRYPTION PASSWORD', { align: 'center' });

      doc.moveDown(2);

      doc
        .fontSize(16)
        .fillColor('#00ff00')
        .text(password, { align: 'center' });

      doc.moveDown(2);

      doc
        .fontSize(8)
        .fillColor('#00ff00')
        .text('Keep this password secret', { align: 'center' });
    }

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="message-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate visit card' },
      { status: 500 }
    );
  }
}
