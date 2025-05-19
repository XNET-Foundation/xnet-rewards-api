import { google } from 'googleapis';
import path from 'path';
import { sheets_v4 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || 'secrets/xnet-rewards-api-cca066178d1f.json';

console.log('Initializing Google Sheets with credentials path:', path.resolve(process.cwd(), CREDENTIALS_PATH));

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(process.cwd(), CREDENTIALS_PATH),
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_GID = '451580614'; // Using GID instead of sheet name

console.log('Sheet configuration:', {
  sheetId: SHEET_ID,
  sheetGid: SHEET_GID,
  credentialsExist: !!CREDENTIALS_PATH,
  currentWorkingDirectory: process.cwd(),
});

export interface DeviceData {
  'MAC Address': string;
  [key: string]: string;
}

// Helper function to clean number strings
function cleanNumberString(value: string): string {
  if (!value) return '0';
  // Remove commas and trim whitespace
  return value.replace(/,/g, '').trim();
}

export async function fetchRewardsSheet(): Promise<DeviceData[]> {
  try {
    console.log('Fetching service account details...');
    const client = await auth.getClient();
    const credentials = await auth.getCredentials();
    console.log('Service account details:', {
      email: credentials.client_email,
    });

    // First, get the sheet metadata to verify access
    console.log('Fetching spreadsheet metadata...');
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });
    
    console.log('Spreadsheet metadata:', {
      title: metadataResponse.data.properties?.title,
      locale: metadataResponse.data.properties?.locale,
      sheets: metadataResponse.data.sheets?.map(sheet => ({
        id: sheet.properties?.sheetId,
        title: sheet.properties?.title,
      }))
    });

    // Find the sheet by GID
    const targetSheet = metadataResponse.data.sheets?.find(
      sheet => sheet.properties?.sheetId?.toString() === SHEET_GID
    );

    if (!targetSheet?.properties?.title) {
      throw new Error(`Sheet with GID ${SHEET_GID} not found`);
    }

    console.log('Found target sheet:', {
      title: targetSheet.properties.title,
      gid: targetSheet.properties.sheetId,
      rowCount: targetSheet.properties.gridProperties?.rowCount,
      columnCount: targetSheet.properties.gridProperties?.columnCount,
    });

    console.log('Attempting to fetch sheet data...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: targetSheet.properties.title,
    });

    const data = response.data;
    console.log('Sheet data response:', {
      hasValues: !!data.values,
      rowCount: data.values?.length,
      columnCount: data.values?.[0]?.length,
    });

    const [headers, ...rows] = data.values || [];

    return rows.map((row: any[]) => {
      const obj: DeviceData = { 'MAC Address': '' };
      headers.forEach((h: string, i: number) => {
        const value = row[i]?.trim() || '';
        // Clean numbers if the header contains 'Epoch'
        obj[h.trim()] = h.includes('Epoch') ? cleanNumberString(value) : value;
      });
      return obj;
    });
  } catch (error: any) {
    console.error('Detailed error information:', {
      message: error.message,
      status: error.status,
      code: error.code,
      errors: error.errors,
      response: error.response?.data,
      config: {
        scopes: SCOPES,
        credentialsPath: path.resolve(process.cwd(), CREDENTIALS_PATH),
        sheetId: SHEET_ID,
        sheetGid: SHEET_GID,
      }
    });

    throw error;
  }
}

