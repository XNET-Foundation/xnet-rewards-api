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
const SHEET_GID = '451580614';

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
      const isTarget = sheet.properties?.sheetId?.toString() === SHEET_GID;
      console.log(chalk.blue(`- ${sheet.properties?.title} (GID: ${sheet.properties?.sheetId})${isTarget ? ' ← Target sheet' : ''}`));
    });

    // Step 5: Test data access
    console.log(chalk.yellow('\nStep 5: Testing data access...'));
    
    // Find the target sheet
    const targetSheet = metadata.data.sheets?.find(
      sheet => sheet.properties?.sheetId?.toString() === SHEET_GID
    );

    if (!targetSheet) {
      throw new Error(`Sheet with GID ${SHEET_GID} not found`);
    }

    // Try to read some data
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${targetSheet.properties?.title}!A1:C5`
    });

    if (!data.data.values || data.data.values.length === 0) {
      console.log(chalk.yellow('⚠️ Sheet is empty or no data in specified range'));
    } else {
      console.log(chalk.green(`✓ Successfully read ${data.data.values.length} rows of data`));
      console.log(chalk.blue('\nSample data (first 5 rows):'));
      console.table(data.data.values.slice(0, 5));
    }

    console.log(chalk.green('\n✅ All verification steps completed successfully!'));
    
  } catch (error: any) {
    console.error(chalk.red('\n❌ Verification failed:'));
    console.error(chalk.red('Error:'), error.message);
    console.error(chalk.red('Details:'), error.response?.data || error);
    process.exit(1);
  }
}

// Run the verification
verifyAccess(); 