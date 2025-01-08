import { type AxiosResponse } from 'axios';

export function forceFileDownload(
  response: AxiosResponse,
  fileName = 'unknown',
) {
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let name = fileName ?? 'unknown';
  if (contentDisposition) {
    const fileNameMatch = /filename=(.+)/.exec(contentDisposition);
    if (fileNameMatch?.length === 2) {
      [, name] = fileNameMatch;
    }
  }

  link.setAttribute('download', name);
  document.body.append(link);
  link.href = url;
  link.target = '_blank';
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function convertToCSV(objectArray: any[] | string) {
  const array =
    typeof objectArray === 'object' ? objectArray : JSON.parse(objectArray);
  let string_ = '';

  for (const element of array) {
    let line = '';
    for (const index of Object.keys(element)) {
      if (line !== '') line += ',';
      line += element[index];
    }

    string_ += `${line}\r\n`;
  }

  return string_;
}

export function exportCSVFile(
  headers: Record<any, any>,
  items: any[],
  fileTitle: string,
) {
  if (headers) {
    items.unshift(headers);
  }

  // Convert Object to JSON
  const jsonObject = JSON.stringify(items);

  const csv = convertToCSV(jsonObject);

  const exportedFilename = `${fileTitle ?? 'export'}.csv`;
  downloadCSVFile(csv, exportedFilename);
}

export function downloadCSVFile(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.append(link);
  link.click();
  link.remove();
}

export function forceFileDownloadFromURl(url: string, fileName = 'unknown') {
  const link = document.createElement('a');
  link.href = url;
  const name = fileName ?? 'unknown';
  link.setAttribute('download', name);
  document.body.append(link);
  link.href = url;
  // link.target = '_blank';
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
