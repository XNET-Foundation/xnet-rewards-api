import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON || '');
} catch (e) {
  console.error('Invalid GOOGLE_CREDENTIALS_JSON');
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME = 'Data Rewards - Dispersal'; // 👈 Change this if tab name differs

export async function fetchRewardsSheet() {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}`,
  });

  const [headers, ...rows] = data.values || [];

  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = row[i]?.trim() || '';
    });
    return obj;
  });
}

