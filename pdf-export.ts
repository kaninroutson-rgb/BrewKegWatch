import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface KegQRData {
  id: string;
  qrCode: string;
}

export async function exportKegQRCodesPDF(kegs: KegQRData[], filename: string = 'keg-qr-codes.pdf') {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // QR code dimensions and layout
  const qrSize = 60; // QR code size in mm
  const margin = 20;
  const labelHeight = 15;
  const itemHeight = qrSize + labelHeight + 10;
  const itemsPerRow = 2;
  const itemsPerPage = 6; // 2 columns, 3 rows
  
  let currentPage = 0;
  let itemsOnCurrentPage = 0;

  for (let i = 0; i < kegs.length; i++) {
    const keg = kegs[i];
    
    // Add new page if needed
    if (itemsOnCurrentPage === 0) {
      if (currentPage > 0) {
        pdf.addPage();
      }
      currentPage++;
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('StoicKegs QR Codes', pageWidth / 2, 15, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });
    }
    
    // Calculate position
    const row = Math.floor(itemsOnCurrentPage / itemsPerRow);
    const col = itemsOnCurrentPage % itemsPerRow;
    
    const x = margin + (col * (pageWidth - 2 * margin) / itemsPerRow);
    const y = 35 + (row * itemHeight);
    
    try {
      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(keg.qrCode, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Add QR code image
      pdf.addImage(qrDataURL, 'PNG', x, y, qrSize, qrSize);
      
      // Add keg ID label
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(keg.id, x + qrSize / 2, y + qrSize + 8, { align: 'center' });
      
      // Add QR code text
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(keg.qrCode, x + qrSize / 2, y + qrSize + 13, { align: 'center' });
      
    } catch (error) {
      console.error('Error generating QR code for keg:', keg.id, error);
      
      // Add error placeholder
      pdf.setFillColor(240, 240, 240);
      pdf.rect(x, y, qrSize, qrSize, 'F');
      pdf.setFontSize(10);
      pdf.text('QR Error', x + qrSize / 2, y + qrSize / 2, { align: 'center' });
    }
    
    itemsOnCurrentPage++;
    
    // Reset counter if page is full
    if (itemsOnCurrentPage >= itemsPerPage) {
      itemsOnCurrentPage = 0;
    }
  }
  
  // Save the PDF
  pdf.save(filename);
}