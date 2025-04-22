export function generateTCGCSV(
    labels: { tracking: string }[],
    orders: { orderNumber: string }[]
  ) {
    const header = ['Order #', 'Tracking #', 'Carrier'];
    const rows = labels.map((label, i) => [
      orders[i]?.orderNumber || '',
      label.tracking,
      'USPS', // Hardcoded for now; can be dynamic later
    ]);
  
    const csvContent = [header, ...rows]
      .map((row) => row.map((val) => `"${val}"`).join(','))
      .join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tcgplayer_tracking_upload.csv';
    a.click();
  }
  