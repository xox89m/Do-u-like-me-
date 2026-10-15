/**
 * Google Drive & Google Sheets API Service
 * Handles folder lookup, spreadsheet creation inside folder "แบร่", and row appending
 */

export const TARGET_FOLDER_ID = '1yv8c5zQSs05eMh2SAYIiIYaU7S7hwVel';
export const TARGET_FOLDER_NAME = 'แบร่';
export const TARGET_FOLDER_URL = `https://drive.google.com/drive/folders/${TARGET_FOLDER_ID}?usp=drive_link`;
export const SPREADSHEET_TITLE = 'บันทึกคำตอบ_พี่ชอบผมรึเปล่า';

export interface LogEntry {
  action: string;
  noClickCount: number;
  message?: string;
  mood: string;
  userName?: string;
  userEmail?: string;
}

export interface SheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  firstSheetName: string;
}

// In-memory cache
let cachedSheetInfo: SheetInfo | null = null;

/**
 * Get or create the spreadsheet, placing it in folder "แบร่"
 */
export async function getOrCreateLogSpreadsheet(accessToken: string): Promise<SheetInfo> {
  if (cachedSheetInfo) {
    return cachedSheetInfo;
  }

  // 1. Search for existing spreadsheet in Drive / folder
  try {
    const query = encodeURIComponent(
      `mimeType = 'application/vnd.google.apps.spreadsheet' and name contains '${SPREADSHEET_TITLE}' and trashed = false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,parents)&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const file = searchData.files[0];
        const sheetUrl = file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`;
        
        // Fetch the first sheet tab name
        const firstSheetName = await getFirstSheetName(accessToken, file.id);

        // Try ensuring it is linked to target folder if not yet
        try {
          if (!file.parents || !file.parents.includes(TARGET_FOLDER_ID)) {
            await fetch(
              `https://www.googleapis.com/drive/v3/files/${file.id}?addParents=${TARGET_FOLDER_ID}&supportsAllDrives=true`,
              {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
          }
        } catch {}

        cachedSheetInfo = {
          spreadsheetId: file.id,
          spreadsheetUrl: sheetUrl,
          firstSheetName,
        };
        return cachedSheetInfo;
      }
    }
  } catch (err) {
    console.warn('Search existing sheet error:', err);
  }

  // 2. Create directly inside folder "แบร่" using Drive API v3
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
      const spreadsheetId = created.id;
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      // Initialize Header Row
      await initializeHeaderRow(accessToken, spreadsheetId);

      cachedSheetInfo = {
        spreadsheetId,
        spreadsheetUrl: sheetUrl,
        firstSheetName: 'Sheet1',
      };
      return cachedSheetInfo;
    } else {
      // Fallback: create in root Drive and attempt move
      const fallbackRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: { title: SPREADSHEET_TITLE },
          sheets: [
            {
              properties: { title: 'คำตอบทั้งหมด' },
              data: [
                {
                  startRow: 0,
                  startColumn: 0,
                  rowData: [
                    {
                      values: [
                        { userEnteredValue: { stringValue: 'วัน-เวลา (Timestamp)' } },
                        { userEnteredValue: { stringValue: 'ชื่อผู้ตอบ' } },
                        { userEnteredValue: { stringValue: 'การกระทำ' } },
                        { userEnteredValue: { stringValue: 'จำนวนครั้งที่กดไม่ชอบ' } },
                        { userEnteredValue: { stringValue: 'ข้อความในใจ' } },
                        { userEnteredValue: { stringValue: 'อารมณ์' } },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const spreadsheetId = data.spreadsheetId;
        const sheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

        // Try moving to folder "แบร่"
        try {
          await fetch(
            `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${TARGET_FOLDER_ID}&supportsAllDrives=true`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
        } catch {}

        cachedSheetInfo = {
          spreadsheetId,
          spreadsheetUrl: sheetUrl,
          firstSheetName: 'คำตอบทั้งหมด',
        };
        return cachedSheetInfo;
      }
    }
  } catch (err) {
    console.error('Failed to create spreadsheet:', err);
  }

  throw new Error('Could not create or access Google Sheets in Drive');
}

/**
 * Initialize header row via Sheets API
 */
async function initializeHeaderRow(accessToken: string, spreadsheetId: string) {
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:F1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [
            ['วัน-เวลา (Timestamp)', 'ชื่อผู้ตอบ', 'การกระทำ', 'จำนวนครั้งที่กดไม่ชอบ', 'ข้อความในใจ', 'อารมณ์'],
          ],
        }),
      }
    );
  } catch (err) {
    console.warn('Initialize header row warning:', err);
  }
}

/**
 * Fetch the title of the first sheet tab
 */
async function getFirstSheetName(accessToken: string, spreadsheetId: string): Promise<string> {
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      if (meta.sheets && meta.sheets.length > 0) {
        return meta.sheets[0].properties.title;
      }
    }
  } catch {}
  return 'คำตอบทั้งหมด';
}

/**
 * Append row to Google Sheets
 */
export async function appendLogEntry(accessToken: string, entry: LogEntry): Promise<boolean> {
  try {
    const sheetInfo = await getOrCreateLogSpreadsheet(accessToken);
    const timestamp = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const timeOnly = new Date().toLocaleTimeString('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const userIdentifier = entry.userEmail || entry.userName || `${timeOnly} ไอ้นี้`;

    const rowValues = [
      [
        timestamp,
        userIdentifier,
        entry.action,
        entry.noClickCount.toString(),
        entry.message || '-',
        entry.mood,
      ],
    ];

    const range = `${sheetInfo.firstSheetName}!A1`;
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetInfo.spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const appendRes = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rowValues,
      }),
    });

    return appendRes.ok;
  } catch (error) {
    console.error('Failed to append log entry to Google Sheets:', error);
    return false;
  }
}
