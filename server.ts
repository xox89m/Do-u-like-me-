import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const TARGET_FOLDER_ID = '1yv8c5zQSs05eMh2SAYIiIYaU7S7hwVel';
const TARGET_FOLDER_NAME = 'แบร่';
const SPREADSHEET_TITLE = 'บันทึกคำตอบ_พี่ชอบผมรึเปล่า';

interface DriveConfig {
  accessToken: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  tokenExpired?: boolean;
  webhookUrl?: string | null;
}

async function startServer() {
  const app = express();
  
  // Support up to 50MB for audio uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const DATA_DIR = path.resolve(process.cwd(), 'data');
  const SHEET_FILE = path.join(DATA_DIR, 'responses.json');
  const CSV_FILE = path.join(DATA_DIR, 'responses.csv');
  const SONG_FILE = path.join(DATA_DIR, 'song.mp3');
  const DRIVE_CONFIG_FILE = path.join(DATA_DIR, 'drive-config.json');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load drive config if exists
  let driveConfig: DriveConfig = {
    accessToken: null,
    spreadsheetId: null,
    spreadsheetUrl: null,
    webhookUrl: null,
  };

  if (fs.existsSync(DRIVE_CONFIG_FILE)) {
    try {
      driveConfig = JSON.parse(fs.readFileSync(DRIVE_CONFIG_FILE, 'utf8'));
    } catch {}
  }

  const saveDriveConfig = () => {
    try {
      fs.writeFileSync(DRIVE_CONFIG_FILE, JSON.stringify(driveConfig, null, 2), 'utf8');
    } catch {}
  };

  // Ensure CSV header with UTF-8 BOM for Thai Excel/Google Sheets compatibility
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(
      CSV_FILE,
      '\uFEFFวัน-เวลา,ชื่อผู้ตอบ,การกระทำ,จำนวนครั้งที่กดไม่ชอบ,ข้อความในใจ,อารมณ์\n',
      'utf8'
    );
  }

  // Helper to forward a row to Google Apps Script Webhook (Zero login needed!)
  const sendToWebhook = async (row: {
    timestamp: string;
    userName: string;
    action: string;
    noClickCount: number;
    message: string;
    mood: string;
  }) => {
    if (!driveConfig.webhookUrl) return;
    try {
      await fetch(driveConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
      console.log('[WEBHOOK APPEND SUCCESS] Sent row to Google Apps Script in folder แบร่');
    } catch (err) {
      console.warn('[WEBHOOK APPEND ERROR]', err);
    }
  };

  // Helper to append a single row to Google Sheets via REST API
  const appendRowToGoogleSheets = async (row: {
    timestamp: string;
    userName: string;
    action: string;
    noClickCount: number;
    message: string;
    mood: string;
  }) => {
    // 1. Try Webhook first (works without authentication)
    if (driveConfig.webhookUrl) {
      sendToWebhook(row);
    }

    // 2. Try Google Sheets API with OAuth token
    if (!driveConfig.accessToken || !driveConfig.spreadsheetId) return;

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${driveConfig.spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${driveConfig.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [
            [
              row.timestamp,
              row.userName,
              row.action,
              String(row.noClickCount),
              row.message || '-',
              row.mood || '-',
            ],
          ],
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          driveConfig.tokenExpired = true;
          saveDriveConfig();
        }
        const errText = await res.text();
        console.warn('[DRIVE APPEND FAILED]', errText);
      } else {
        console.log('[DRIVE APPEND SUCCESS] Row added to Google Sheets in folder แบร่');
      }
    } catch (err) {
      console.warn('[DRIVE APPEND ERROR]', err);
    }
  };

  // 1. API to fetch all logged responses
  app.get('/api/logs', (req, res) => {
    try {
      if (fs.existsSync(SHEET_FILE)) {
        const data = JSON.parse(fs.readFileSync(SHEET_FILE, 'utf8'));
        return res.json(data);
      }
      return res.json([]);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 2. API to append a response (No login required for respondents)
  app.post('/api/logs', async (req, res) => {
    try {
      const entry = req.body;
      const timeOnly = new Date().toLocaleTimeString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Name format: "{เวลา} ไอ้นี้" if not provided
      const userIdentifier = entry.userName && entry.userName.trim() ? entry.userName.trim() : `${timeOnly} ไอ้นี้`;
      const timestamp = new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newRow = {
        timestamp,
        userName: userIdentifier,
        action: entry.action || '-',
        noClickCount: entry.noClickCount || 0,
        message: entry.message || '-',
        mood: entry.mood || '-',
      };

      // Append to JSON
      let list = [];
      if (fs.existsSync(SHEET_FILE)) {
        try {
          list = JSON.parse(fs.readFileSync(SHEET_FILE, 'utf8'));
        } catch {}
      }
      list.unshift(newRow);
      fs.writeFileSync(SHEET_FILE, JSON.stringify(list, null, 2), 'utf8');

      // Append to CSV
      const sanitize = (text: string | number) => `"${String(text).replace(/"/g, '""')}"`;
      const csvLine = `${sanitize(timestamp)},${sanitize(userIdentifier)},${sanitize(newRow.action)},${sanitize(newRow.noClickCount)},${sanitize(newRow.message)},${sanitize(newRow.mood)}\n`;
      fs.appendFileSync(CSV_FILE, csvLine, 'utf8');

      console.log(`[LOG SAVED] ${userIdentifier}: ${newRow.action}`);

      // Asynchronously sync to Google Drive Sheet or Webhook
      appendRowToGoogleSheets(newRow);

      return res.json({ success: true, row: newRow });
    } catch (err: any) {
      console.error('Error saving log:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. API to download the CSV sheet file
  app.get('/api/download-sheet', (req, res) => {
    if (fs.existsSync(CSV_FILE)) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="คำตอบ_พี่ชอบผมรึเปล่า.csv"');
      return res.sendFile(CSV_FILE);
    }
    return res.status(404).send('No sheet data yet');
  });

  // 4. API to check Google Drive sync status
  app.get('/api/drive-status', (req, res) => {
    const isOAuthConnected = Boolean(driveConfig.accessToken && driveConfig.spreadsheetId && !driveConfig.tokenExpired);
    const isWebhookConnected = Boolean(driveConfig.webhookUrl);

    res.json({
      connected: isOAuthConnected || isWebhookConnected,
      isOAuthConnected,
      isWebhookConnected,
      webhookUrl: driveConfig.webhookUrl || null,
      spreadsheetId: driveConfig.spreadsheetId,
      spreadsheetUrl: driveConfig.spreadsheetUrl,
      folderUrl: `https://drive.google.com/drive/folders/${TARGET_FOLDER_ID}?usp=drive_link`,
      folderName: TARGET_FOLDER_NAME,
      tokenExpired: Boolean(driveConfig.tokenExpired),
    });
  });

  // 5. API to configure Google Apps Script Webhook (No login needed!)
  app.post('/api/set-webhook', (req, res) => {
    try {
      const { webhookUrl } = req.body;
      driveConfig.webhookUrl = webhookUrl ? String(webhookUrl).trim() : null;
      saveDriveConfig();
      return res.json({ success: true, webhookUrl: driveConfig.webhookUrl });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. API to sync all rows to Google Sheets
  app.post('/api/sync-all', async (req, res) => {
    try {
      if (!fs.existsSync(SHEET_FILE)) {
        return res.json({ synced: 0 });
      }
      const data = JSON.parse(fs.readFileSync(SHEET_FILE, 'utf8'));
      if (!Array.isArray(data) || data.length === 0) {
        return res.json({ synced: 0 });
      }

      let count = 0;
      for (const row of [...data].reverse()) {
        await appendRowToGoogleSheets(row);
        count++;
      }
      return res.json({ success: true, synced: count });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 7. API to register Google OAuth Access Token and sync folder "แบร่"
  app.post('/api/drive-token', async (req, res) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ error: 'Missing accessToken' });
      }

      driveConfig.accessToken = accessToken;
      driveConfig.tokenExpired = false;

      // 1. Search for existing spreadsheet in Drive / folder
      let spreadsheetId = driveConfig.spreadsheetId;
      let spreadsheetUrl = driveConfig.spreadsheetUrl;

      if (!spreadsheetId) {
        try {
          const query = encodeURIComponent(
            `mimeType = 'application/vnd.google.apps.spreadsheet' and name contains '${SPREADSHEET_TITLE}' and trashed = false`
          );
          const searchRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,parents)&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=5`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (searchRes.ok) {
            const data = await searchRes.json();
            if (data.files && data.files.length > 0) {
              spreadsheetId = data.files[0].id;
              spreadsheetUrl = data.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
            }
          }
        } catch (searchErr) {
          console.warn('Search sheet in Drive error:', searchErr);
        }
      }

      // 2. If not found, create spreadsheet inside folder "แบร่"
      if (!spreadsheetId) {
        try {
          const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: SPREADSHEET_TITLE,
              mimeType: 'application/vnd.google.apps.spreadsheet',
              parents: [TARGET_FOLDER_ID],
            }),
          });

          if (createRes.ok) {
            const created = await createRes.json();
            spreadsheetId = created.id;
            spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
          } else {
            // Fallback: create in root Drive
            const createFallback = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: SPREADSHEET_TITLE,
                mimeType: 'application/vnd.google.apps.spreadsheet',
              }),
            });
            if (createFallback.ok) {
              const created = await createFallback.json();
              spreadsheetId = created.id;
              spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
              try {
                await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${TARGET_FOLDER_ID}&supportsAllDrives=true`, {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
              } catch {}
            }
          }
        } catch (createErr) {
          console.error('Create spreadsheet failed:', createErr);
        }
      }

      if (spreadsheetId) {
        driveConfig.spreadsheetId = spreadsheetId;
        driveConfig.spreadsheetUrl = spreadsheetUrl;
        saveDriveConfig();

        // 3. Ensure header row exists
        try {
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:F1?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: [
                ['วัน-เวลา', 'ชื่อผู้ตอบ', 'การกระทำ', 'จำนวนครั้งที่กดไม่ชอบ', 'ข้อความในใจ', 'อารมณ์'],
              ],
            }),
          });
        } catch (hErr) {
          console.warn('Set header error:', hErr);
        }

        // 4. Batch sync all historical responses from responses.json
        if (fs.existsSync(SHEET_FILE)) {
          try {
            const raw = fs.readFileSync(SHEET_FILE, 'utf8');
            const logs = JSON.parse(raw);
            if (Array.isArray(logs) && logs.length > 0) {
              const rowsToAppend = [...logs].reverse().map((r: any) => [
                r.timestamp || '',
                r.userName || '',
                r.action || '',
                String(r.noClickCount ?? ''),
                r.message || '-',
                r.mood || '-',
              ]);

              await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values: rowsToAppend }),
              });
              console.log(`[DRIVE SYNC COMPLETE] Synced ${rowsToAppend.length} rows to spreadsheet`);
            }
          } catch (syncErr) {
            console.warn('Sync historical logs error:', syncErr);
          }
        }
      }

      return res.json({
        success: true,
        spreadsheetId: driveConfig.spreadsheetId,
        spreadsheetUrl: driveConfig.spreadsheetUrl,
        folderName: TARGET_FOLDER_NAME,
      });
    } catch (err: any) {
      console.error('Save drive token error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 8. Audio file serving with HTTP Range support
  app.get('/api/song.mp3', (req, res) => {
    let target = SONG_FILE;
    if (!fs.existsSync(target)) {
      target = path.resolve(process.cwd(), 'public', 'song.mp3');
    }
    if (!fs.existsSync(target)) {
      return res.status(404).send('Audio not found');
    }

    const stat = fs.statSync(target);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(target, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(target).pipe(res);
    }
  });

  // 9. Audio upload endpoint
  app.post('/api/upload-song', (req, res) => {
    try {
      const { base64Data, filename } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: 'No audio data received' });
      }

      const cleanBase64 = base64Data.replace(/^data:audio\/[a-z0-9]+;base64,/, '').replace(/^data:application\/octet-stream;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      fs.writeFileSync(SONG_FILE, buffer);
      const publicSong = path.resolve(process.cwd(), 'public', 'song.mp3');
      fs.writeFileSync(publicSong, buffer);

      console.log(`[SONG UPLOADED] ${filename || 'song.mp3'} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
      return res.json({ success: true, size: buffer.length });
    } catch (err: any) {
      console.error('Audio upload error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Mount Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
