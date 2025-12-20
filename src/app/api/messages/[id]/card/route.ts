import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

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

    // Create PDF (3.5" x 2.5" = 252 x 180 points)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [600, 1050],
    });

    // Page 1: QR Code (centered, no title)
    // Calculate center position for QR code
    const qrSize = 360;
    const qrX = (1050 - qrSize) / 2;
    const qrY = (600 - qrSize) / 2;
    
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Page 2: Password (if provided)
    if (password) {
      doc.addPage();
      
      // Center the password vertically and horizontally with monospace font
      doc.setFont('courier', 'normal');
      doc.setFontSize(52);
      doc.setTextColor(0, 0, 0); // Black color
      doc.text(password, 525, 300, { align: 'center' });
    }

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
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
