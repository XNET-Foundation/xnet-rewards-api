# XNET Rewards API

This is a simple API built with **Next.js (App Router)** , designed to serve token reward data for XNET devices based on post-epoch data.

---

## Features

- Query device rewards by MAC address and epoch
- Supports full reward history or aggregation over recent epochs
- Live connection to rewards sheets — no manual syncing required
- Built with TypeScript + Google Sheets API

---

##  Folder Structure

```
src/
├── app/
│   └── api/
│       └── rewards/
│           ├── aggregate/route.ts
│           ├── epoch/route.ts
│           └── history/route.ts
└── utils/
    └── sheet.ts
.env
```

---

## Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/your-username/xnet-rewards-api.git
cd xnet-rewards-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Create a `.env` file in the root:

```
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_CREDENTIALS_JSON='secrets/gkey.json'
```


### 4. Verify Google Sheets Access

Run the verification script to check if your Google Sheets setup is working correctly:

```bash
npx ts-node scripts/verify-sheets-access.ts
```

This script will:
- Verify your credentials file exists and is valid
- Check if environment variables are set correctly
- Test connection to Google Sheets API
- Display available sheets and their GIDs
- Attempt to read sample data

If you encounter any issues, the script will provide detailed error information to help troubleshoot.

### 5. Share your sheet

Make sure your Google Sheet is **shared with the service account email** that appears in your JSON credentials file (Viewer access is enough).

---

## API Endpoints

### 1. Aggregate Last X Epochs

```
GET /api/rewards/aggregate?mac=MAC_ADDRESS&epochs=N
```

**Example:**

```
/api/rewards/aggregate?mac=48bf74221270&epochs=4
```

---

### 2. Specific Epoch Reward

```
GET /api/rewards/epoch?mac=MAC_ADDRESS&epoch=EPOCH_NUMBER
```

**Example:**

```
/api/rewards/epoch?mac=48bf74221270&epoch=63
```

---

### 3. Full History

```
GET /api/rewards/history?mac=MAC_ADDRESS
```

**Example:**

```
/api/rewards/history?mac=48bf74221270
```

---

## Live Demo

Example:
```
https://domain.com/api/rewards/aggregate?mac=48bf74221270&epochs=3
```
