import React, { useState } from 'react';
import {
  ExternalLink,
  Folder,
  FileSpreadsheet,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquareHeart,
} from 'lucide-react';
import { TARGET_FOLDER_URL, TARGET_FOLDER_NAME } from '../lib/googleDriveSheets';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: string[][];
  localLogs: Array<{
    timestamp: string;
    action: string;
    noClickCount: number;
    message?: string;
    mood: string;
    synced: boolean;
  }>;
  spreadsheetUrl?: string | null;
  onRefresh: () => void;
  isLoading: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({
  isOpen,
  onClose,
  rows,
  localLogs,
  spreadsheetUrl,
  onRefresh,
  isLoading,
  isLoggedIn,
  onLogin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-pink-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-2xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                บันทึกการกระทำใน Google Sheets
              </h3>
              <p className="text-xs text-pink-600 font-medium flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 inline" /> โฟลเดอร์: {TARGET_FOLDER_NAME}
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

        {/* Action bar / links */}
        <div className="px-6 py-3 bg-pink-50/50 border-b border-pink-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <a
              href={TARGET_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-pink-700 hover:text-pink-800 border border-pink-200 rounded-xl font-medium shadow-xs hover:shadow transition-all"
            >
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>เปิดโฟลเดอร์ &quot;{TARGET_FOLDER_NAME}&quot; ใน Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-xl font-medium shadow-xs hover:shadow transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>เปิดดูตาราง Sheet เต็ม</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading || !isLoggedIn}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-pink-600 bg-white border border-gray-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {!isLoggedIn ? (
            <div className="p-6 text-center space-y-3 bg-pink-50/60 rounded-2xl border border-pink-200/60">
              <div className="text-3xl">🔐</div>
              <p className="text-sm text-gray-700 font-medium">
                ยังไม่ได้เชื่อมต่อ Google Account สำหรับบันทึกลง Google Sheets
              </p>
              <p className="text-xs text-gray-500">
                เข้าสู่ระบบเพื่อให้ระบบจำทุกการกระทำของผู้ใช้ และบันทึกคำตอบลงในโฟลเดอร์ &quot;{TARGET_FOLDER_NAME}&quot;
              </p>
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-xs rounded-full shadow-sm hover:shadow hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                เข้าสู่ระบบ Google ทันที
              </button>
            </div>
          ) : rows.length === 0 && localLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-pink-300 opacity-60" />
              <p className="text-sm">ยังไม่มีประวัติการกดคำตอบ</p>
              <p className="text-xs text-gray-400">เมื่อพี่กด &quot;ชอบ&quot; หรือ &quot;ไม่ชอบ&quot; ข้อมูลจะปรากฏที่นี่</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Show Google Sheets rows if available */}
              {rows.length > 0 ? (
                rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white rounded-2xl border border-pink-100 hover:border-pink-300 shadow-xs transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {row[2] || 'การกระทำ'}
                      </span>
                      <span className="text-gray-400 text-[11px]">{row[0]}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full text-[11px] border border-pink-100 font-medium">
                        อารมณ์: {row[5] || '-'}
                      </span>
                      {row[3] && Number(row[3]) > 0 && (
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[11px] border border-amber-100">
                          กดไม่ชอบ: {row[3]} ครั้ง
                        </span>
                      )}
                      <span className="text-gray-400 text-[11px]">ผู้ใช้: {row[1] || 'Guest'}</span>
                    </div>

                    {row[4] && row[4] !== '-' && (
                      <div className="mt-1 p-2 bg-pink-50/70 rounded-xl text-xs text-pink-900 flex items-start gap-1.5">
                        <MessageSquareHeart className="w-3.5 h-3.5 text-pink-500 flex-shrink-0 mt-0.5" />
                        <span>&quot;{row[4]}&quot;</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                /* Fallback to local logs */
                localLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-2xl border border-pink-100 shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800">{log.action}</span>
                      <span className="text-gray-400 text-[11px]">{log.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>อารมณ์: {log.mood}</span>
                      {log.noClickCount > 0 && <span>(ไม่ชอบ {log.noClickCount} ครั้ง)</span>}
                      {log.synced ? (
                        <span className="text-emerald-600 text-[11px]">✓ ซิงค์กับชีทแล้ว</span>
                      ) : (
                        <span className="text-amber-500 text-[11px]">⏳ กำลังซิงค์...</span>
                      )}
                    </div>
                    {log.message && (
                      <p className="text-xs text-pink-800 bg-pink-50 p-2 rounded-xl">
                        &quot;{log.message}&quot;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-pink-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <span>บันทึกความรู้สึกใน Google Drive อัตโนมัติ</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
