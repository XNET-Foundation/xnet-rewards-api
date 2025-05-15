import { google } from 'googleapis';
import path from 'path';

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

export async function fetchRewardsSheet() {
  try {
    console.log('Fetching service account details...');
    const client = await auth.getClient();
    const credentials = await auth.getCredentials();
    console.log('Service account details:', {
      email: credentials.client_email,
      type: credentials.type,
      projectId: credentials.project_id,
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

    if (!targetSheet) {
      throw new Error(`Sheet with GID ${SHEET_GID} not found`);
    }

    console.log('Found target sheet:', {
      title: targetSheet.properties?.title,
      gid: targetSheet.properties?.sheetId,
      rowCount: targetSheet.properties?.gridProperties?.rowCount,
      columnCount: targetSheet.properties?.gridProperties?.columnCount,
    });

    console.log('Attempting to fetch sheet data...');
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: targetSheet.properties?.title,
    });

    console.log('Sheet data response:', {
      hasValues: !!data.values,
      rowCount: data.values?.length,
      columnCount: data.values?.[0]?.length,
    });

    const [headers, ...rows] = data.values || [];

    return rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = row[i]?.trim() || '';
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

    // Try to get more auth details in case of failure
    try {
      const tokenInfo = await auth.getTokenInfo(
        (await auth.getClient().getAccessToken()).token || ''
      );
      console.log('Token info:', {
        scopes: tokenInfo.scopes,
        expiryDate: tokenInfo.expiry_date,
      });
    } catch (tokenError) {
      console.error('Failed to get token info:', tokenError);
    }

    throw error;
  }
}

