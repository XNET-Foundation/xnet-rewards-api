import { google } from 'googleapis';
import path from 'path';
import { sheets_v4 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || 'secrets/xnet-rewards-api-cca066178d1f.json';

console.log('Initializing Google Sheets with credentials path:', path.resolve(process.cwd(), CREDENTIALS_PATH));

// Hybrid authentication function
function getGoogleAuth() {
  // Check if we're on Vercel (GCP integration)
  if (process.env.GCP_PRIVATE_KEY) {
    console.log('🔐 Using Vercel GCP Integration');
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines
      },
      projectId: process.env.GCP_PROJECT_ID,
      scopes: SCOPES,
    });
  } else {
    // Fall back to local file-based authentication
    console.log('🔑 Using Local Secret File');
    return new google.auth.GoogleAuth({
      keyFile: path.resolve(process.cwd(), CREDENTIALS_PATH),
      scopes: SCOPES,
    });
  }
}

const auth = getGoogleAuth();
const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const DATA_SHEET_GID = '451580614'; // Data Rewards sheet
const BONUS_SHEET_GID = '425107781'; // Bonus Rewards sheet
const POC_SHEET_GID = '0'; // PoC Rewards sheet

console.log('Sheet configuration:', {
  sheetId: SHEET_ID,
  dataSheetGid: DATA_SHEET_GID,
  bonusSheetGid: BONUS_SHEET_GID,
  pocSheetGid: POC_SHEET_GID,
  credentialsExist: !!CREDENTIALS_PATH,
  currentWorkingDirectory: process.cwd(),
  usingVercelGCP: !!process.env.GCP_PRIVATE_KEY,
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

// Helper function to fetch a specific sheet by GID
async function fetchSheetByGid(gid: string, sheetName: string): Promise<DeviceData[]> {
  try {
    console.log(`Fetching ${sheetName} sheet with GID: ${gid}`);
    
    // Get the sheet metadata to verify access
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });
    
    // Find the sheet by GID
    const targetSheet = metadataResponse.data.sheets?.find(
      sheet => sheet.properties?.sheetId?.toString() === gid
    );

    if (!targetSheet?.properties?.title) {
      throw new Error(`Sheet with GID ${gid} not found`);
    }

    console.log(`Found ${sheetName} sheet:`, {
      title: targetSheet.properties.title,
      gid: targetSheet.properties.sheetId,
      rowCount: targetSheet.properties.gridProperties?.rowCount,
      columnCount: targetSheet.properties.gridProperties?.columnCount,
    });

    // Fetch the sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: targetSheet.properties.title,
    });

    const data = response.data;
    console.log(`${sheetName} sheet data response:`, {
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
    console.error(`Error fetching ${sheetName} sheet:`, {
      message: error.message,
      status: error.status,
      code: error.code,
      gid: gid,
    });
    throw error;
  }
}

// Fetch data rewards sheet
export async function fetchDataRewardsSheet(): Promise<DeviceData[]> {
  return fetchSheetByGid(DATA_SHEET_GID, 'Data Rewards');
}

// Fetch bonus rewards sheet
export async function fetchBonusRewardsSheet(): Promise<DeviceData[]> {
  return fetchSheetByGid(BONUS_SHEET_GID, 'Bonus Rewards');
}

// Fetch PoC rewards sheet
export async function fetchPocRewardsSheet(): Promise<DeviceData[]> {
  return fetchSheetByGid(POC_SHEET_GID, 'PoC Rewards');
}

