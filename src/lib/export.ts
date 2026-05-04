import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], fileName: string, sheetName = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
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
