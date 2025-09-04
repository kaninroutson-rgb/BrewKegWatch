import jsPDF from 'jspdf';
import type { Order, Customer } from '@shared/schema';

export interface OrderWithCustomer extends Order {
  customer: Customer;
}

export async function exportOrdersToPDF(orders: OrderWithCustomer[], startDate: string, endDate: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = 30;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('StoicKegs - Orders Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;

  // Summary Statistics
  const totalOrders = orders.length;
  const totalKegs = orders.reduce((sum, order) => sum + order.totalKegs, 0);
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  doc.setFont('helvetica', 'bold');
  doc.text('Summary:', margin, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Orders: ${totalOrders}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Total Kegs: ${totalKegs}`, margin, yPosition);
  yPosition += 6;
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`, margin, yPosition);
    yPosition += 6;
  });

  yPosition += 15;

  // Beer Type Summary
  const beerTypeCounts: Record<string, number> = {};
  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(itemStr => {
        try {
          const item = JSON.parse(itemStr);
          if (item.quantity > 0) {
            beerTypeCounts[item.beerType] = (beerTypeCounts[item.beerType] || 0) + item.quantity;
          }
        } catch (e) {
          // Skip invalid items
        }
      });
    }
  });

  if (Object.keys(beerTypeCounts).length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Beer Types Ordered:', margin, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    Object.entries(beerTypeCounts).forEach(([beerType, count]) => {
      const displayName = beerType === 'DNA' ? "Don't Need Anything" : beerType;
      doc.text(`${displayName}: ${count} kegs`, margin, yPosition);
      yPosition += 6;
    });
    yPosition += 15;
  }

  // Orders Detail
  doc.setFont('helvetica', 'bold');
  doc.text('Order Details:', margin, yPosition);
  yPosition += 15;

  orders.forEach((order, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 30;
    }

    // Order header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Order #${index + 1}`, margin, yPosition);
    
    // Status badge
    const statusColors: Record<string, string> = {
      pending: '#FEF3C7',
      confirmed: '#DBEAFE', 
      fulfilled: '#D1FAE5',
      cancelled: '#FEE2E2'
    };
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Customer and basic info
    doc.text(`Customer: ${order.customer.name}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Week of: ${new Date(order.weekStartDate).toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Status: ${order.status.toUpperCase()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Total Kegs: ${order.totalKegs}`, margin, yPosition);
    yPosition += 5;

    // Contact info
    if (order.customer.email || order.customer.phone) {
      doc.text(`Contact: ${order.customer.email || ''} ${order.customer.phone || ''}`, margin, yPosition);
      yPosition += 5;
    }

    // Order items
    if (order.items && order.items.length > 0) {
      doc.text('Items:', margin, yPosition);
      yPosition += 5;
      
      order.items.forEach(itemStr => {
        try {
          const item = JSON.parse(itemStr);
          if (item.quantity > 0) {
            const displayName = item.beerType === 'DNA' ? "Don't Need Anything" : item.beerType;
            doc.text(`  • ${displayName}: ${item.quantity}`, margin + 5, yPosition);
            yPosition += 5;
          }
        } catch (e) {
          // Skip invalid items
        }
      });
    }

    // Notes
    if (order.notes) {
      doc.text(`Notes: ${order.notes}`, margin, yPosition);
      yPosition += 5;
    }

    // Created date
    doc.text(`Created: ${new Date(order.createdAt!).toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Separator line
    if (index < orders.length - 1) {
      doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
      yPosition += 5;
    }
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text('StoicKegs Order Report', margin, pageHeight - 10);
  }

  // Generate filename with date range
  const startFormatted = new Date(startDate).toISOString().split('T')[0];
  const endFormatted = new Date(endDate).toISOString().split('T')[0];
  const filename = `StoicKegs_Orders_${startFormatted}_to_${endFormatted}.pdf`;

  // Save the PDF
  doc.save(filename);
}