import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || 'secrets/xnet-rewards-api-cca066178d1f.json';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const DATA_SHEET_GID = '451580614';
const BONUS_SHEET_GID = '425107781';
const POC_SHEET_GID = '0';
const WIFI_STATS_SHEET_GID = '1785190906';

async function verifyAccess() {
  console.log(chalk.blue('🔍 Starting Google Sheets Access Verification\n'));

  // Step 1: Check if credentials file exists
  console.log(chalk.yellow('Step 1: Checking credentials file...'));
  const credentialsFullPath = path.resolve(process.cwd(), CREDENTIALS_PATH);
  
  try {
    if (!fs.existsSync(credentialsFullPath)) {
      throw new Error(`Credentials file not found at: ${credentialsFullPath}`);
    }
    console.log(chalk.green('✓ Credentials file found'));
    
    // Read and validate credentials structure
    const credentials = JSON.parse(fs.readFileSync(credentialsFullPath, 'utf-8'));
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Credentials file is missing required fields: ${missingFields.join(', ')}`);
    }
    console.log(chalk.green(`✓ Service account email: ${credentials.client_email}`));
  } catch (error: any) {
    console.error(chalk.red('✗ Credentials check failed:'), error.message);
    process.exit(1);
  }

  // Step 2: Check Sheet ID
  console.log(chalk.yellow('\nStep 2: Checking Sheet ID...'));
  if (!SHEET_ID) {
    console.error(chalk.red('✗ GOOGLE_SHEET_ID environment variable is not set'));
    process.exit(1);
  }
  console.log(chalk.green(`✓ Sheet ID found: ${SHEET_ID}`));

  // Step 3: Initialize Google Sheets API
  console.log(chalk.yellow('\nStep 3: Initializing Google Sheets API...'));
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsFullPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    console.log(chalk.green('✓ Google Sheets API initialized'));

    // Step 4: Test basic metadata access
    console.log(chalk.yellow('\nStep 4: Testing spreadsheet metadata access...'));
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID
    });

    console.log(chalk.green('✓ Successfully accessed spreadsheet metadata'));
    console.log(chalk.blue('Spreadsheet title:'), metadata.data.properties?.title);
    
    // Log all available sheets
    console.log(chalk.blue('\nAvailable sheets:'));
    metadata.data.sheets?.forEach(sheet => {
      const isDataTarget = sheet.properties?.sheetId?.toString() === DATA_SHEET_GID;
      const isBonusTarget = sheet.properties?.sheetId?.toString() === BONUS_SHEET_GID;
      const isPocTarget = sheet.properties?.sheetId?.toString() === POC_SHEET_GID;
      const isWifiStatsTarget = sheet.properties?.sheetId?.toString() === WIFI_STATS_SHEET_GID;
      const targetIndicator = isDataTarget ? ' ← Data Rewards Target' : 
                            isBonusTarget ? ' ← Bonus Rewards Target' : 
                            isPocTarget ? ' ← PoC Rewards Target' : 
                            isWifiStatsTarget ? ' ← WiFi Stats Target' : '';
      console.log(chalk.blue(`- ${sheet.properties?.title} (GID: ${sheet.properties?.sheetId})${targetIndicator}`));
    });

    // Step 5: Test data access for all sheets
    console.log(chalk.yellow('\nStep 5: Testing data access for all sheets...'));
    
    // Test Data Rewards sheet
    console.log(chalk.cyan('\n--- Testing Data Rewards Sheet ---'));
    const dataTargetSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.sheetId?.toString() === DATA_SHEET_GID
    );

    if (!dataTargetSheet) {
      throw new Error(`Data Rewards sheet with GID ${DATA_SHEET_GID} not found`);
    }

    const dataSheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${dataTargetSheet.properties?.title}!A1:C5`
    });

    if (!dataSheetData.data.values || dataSheetData.data.values.length === 0) {
      console.log(chalk.yellow('⚠️ Data Rewards sheet is empty or no data in specified range'));
    } else {
      console.log(chalk.green(`✓ Successfully read ${dataSheetData.data.values.length} rows from Data Rewards sheet`));
      console.log(chalk.blue('Sample data (first 3 rows):'));
      console.table(dataSheetData.data.values.slice(0, 3));
    }

    // Test Bonus Rewards sheet
    console.log(chalk.cyan('\n--- Testing Bonus Rewards Sheet ---'));
    const bonusTargetSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.sheetId?.toString() === BONUS_SHEET_GID
    );

    if (!bonusTargetSheet) {
      throw new Error(`Bonus Rewards sheet with GID ${BONUS_SHEET_GID} not found`);
    }

    const bonusSheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${bonusTargetSheet.properties?.title}!A1:C5`
    });

    if (!bonusSheetData.data.values || bonusSheetData.data.values.length === 0) {
      console.log(chalk.yellow('⚠️ Bonus Rewards sheet is empty or no data in specified range'));
    } else {
      console.log(chalk.green(`✓ Successfully read ${bonusSheetData.data.values.length} rows from Bonus Rewards sheet`));
      console.log(chalk.blue('Sample data (first 3 rows):'));
      console.table(bonusSheetData.data.values.slice(0, 3));
    }

    // Test PoC Rewards sheet
    console.log(chalk.cyan('\n--- Testing PoC Rewards Sheet ---'));
    const pocTargetSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.sheetId?.toString() === POC_SHEET_GID
    );

    if (!pocTargetSheet) {
      throw new Error(`PoC Rewards sheet with GID ${POC_SHEET_GID} not found`);
    }

    const pocSheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${pocTargetSheet.properties?.title}!A1:C5`
    });

    if (!pocSheetData.data.values || pocSheetData.data.values.length === 0) {
      console.log(chalk.yellow('⚠️ PoC Rewards sheet is empty or no data in specified range'));
    } else {
      console.log(chalk.green(`✓ Successfully read ${pocSheetData.data.values.length} rows from PoC Rewards sheet`));
      console.log(chalk.blue('Sample data (first 3 rows):'));
      console.table(pocSheetData.data.values.slice(0, 3));
    }

    // Test WiFi Stats sheet
    console.log(chalk.cyan('\n--- Testing WiFi Stats Sheet ---'));
    const wifiStatsTargetSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.sheetId?.toString() === WIFI_STATS_SHEET_GID
    );

    if (!wifiStatsTargetSheet) {
      throw new Error(`WiFi Stats sheet with GID ${WIFI_STATS_SHEET_GID} not found`);
    }

    const wifiStatsSheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${wifiStatsTargetSheet.properties?.title}!A1:C5`
    });

    if (!wifiStatsSheetData.data.values || wifiStatsSheetData.data.values.length === 0) {
      console.log(chalk.yellow('⚠️ WiFi Stats sheet is empty or no data in specified range'));
    } else {
      console.log(chalk.green(`✓ Successfully read ${wifiStatsSheetData.data.values.length} rows from WiFi Stats sheet`));
      console.log(chalk.blue('Sample data (first 3 rows):'));
      console.table(wifiStatsSheetData.data.values.slice(0, 3));
    }

    console.log(chalk.green('\n✅ All verification steps completed successfully!'));
    console.log(chalk.blue('\n📊 Summary:'));
    console.log(chalk.blue(`- Data Rewards Sheet: ${dataTargetSheet.properties?.title} (GID: ${DATA_SHEET_GID})`));
    console.log(chalk.blue(`- Bonus Rewards Sheet: ${bonusTargetSheet.properties?.title} (GID: ${BONUS_SHEET_GID})`));
    console.log(chalk.blue(`- PoC Rewards Sheet: ${pocTargetSheet.properties?.title} (GID: ${POC_SHEET_GID})`));
    console.log(chalk.blue(`- WiFi Stats Sheet: ${wifiStatsTargetSheet.properties?.title} (GID: ${WIFI_STATS_SHEET_GID})`));
    console.log(chalk.blue('- All sheets are accessible and ready for API integration'));
    
  } catch (error: any) {
    console.error(chalk.red('\n❌ Verification failed:'));
    console.error(chalk.red('Error:'), error.message);
    console.error(chalk.red('Details:'), error.response?.data || error);
    process.exit(1);
  }
}

// Run the verification
verifyAccess(); 