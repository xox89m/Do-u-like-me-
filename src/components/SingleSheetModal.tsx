import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  X,
  RefreshCw,
  Clock,
  MessageSquareHeart,
  Folder,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Link,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface SheetRow {
  timestamp: string;
  userName: string;
  action: string;
  noClickCount: number;
  message: string;
  mood: string;
}

interface SingleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: SheetRow[];
  onRefresh: () => void;
  isLoading: boolean;
  driveConnected: boolean;
  spreadsheetUrl: string | null;
  onConnectDrive: () => void;
  isConnectingDrive: boolean;
  webhookUrl?: string | null;
  onSaveWebhook?: (url: string) => Promise<void>;
  onSyncAll?: () => Promise<void>;
}

export const SingleSheetModal: React.FC<SingleSheetModalProps> = ({
  isOpen,
  onClose,
  rows,
  onRefresh,
  isLoading,
  driveConnected,
  spreadsheetUrl,
  onConnectDrive,
  isConnectingDrive,
  webhookUrl,
  onSaveWebhook,
  onSyncAll,
}) => {
  const [copiedData, setCopiedData] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [inputWebhook, setInputWebhook] = useState(webhookUrl || '');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    const headers = ['วัน-เวลา', 'ชื่อผู้ตอบ', 'การกระทำ', 'จำนวนครั้งที่กดไม่ชอบ', 'ข้อความในใจ', 'อารมณ์'];
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map((r) => [
        `"${(r.timestamp || '').replace(/"/g, '""')}"`,
        `"${(r.userName || '').replace(/"/g, '""')}"`,
        `"${(r.action || '').replace(/"/g, '""')}"`,
        r.noClickCount,
        `"${(r.message || '-').replace(/"/g, '""')}"`,
        `"${(r.mood || '-').replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `คำตอบ_พี่ชอบผมรึเปล่า_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy rows as TSV for instant 1-click paste into Google Sheets (Cell A1 -> Ctrl+V)
  const handleCopyRowsForSheets = async () => {
    const headers = ['วัน-เวลา', 'ชื่อผู้ตอบ', 'การกระทำ', 'จำนวนครั้งที่กดไม่ชอบ', 'ข้อความในใจ', 'อารมณ์'];
    const lines = [headers.join('\t')];
    rows.forEach((r) => {
      lines.push([
        r.timestamp,
        r.userName,
        r.action,
        String(r.noClickCount),
        r.message || '-',
        r.mood || '-',
      ].join('\t'));
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedData(true);
      setTimeout(() => setCopiedData(false), 2500);
    } catch {
      // Fallback
    }
  };

  const scriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var d = JSON.parse(e.postData.contents);
  sheet.appendRow([d.timestamp, d.userName, d.action, d.noClickCount, d.message, d.mood]);
  return ContentService.createTextOutput("OK");
}`;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {}
  };

  const handleSaveWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveWebhook) return;
    setIsSavingWebhook(true);
    await onSaveWebhook(inputWebhook.trim());
    setIsSavingWebhook(false);
    setSyncMessage('บันทึก Webhook URL สำเร็จแล้ว ข้อมูลจะส่งเข้า Google Sheet อัตโนมัติ!');
    setTimeout(() => setSyncMessage(null), 4000);
  };

  const handleTriggerSyncAll = async () => {
    if (!onSyncAll) return;
    setIsSyncingAll(true);
    await onSyncAll();
    setIsSyncingAll(false);
    setSyncMessage('ซิงค์ข้อมูลย้อนหลังทั้งหมดเข้า Google Sheets เรียบร้อยแล้ว!');
    setTimeout(() => setSyncMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                  ไฟล์ชีตคำตอบ & บันทึกลงไดรฟ์
                </h3>
                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs font-semibold rounded-full">
                  {rows.length} รายการ
                </span>
              </div>
              <p className="text-xs text-gray-500">
                ระบบเก็บข้อมูลตอนเขาทำอะไร ทุกคลิก ทุกข้อความ จะถูกบันทึกไว้ที่นี่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {driveConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                เชื่อมต่อบันทึกเข้า Google Drive อัตโนมัติแล้ว
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                บันทึกในระบบแล้ว (เลือกเชื่อมไดรฟ์ด้านล่างได้)
              </span>
            )}
            <span className="text-gray-500">
              | บันทึกเวลา + &ldquo;ไอ้นี้&rdquo; อัตโนมัติ ไม่ต้องล็อกอิน
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://drive.google.com/drive/folders/1yv8c5zQSs05eMh2SAYIiIYaU7S7hwVel?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-white text-gray-700 hover:text-pink-600 border border-gray-200 rounded-lg font-medium transition-all"
            >
              <Folder className="w-3 h-3 text-amber-500" />
              <span>โฟลเดอร์ &quot;แบร่&quot;</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium transition-all"
              >
                <span>เปิด Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Sync message if any */}
        {syncMessage && (
          <div className="px-6 py-2 bg-emerald-50 text-emerald-800 border-b border-emerald-100 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Zero-Login Google Apps Script Webhook Accordion */}
        <div className="px-5 sm:px-6 py-2 bg-gradient-to-r from-amber-50/50 via-pink-50/40 to-amber-50/50 border-b border-pink-100/60 text-xs">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowWebhookGuide(!showWebhookGuide)}
              className="flex items-center gap-2 font-semibold text-gray-700 hover:text-pink-600 transition-colors cursor-pointer py-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>วิธีส่งข้อมูลเข้า Google Sheet ในโฟลเดอร์ &quot;แบร่&quot; อัตโนมัติ (ไม่ต้องล็อกอินตลอดชีพ)</span>
              {showWebhookGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {!driveConnected && (
              <button
                onClick={onConnectDrive}
                disabled={isConnectingDrive}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium shadow-2xs transition-all cursor-pointer disabled:opacity-50 text-[11px]"
              >
                <span>{isConnectingDrive ? 'กำลังเชื่อม...' : 'หรือล็อกอิน Google Drive'}</span>
              </button>
            )}
          </div>

          {showWebhookGuide && (
            <div className="mt-2.5 p-3.5 bg-white/95 rounded-2xl border border-pink-100 space-y-3 shadow-xs">
              <p className="text-gray-600 leading-relaxed">
                ทำตาม 3 ขั้นตอนนี้เพียงครั้งเดียว ทุกคำตอบที่เขากดจะไหลเข้า Google Sheet ในโฟลเดอร์ &quot;แบร่&quot; ของพี่ทันที โดยที่เขาไม่ต้องล็อกอิน:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 font-medium">
                <li>เปิดไฟล์ Google Sheet ในโฟลเดอร์ &quot;แบร่&quot; แล้วคลิกเมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong></li>
                <li>
                  ลบโค้ดเดิมแล้ววางโค้ดนี้:
                  <div className="mt-1 flex items-center gap-2">
                    <pre className="bg-gray-900 text-emerald-400 p-2 rounded-lg text-[11px] overflow-x-auto font-mono flex-1">
                      {scriptCode}
                    </pre>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold flex items-center gap-1 flex-shrink-0 cursor-pointer"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}</span>
                    </button>
                  </div>
                </li>
                <li>
                  กด <strong>ทำให้ใช้งานได้ (Deploy) &gt; การทำให้ใช้งานได้รายการใหม่ (New deployment)</strong> &gt; เลือกประเภท <strong>เว็บแอป (Web app)</strong> &gt; ใครมีสิทธิ์เข้าถึง: เลือก <strong>ทุกคน (Anyone)</strong> &gt; กดเสร็จแล้วคัดลอก Web App URL มาใส่ช่องนี้:
                </li>
              </ol>

              <form onSubmit={handleSaveWebhookSubmit} className="flex gap-2 pt-1">
                <input
                  type="url"
                  value={inputWebhook}
                  onChange={(e) => setInputWebhook(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-1.5 border border-pink-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
                <button
                  type="submit"
                  disabled={isSavingWebhook || !inputWebhook.trim()}
                  className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
                >
                  {isSavingWebhook ? 'กำลังบันทึก...' : 'บันทึก Webhook'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Quick Action Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-gray-50/90 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 hover:text-pink-600 border border-gray-200 rounded-xl font-medium shadow-2xs hover:shadow transition-all cursor-pointer"
              title="โหลดข้อมูลล่าสุด"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>

            {onSyncAll && (
              <button
                onClick={handleTriggerSyncAll}
                disabled={isSyncingAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 hover:text-emerald-700 border border-gray-200 rounded-xl font-medium shadow-2xs hover:shadow transition-all cursor-pointer"
                title="ส่งข้อมูลทั้งหมดที่มีเข้า Google Sheets อีกครั้ง"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isSyncingAll ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลทั้งหมดเข้า Drive'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRowsForSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 hover:text-blue-600 border border-gray-200 rounded-xl font-medium shadow-2xs transition-all cursor-pointer"
              title="คัดลอกตารางทั้งหมดไปกดวาง (Ctrl+V) ใน Google Sheets ได้ทันที"
            >
              {copiedData ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              <span>{copiedData ? 'คัดลอกแล้ว!' : 'คัดลอกตารางไปวางใน Google Sheet'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-2xs transition-all cursor-pointer"
              title="ดาวน์โหลดไฟล์ CSV ไปเปิดใน Excel หรือลากใส่ Google Drive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดไฟล์ CSV</span>
            </button>
          </div>
        </div>

        {/* Responses Table Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50/50">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-3xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-400 mb-3">
                <Clock className="w-8 h-8 opacity-60" />
              </div>
              <p className="font-bold text-gray-700 text-sm sm:text-base">
                ยังไม่มีข้อมูลคำตอบ
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                เมื่อเขาเปิดลิงก์และกดปุ่มชอบ ไม่ชอบ หรือพิมพ์ข้อความ ข้อมูลจะปรากฏขึ้นที่นี่โดยอัตโนมัติทันที
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">วัน-เวลา</th>
                    <th className="px-4 py-3">ชื่อผู้ตอบ</th>
                    <th className="px-4 py-3">การกระทำ</th>
                    <th className="px-4 py-3 text-center">ไม่ชอบ (ครั้ง)</th>
                    <th className="px-4 py-3">ข้อความในใจ</th>
                    <th className="px-4 py-3">อารมณ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {rows.map((row, index) => {
                    const isYes = row.action.includes('ชอบ') && !row.action.includes('ไม่ชอบ');
                    const isNo = row.action.includes('ไม่ชอบ');
                    const isMsg = row.action.includes('ข้อความ');

                    return (
                      <tr
                        key={`${row.timestamp}-${index}`}
                        className="hover:bg-pink-50/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-xs">
                          {row.timestamp}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                          {row.userName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isYes
                                ? 'bg-pink-100 text-pink-800'
                                : isNo
                                ? 'bg-blue-100 text-blue-800'
                                : isMsg
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {row.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-600">
                          {row.noClickCount > 0 ? row.noClickCount : '-'}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-gray-800" title={row.message}>
                          {row.message && row.message !== '-' ? (
                            <span className="flex items-center gap-1 font-medium text-pink-700">
                              <MessageSquareHeart className="w-3.5 h-3.5 flex-shrink-0 text-pink-500" />
                              <span className="truncate">{row.message}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {row.mood || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div>
            บันทึกเป็นชื่อ: <strong>&ldquo;{'{เวลา}'} ไอ้นี้&rdquo;</strong> ทุกครั้งโดยไม่ต้องล็อกอิน
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
