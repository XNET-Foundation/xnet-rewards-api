# XNET Rewards API

This is a simple API built with **Next.js (App Router)**, designed to serve token reward data for XNET devices based on post-epoch data.

---

## Features

- Query device rewards by MAC address and epoch
- Supports full reward history or aggregation over recent epochs
- **NEW**: Combined data rewards, bonus rewards, and PoC rewards in total calculations
- **NEW**: WiFi Stats endpoints for device performance metrics
- Live connection to rewards sheets — no manual syncing required
- Built with TypeScript + Google Sheets API

---

## Folder Structure

```
src/
├── app/
│   └── api/
│       ├── rewards/
│       │   ├── aggregate/route.ts
│       │   ├── epoch/route.ts
│       │   └── history/route.ts
│       └── wifi-stats/
│           ├── device/route.ts
│           └── top-offload/route.ts
└── utils/
    ├── sheet.ts
    └── epoch.ts
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

**For Vercel Deployment:**
The API also supports Google Cloud Platform integration via environment variables:
```
GCP_PROJECT_ID=your-project-id
GCP_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GCP_PRIVATE_KEY=your-private-key
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
- Test access to Data Rewards, Bonus Rewards, PoC Rewards, and WiFi Stats sheets
- Attempt to read sample data from all sheets

If you encounter any issues, the script will provide detailed error information to help troubleshoot.

### 5. Share your sheet

Make sure your Google Sheet is **shared with the service account email** that appears in your JSON credentials file (Viewer access is enough).

---

## API Endpoints

### Rewards Endpoints

#### 1. Aggregate Last X Epochs

```
GET /api/rewards/aggregate?mac=MAC_ADDRESS&epochs=N
```

**Example:**

```
/api/rewards/aggregate?mac=48bf74221270&epochs=4
```

**Response:**

```json
{
  "mac": "48bf74221270",
  "current_epoch": 64,
  "epochs": ["Epoch 61", "Epoch 62", "Epoch 63"],
  "rewards": {
    "data_rewards": 150.5,
    "bonus_rewards": 25.0,
    "poc_rewards": 10.5,
    "total_rewards": 186.0
  }
}
```

#### 2. Specific Epoch Reward

```
GET /api/rewards/epoch?mac=MAC_ADDRESS&epoch=EPOCH_NUMBER
```

**Example:**

```
/api/rewards/epoch?mac=48bf74221270&epoch=63
```

**Response:**

```json
{
  "mac": "48bf74221270",
  "epoch": "63",
  "rewards": {
    "data_rewards": 50.2,
    "bonus_rewards": 8.3,
    "poc_rewards": 1.5,
    "total_rewards": 60.0
  }
}
```

#### 3. Full History

```
GET /api/rewards/history?mac=MAC_ADDRESS
```

**Example:**

```
/api/rewards/history?mac=48bf74221270
```

**Response:**

```json
{
  "mac": "48bf74221270",
  "current_epoch": 64,
  "history": {
    "Epoch 61": {
      "data_rewards": 45.1,
      "bonus_rewards": 7.5,
      "poc_rewards": 1.2,
      "total_rewards": 53.8,
      "distribution_date": "2024-01-15"
    },
    "Epoch 62": {
      "data_rewards": 52.3,
      "bonus_rewards": 9.2,
      "poc_rewards": 1.8,
      "total_rewards": 63.3,
      "distribution_date": "2024-01-29"
    }
  }
}
```

### WiFi Stats Endpoints

#### 4. Top Offload Devices

```
GET /api/wifi-stats/top-offload?limit=N&epoch=EPOCH_NUMBER
```

**Parameters:**
- `limit` (required): Number of top devices to return (1-100)
- `epoch` (optional): Specific epoch to query. If not specified, defaults to `current_epoch - 1`

**Example:**

```
/api/wifi-stats/top-offload?limit=10
/api/wifi-stats/top-offload?limit=5&epoch=70
```

**Response:**

```json
{
  "current_epoch": 72,
  "target_epoch": 71,
  "top_devices": [
    {
      "mac": "0ca138000eaa",
      "total_gbs": 2034.456,
      "rank": 1
    },
    {
      "mac": "device2",
      "total_gbs": 1950.0,
      "rank": 2
    }
  ]
}
```

#### 5. Device WiFi Stats

```
GET /api/wifi-stats/device?mac=MAC_ADDRESS&epoch=EPOCH_NUMBER
```

**Parameters:**
- `mac` (required): Device MAC address
- `epoch` (optional): Specific epoch to query. If not specified, defaults to `current_epoch`

**Example:**

```
/api/wifi-stats/device?mac=0ca138000eaa&epoch=71
/api/wifi-stats/device?mac=0ca138000eaa
```

**Response:**

```json
{
  "mac": "0ca138000eaa",
  "epoch": 71,
  "stats": {
    "sessions": 150,
    "users": 45,
    "rejects": 2,
    "total_gbs": 2034.456,
    "network_status": "Active",
    "location_status": "Valid"
  }
}
```

**WiFi Stats Metrics:**
- `sessions`: Number of WiFi sessions
- `users`: Number of unique users connected
- `rejects`: Number of connection rejections
- `total_gbs`: Total data offloaded in GB
- `network_status`: Current network status (Active, Inactive, etc.)
- `location_status`: Location verification status (Approved, Pending, etc.)

---

## Reward Types

The API now combines three types of rewards:

1. **Data Rewards**: Primary rewards from data transmission (GID: 451580614)
2. **Bonus Rewards**: Additional bonus rewards (GID: 425107781)
3. **PoC Rewards**: Proof of Concept rewards (GID: 0)

All endpoints return a breakdown showing:
- `data_rewards`: Rewards from data transmission
- `bonus_rewards`: Additional bonus rewards  
- `poc_rewards`: Proof of Concept rewards
- `total_rewards`: Combined total (data + bonus + poc)

---

## Live Demo

Example:
```
https://domain.com/api/rewards/aggregate?mac=48bf74221270&epochs=3
https://domain.com/api/wifi-stats/device?mac=0ca138000eaa&epoch=71
```

---

## Testing

Run the API test script to verify functionality:

```bash
npx ts-node scripts/test-api.ts
```

This will test all endpoints and show the new reward breakdown format with all three reward types.

---

## Deployment

### Local Development
```bash
npm run dev
```

### Vercel Deployment
The API automatically detects Vercel environment and uses GCP integration credentials when available.

---

## Authentication

The API uses hybrid authentication:
- **Local Development**: Uses local credentials file from `secrets/` folder
- **Vercel Production**: Uses GCP integration environment variables