import ExcelJS from 'exceljs';

export async function exportToExcel(data: any[], fileName: string, sheetName = 'Sheet1') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  
  if (data.length > 0) {
    const columns = Object.keys(data[0]).map(key => ({ header: key, key: key }));
    worksheet.columns = columns;
    data.forEach(item => worksheet.addRow(item));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Formats a list of transactions for Excel export
 */
export function formatTransactionsForExport(transactions: any[]) {
  return transactions.map((tx) => ({
    Date: new Date(tx.date).toLocaleDateString(),
    Type: tx.type,
    Description: tx.description || tx.remarks || '-',
    'Money In': tx.type === 'INCOME' || tx.type === 'PAYMENT_IN' ? Number(tx.amount) : 0,
    'Money Out': tx.type === 'EXPENSE' || tx.type === 'PAYMENT_OUT' ? Number(tx.amount) : 0,
    Method: tx.paymentMethod || 'CASH',
  }));
}
