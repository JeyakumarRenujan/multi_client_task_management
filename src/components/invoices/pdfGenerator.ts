import jsPDF from 'jspdf';
import { Invoice, UserProfile } from '../../types';

export const downloadInvoicePdf = (invoice: Invoice, user?: UserProfile | null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = invoice.currency || user?.currency || '$';
  const totalAmount = invoice.total ?? (invoice as any).totalAmount ?? 0;
  const isPaid = invoice.status === 'paid';

  // Top Accent Bar
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, 210, 16, 'F');

  // App / Brand Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ME PLUS • FREELANCE INVOICE', 15, 11);

  // Main INVOICE Header
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 15, 34);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 15, 41);

  // Status Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (isPaid) {
    doc.setFillColor(209, 250, 229); // emerald 100
    doc.setTextColor(6, 95, 70); // emerald 800
    doc.roundedRect(15, 46, 28, 7, 2, 2, 'F');
    doc.text('PAID IN FULL', 17.5, 50.8);
  } else if (invoice.status === 'sent') {
    doc.setFillColor(254, 243, 199); // amber 100
    doc.setTextColor(146, 64, 14); // amber 800
    doc.roundedRect(15, 46, 38, 7, 2, 2, 'F');
    doc.text('AWAITING PAYMENT', 17.5, 50.8);
  } else if (invoice.status === 'overdue') {
    doc.setFillColor(254, 226, 226); // rose 100
    doc.setTextColor(153, 27, 27); // rose 800
    doc.roundedRect(15, 46, 24, 7, 2, 2, 'F');
    doc.text('OVERDUE', 17.5, 50.8);
  } else {
    doc.setFillColor(241, 245, 249); // slate 100
    doc.setTextColor(71, 85, 105);
    doc.roundedRect(15, 46, 20, 7, 2, 2, 'F');
    doc.text('DRAFT', 17.5, 50.8);
  }

  // From Freelancer (Top Right)
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(user?.name || 'Freelancer', 195, 33, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  if (user?.title) doc.text(user.title, 195, 39, { align: 'right' });
  if (user?.email) doc.text(user.email, 195, 44, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 58, 195, 58);

  // Billing Details (Left: Client, Right: Dates)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('BILLED TO:', 15, 68);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(invoice.clientCompany || 'Client Organization', 15, 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (invoice.clientName) doc.text(`Attn: ${invoice.clientName}`, 15, 81);
  if (invoice.clientEmail) doc.text(invoice.clientEmail, 15, 86);

  // Dates (Right side)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Issue Date:', 140, 68);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(invoice.issueDate, 195, 68, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Due:', 140, 75);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(invoice.dueDate, 195, 75, { align: 'right' });

  // Deliverables Table Header
  const tableTop = 96;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.rect(15, tableTop, 180, 9, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, tableTop, 180, 9, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION / DELIVERABLES', 20, tableTop + 6);
  doc.text('AMOUNT', 190, tableTop + 6, { align: 'right' });

  // Deliverables Rows
  let curY = tableTop + 9;
  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [{ description: 'Project Deliverables', amount: totalAmount }];

  items.forEach((item, index) => {
    const rowHeight = 12;
    doc.setFillColor(index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 250);
    doc.rect(15, curY, 180, rowHeight, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(15, curY + rowHeight, 195, curY + rowHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(item.description || 'Deliverable', 20, curY + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.text(`${currency}${(item.amount || 0).toLocaleString()}`, 190, curY + 7.5, { align: 'right' });

    curY += rowHeight;
  });

  // Total Summary Block
  curY += 8;
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.roundedRect(120, curY, 75, 20, 3, 3, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(120, curY, 75, 20, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.text('TOTAL AMOUNT:', 125, curY + 8);

  doc.setFontSize(14);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(`${currency}${totalAmount.toLocaleString()}`, 190, curY + 15, { align: 'right' });

  // If Paid, stamp
  if (isPaid) {
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.roundedRect(15, curY, 55, 18, 3, 3, 'S');
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID IN FULL', 42.5, curY + 11.5, { align: 'center' });
  }

  // Footer Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated via Me Plus • Multi-Client Task Management Platform', 105, 285, { align: 'center' });

  // Direct PDF Download
  doc.save(`Invoice-${invoice.invoiceNumber || 'INV'}.pdf`);
};

