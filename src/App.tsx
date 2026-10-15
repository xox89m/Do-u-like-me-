/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, TargetAndTransition } from 'motion/react';
import {
  Heart,
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  MessageCircle,
  CloudRain,
  FileSpreadsheet,
  Folder,
  ExternalLink,
  CheckCircle2,
  Moon,
  Sun,
} from 'lucide-react';
import { CuteSticker, MoodType } from './components/CuteStickers';
import { SongPlayer } from './components/SongPlayer';
import { SingleSheetModal, SheetRow } from './components/SingleSheetModal';
import { sounds } from './lib/soundEffects';
import { googleSignIn, getAccessToken } from './lib/firebase';
import { appendLogEntry, TARGET_FOLDER_URL } from './lib/googleDriveSheets';

export default function App() {
  // Interaction states
  const [noCount, setNoCount] = useState<number>(0);
  const [yesCount, setYesCount] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [mood, setMood] = useState<MoodType>('asking');
  const [speechText, setSpeechText] = useState<string>('พี่ชอบผมรึเปล่า?');
  const [dodgePosition, setDodgePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasDodgedOnce, setHasDodgedOnce] = useState<boolean>(false);

  // Message input state
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sheet data states (No login required for respondents)
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [sheetRows, setSheetRows] = useState<SheetRow[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(false);

  // Google Drive & Sheets Sync states
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('applet_webhook_url');
    }
    return null;
  });

  // Admin stealth mode - hides all Drive & Sheet signs from normal visitors
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === 'true' || params.get('sheet') === 'true' || window.location.hash === '#admin';
  });
  const [secretClickCount, setSecretClickCount] = useState<number>(0);

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Theme: Default to Midnight #0f0f26 so the website is NEVER white!
  const [themeMode, setThemeMode] = useState<'midnight' | 'pastel'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('applet_theme_mode');
      if (saved === 'pastel') return 'pastel';
    }
    return 'midnight'; // Default #0f0f26 deep midnight
  });

  const isMidnight = themeMode === 'midnight';

  const toggleThemeMode = () => {
    setThemeMode((prev) => {
      const next = prev === 'midnight' ? 'pastel' : 'midnight';
      if (typeof window !== 'undefined') {
        localStorage.setItem('applet_theme_mode', next);
      }
      return next;
    });
  };

  // Container ref
  const playAreaRef = useRef<HTMLDivElement>(null);

  // Theme: When rejected 3 times, change to deep dark blue & light blue
  const isSadBlueTheme = noCount >= 3 && !hasLiked;

  // Sync sound manager enabled state
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Keyboard shortcut: Shift+D or Ctrl+Shift+S opens secret admin sheet viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
        (e.shiftKey && (e.key === 'D' || e.key === 'd'))
      ) {
        e.preventDefault();
        setIsAdminMode(true);
        setIsSheetModalOpen(true);
        fetchSheetRows();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Secret click handler for footer watermark (3 clicks opens sheet modal)
  const handleSecretClick = () => {
    const next = secretClickCount + 1;
    if (next >= 3) {
      setSecretClickCount(0);
      setIsAdminMode(true);
      setIsSheetModalOpen(true);
      fetchSheetRows();
      showToast('เปิดโหมดผู้ดูแล (ดูชีตและตั้งค่าไดร์) 📁✨');
    } else {
      setSecretClickCount(next);
      setTimeout(() => setSecretClickCount(0), 1400);
    }
  };

  // Check Google Drive connection status from server on mount
  const checkDriveStatus = async () => {
    try {
      const res = await fetch('/api/drive-status');
      if (res.ok) {
        const data = await res.json();
        setDriveConnected(Boolean(data.connected));
        if (data.spreadsheetUrl) {
          setSpreadsheetUrl(data.spreadsheetUrl);
        }
        if (data.webhookUrl) {
          setWebhookUrl(data.webhookUrl);
          localStorage.setItem('applet_webhook_url', data.webhookUrl);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch drive status:', err);
    }
  };

  useEffect(() => {
    checkDriveStatus();
    fetchSheetRows();

    // Auto-poll logs every 5 seconds so owner sees responses in real-time
    const interval = setInterval(() => {
      fetchSheetRows();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Save Google Apps Script Webhook URL for zero-login automatic Drive logging
  const handleSaveWebhook = async (url: string) => {
    try {
      localStorage.setItem('applet_webhook_url', url);
      setWebhookUrl(url);
      const res = await fetch('/api/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url }),
      });
      if (res.ok) {
        await checkDriveStatus();
        showToast('บันทึก Webhook สำหรับส่งข้อมูลเข้า Google Sheets สำเร็จ! ✨');
      } else {
        showToast('บันทึก Webhook ลงเบราว์เซอร์เรียบร้อยแล้ว! ✨');
      }
    } catch (err) {
      console.error('Failed to save webhook to server, saved locally:', err);
      showToast('บันทึก Webhook ลงเบราว์เซอร์เรียบร้อยแล้ว! ✨');
    }
  };

  // Sync all responses to Google Sheets
  const handleSyncAll = async () => {
    try {
      const res = await fetch('/api/sync-all', { method: 'POST' });
      if (res.ok) {
        showToast('ซิงค์ข้อมูลทั้งหมดเข้า Google Sheets เรียบร้อยแล้ว! 📁');
      }
    } catch (err) {
      console.error('Failed to sync all:', err);
    }
  };

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Connect Google Drive & Sheets via Google OAuth
  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    try {
      const authResult = await googleSignIn();
      if (!authResult) {
        // User closed the popup
        setIsConnectingDrive(false);
        return;
      }

      const { accessToken } = authResult;
      // Send token to server to create/locate spreadsheet in folder "แบร่" and sync rows
      const syncRes = await fetch('/api/drive-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      if (syncRes.ok) {
        const data = await syncRes.json();
        setDriveConnected(true);
        if (data.spreadsheetUrl) {
          setSpreadsheetUrl(data.spreadsheetUrl);
        }
        showToast('เชื่อมต่อและสร้างชีตในโฟลเดอร์ แบร่ บน Google Drive เรียบร้อยแล้ว! 📁✨');
      } else {
        showToast('เชื่อมต่อสำเร็จ แต่ยังเข้าถึงโฟลเดอร์ แบร่ ไม่ได้ กำลังใช้ไดร์ส่วนตัว');
      }
    } catch (err) {
      console.error('Connect drive error:', err);
      showToast('ไม่สามารถเชื่อมต่อ Google Drive ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsConnectingDrive(false);
    }
  };

  // Fetch logged responses (Combines backend API and localStorage for GitHub Pages compatibility)
  const fetchSheetRows = async () => {
    setIsLoadingSheet(true);
    let serverRows: SheetRow[] = [];
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        serverRows = await res.json();
      }
    } catch {}

    try {
      const localData: SheetRow[] = JSON.parse(localStorage.getItem('applet_responses') || '[]');
      if (serverRows.length > 0) {
        // Merge without duplicates
        const combined = [...serverRows];
        localData.forEach((lr) => {
          if (!combined.some((cr) => cr.timestamp === lr.timestamp && cr.action === lr.action)) {
            combined.push(lr);
          }
        });
        setSheetRows(combined);
      } else {
        setSheetRows(localData);
      }
    } catch (err) {
      console.warn('Failed to parse local rows:', err);
      if (serverRows.length > 0) setSheetRows(serverRows);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Record action directly to server JSON/CSV, localStorage, and Google Apps Script Webhook
  const recordAction = async (action: string, currentCount: number, currentMood: string, msgText?: string) => {
    const timeOnly = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    // Name format: "{เวลา} ไอ้นี้" as requested
    const defaultName = `${timeOnly} ไอ้นี้`;

    const payload = {
      timestamp: new Date().toLocaleString('th-TH'),
      userName: defaultName,
      action,
      noClickCount: currentCount,
      message: msgText || '-',
      mood: currentMood,
    };

    // 1. Save to localStorage (guarantees data is saved on static GitHub Pages)
    try {
      const existing: SheetRow[] = JSON.parse(localStorage.getItem('applet_responses') || '[]');
      existing.unshift(payload);
      localStorage.setItem('applet_responses', JSON.stringify(existing.slice(0, 200)));
      setSheetRows((prev) => [payload, ...prev]);
    } catch {}

    // 2. Client-side direct send to Google Apps Script Webhook (works on GitHub Pages with zero login!)
    const targetWebhook = webhookUrl || (typeof window !== 'undefined' ? localStorage.getItem('applet_webhook_url') : null);
    if (targetWebhook) {
      try {
        fetch(targetWebhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch {}
    }

    // 3. Send to server backend if active
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {}

    // 4. Client-side direct append to Google Sheets if OAuth token active
    try {
      const token = await getAccessToken();
      if (token) {
        appendLogEntry(token, payload);
      }
    } catch {}
  };

  // Dodge calculation
  const calculateDodgePosition = () => {
    const maxX = 120;
    const maxY = 60;
    const randX = (Math.random() - 0.5) * 2 * maxX;
    const randY = (Math.random() - 0.5) * 2 * maxY;
    return { x: randX, y: randY };
  };

  // Hover dodge attempt on first "ไม่ชอบ"
  const handleNoDodgeAttempt = () => {
    if (noCount === 0 && !hasDodgedOnce) {
      sounds.playWhoosh();
      const newPos = calculateDodgePosition();
      setDodgePosition(newPos);
      setHasDodgedOnce(true);
      setMood('dodge1');
      setSpeechText('จริงๆหรออ 😗');
      recordAction('กดไม่ชอบ ครั้งที่ 1 (ปุ่มหลบ)', 1, 'จริงๆหรออ 😗');
    }
  };

  // Handler for clicking "ไม่ชอบ" (MAX 3 TIMES)
  const handleNoClick = () => {
    if (noCount >= 3) return;

    const nextCount = noCount + 1;
    setNoCount(nextCount);

    if (nextCount === 1) {
      sounds.playWhoosh();
      const newPos = calculateDodgePosition();
      setDodgePosition(newPos);
      setHasDodgedOnce(true);
      setMood('dodge1');
      setSpeechText('จริงๆหรออ 😗');
      recordAction('กดไม่ชอบ ครั้งที่ 1', 1, 'จริงๆหรออ 😗');
    } else if (nextCount === 2) {
      sounds.playSadSqueak();
      setDodgePosition({ x: 0, y: 0 });
      setMood('click2');
      setSpeechText('จริงดิ 🥲');
      recordAction('กดไม่ชอบ ครั้งที่ 2', 2, 'จริงดิ 🥲');
    } else if (nextCount === 3) {
      sounds.playDrama();
      setDodgePosition({ x: 0, y: 0 });
      setMood('click3');
      setSpeechText('เอ้้าา โดนเล่นกับใจหรอเนี่ย 💔');
      recordAction('กดไม่ชอบ ครั้งที่ 3 (ปฏิเสธ)', 3, 'เอ้้าา โดนเล่นกับใจหรอเนี่ย 💔');
    }
  };

  // Handler for clicking "ชอบ" (Step-by-step with progressive screen darkening & shaking)
  const handleYesClick = () => {
    const nextYes = yesCount + 1;
    setYesCount(nextYes);

    // Haptic vibration feedback for mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (nextYes === 1) navigator.vibrate([60, 30, 60]);
      else if (nextYes === 2) navigator.vibrate([100, 50, 100, 50, 100]);
      else if (nextYes === 3) navigator.vibrate([200, 80, 200, 80, 300]);
    }

    if (nextYes === 1) {
      // ครั้งที่ 1: "เดี๋ยวก่อนน คิดดีๆนะ" -> จอเริ่มมืดลง + สั่นเบาๆ
      sounds.playPop();
      setMood('yes1');
      setSpeechText('เดี๋ยวก่อนน คิดดีๆนะ 🥺');
      recordAction('กดชอบ ครั้งที่ 1', noCount, 'เดี๋ยวก่อนน คิดดีๆนะ');
    } else if (nextYes === 2) {
      // ครั้งที่ 2: "แน่ใจจ แต่ผมไม่ได้ดีอะไรขนาดนั้นนะ" -> จอมืดลงอีก + สั่นแรงขึ้น
      sounds.playPop();
      setMood('yes2');
      setSpeechText('แน่ใจจ แต่ผมไม่ได้ดีอะไรขนาดนั้นนะ 👉👈');
      recordAction('กดชอบ ครั้งที่ 2', noCount, 'แน่ใจจ แต่ผมไม่ได้ดีอะไรขนาดนั้นนะ');
    } else if (nextYes === 3) {
      // ครั้งที่ 3: "เห้ยย พี่เสียสติไปแล้ว ผมง้อคนไม่เป็น เอาใจใส่คนไม่เก่ง เผลอทำคนอื่น น้อยใจไม่รู้ตัวอีกนะ คิดดีๆ อย่ามาชอบคนแบบผมเลยยย" -> จอมืดตื๋อ + สั่นสะเทือนแรง
      sounds.playDrama();
      setMood('yes3');
      setSpeechText('เห้ยย พี่เสียสติไปแล้ว ผมง้อคนไม่เป็น เอาใจใส่คนไม่เก่ง เผลอทำคนอื่น น้อยใจไม่รู้ตัวอีกนะ คิดดีๆ อย่ามาชอบคนแบบผมเลยยย');
      recordAction('กดชอบ ครั้งที่ 3', noCount, 'เห้ยย พี่เสียสติไปแล้ว... อย่ามาชอบคนแบบผมเลยยย');
    } else {
      // ครั้งสุดท้าย: "จริงมั้ยเนี่ยย พี่เสียสติไปแล้วว ผมจะแจ้งตำรวจ" -> จอกลับมาสว่างปกติ! สั่นหยุด! เอาหัวใจออก! สติ๊กเกอร์เป็นหน้าอ้อน!
      sounds.playCelebrationFanfare();
      setHasLiked(true);
      setMood('accepted');
      setSpeechText('จริงมั้ยเนี่ยย พี่เสียสติไปแล้วว ผมจะแจ้งตำรวจ ');
      recordAction('กดชอบ ครั้งสุดท้าย ✨', noCount, 'จริงมั้ยเนี่ยย พี่เสียสติไปแล้วว ผมจะแจ้งตำรวจ ');
    }
  };

  // Handler for submitting custom message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) return;

    sounds.playPop();
    setIsSendingMessage(true);
    const textToSend = customMessage.trim();
    setSentMessage(textToSend);
    setCustomMessage('');

    await recordAction('ส่งข้อความถึงน้อง', noCount, mood, textToSend);
    setIsSendingMessage(false);
    showToast('ส่งข้อความถึงน้องแล้วนะ ');
  };

  // Reset to play again
  const handleReset = () => {
    sounds.playPop();
    setNoCount(0);
    setYesCount(0);
    setHasLiked(false);
    setMood('asking');
    setSpeechText('พี่ชอบผมรึเปล่า?');
    setDodgePosition({ x: 0, y: 0 });
    setHasDodgedOnce(false);
    setSentMessage(null);
  };

  // Compute SHRINKING scale for "ชอบ" button
  const getYesButtonScale = () => {
    if (noCount === 0) return 1.0;
    if (noCount === 1) return 0.8;
    if (noCount === 2) return 0.62;
    return 0.45;
  };

  // Card vibration and shaking animation when pressing "ชอบ"
  const getCardShakeAnimation = (): TargetAndTransition => {
    if (hasLiked || yesCount === 0) return {};
    if (yesCount === 1) {
      return {
        x: [-3, 3, -2, 2, 0],
        y: [-1, 1, 0],
        transition: { repeat: Infinity, duration: 0.18, ease: 'linear' as const },
      };
    }
    if (yesCount === 2) {
      return {
        x: [-6, 6, -5, 5, -2, 2, 0],
        y: [-2, 2, -1, 1, 0],
        rotate: [-0.6, 0.6, -0.6],
        transition: { repeat: Infinity, duration: 0.14, ease: 'linear' as const },
      };
    }
    // yesCount === 3
    return {
      x: [-10, 10, -8, 8, -4, 4, 0],
      y: [-4, 4, -2, 2, 0],
      rotate: [-1.4, 1.4, -1.4],
      transition: { repeat: Infinity, duration: 0.1, ease: 'linear' as const },
    };
  };

  return (
    <div
      className={`relative min-h-screen w-full transition-colors duration-1000 flex flex-col justify-between overflow-x-hidden ${
        isSadBlueTheme
          ? 'bg-gradient-to-br from-[#060D24] via-[#0E1F4D] to-[#142C66] text-blue-100 selection:bg-sky-400'
          : isMidnight
          ? 'bg-[#0f0f26] bg-gradient-to-br from-[#0f0f26] via-[#121236] to-[#090919] text-white selection:bg-pink-500'
          : hasLiked
          ? 'bg-gradient-to-br from-rose-100 via-pink-100 to-amber-50 text-gray-800 selection:bg-pink-300'
          : 'bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 text-gray-800 selection:bg-pink-300'
      }`}
    >
      {/* Screen Darkening Overlay when pressing "ชอบ" (มืดลงเรื่อยๆ และกลับมาปกติเมื่อชอบครั้งสุดท้าย) */}
      <AnimatePresence>
        {!hasLiked && yesCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity:
                yesCount === 1 ? 0.35 :
                yesCount === 2 ? 0.65 :
                0.88,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-black pointer-events-none z-15"
          />
        )}
      </AnimatePresence>

      {/* Subtle Rain droplets when in Sad Blue Theme */}
      {isSadBlueTheme && (
        <div className="fixed inset-0 pointer-events-none z-10 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
      )}

      {/* Top Bar - Clean & Stealth: Visitors only see title, theme toggle & sound toggle */}
      <header className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-md transition-all ${
              isSadBlueTheme
                ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sky-900/50'
                : isMidnight
                ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-indigo-950/60'
                : 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-pink-200/50'
            }`}
          >
            {isSadBlueTheme ? (
              <CloudRain className="w-5 h-5 animate-bounce" />
            ) : hasLiked ? (
              <Sparkles className="w-5 h-5 fill-current animate-pulse text-amber-200" />
            ) : (
              <Heart className="w-5 h-5 fill-current animate-pulse" />
            )}
          </div>
          <span
            className={`font-bold text-sm sm:text-base leading-tight ${
              isSadBlueTheme ? 'text-sky-200' : isMidnight ? 'text-indigo-100' : 'text-gray-800'
            }`}
          >
            พี่ชอบผมรึเปล่า?
          </span>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Admin Tools: Completely hidden from regular visitors! Only visible when isAdminMode is true */}
          {isAdminMode && (
            <>
              {/* Google Drive Status Pill */}
              {driveConnected ? (
                <a
                  href={spreadsheetUrl || TARGET_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all ${
                    isSadBlueTheme
                      ? 'bg-blue-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-blue-900'
                      : isMidnight
                      ? 'bg-[#18183c] border border-emerald-500/40 text-emerald-300 hover:bg-[#20204d]'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  }`}
                  title="เปิดดู Google Sheets ในโฟลเดอร์ แบร่"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">ไดร์ แบร่ เชื่อมต่อแล้ว</span>
                  <span className="sm:hidden">ไดร์ แบร่ ✓</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>
              ) : (
                <button
                  onClick={handleConnectDrive}
                  disabled={isConnectingDrive}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                    isSadBlueTheme
                      ? 'bg-blue-950/80 border border-sky-600 text-sky-200 hover:bg-blue-900'
                      : isMidnight
                      ? 'bg-[#18183c] border border-indigo-700/60 text-indigo-200 hover:bg-[#20204d]'
                      : 'bg-white/90 border border-pink-200 text-pink-700 hover:bg-pink-50'
                  }`}
                  title="เชื่อมต่อ Google Drive เพื่อบันทึกลงโฟลเดอร์ แบร่"
                >
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isConnectingDrive ? 'กำลังเชื่อม...' : 'บันทึกลงไดร์ แบร่'}</span>
                </button>
              )}

              {/* View Single Sheet File Button */}
              <button
                onClick={() => {
                  fetchSheetRows();
                  setIsSheetModalOpen(true);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  isSadBlueTheme
                    ? 'bg-blue-950/80 border-blue-800 text-sky-200 hover:bg-blue-900'
                    : isMidnight
                    ? 'bg-[#18183c] border-indigo-700/60 text-indigo-200 hover:bg-[#20204d]'
                    : 'bg-white/80 border-pink-200 text-gray-700 hover:text-pink-600 hover:bg-white'
                }`}
                title="เปิดดูไฟล์ชีตคำตอบทั้งหมด"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">ดูชีตคำตอบ</span>
                <span className="sm:hidden">ชีต</span>
                {sheetRows.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-pink-500 text-white text-[10px] rounded-full font-bold">
                    {sheetRows.length}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Theme Toggle (#0f0f26 Midnight vs Pastel) */}
          <button
            onClick={toggleThemeMode}
            className={`p-2 rounded-full border shadow-xs transition-all cursor-pointer ${
              isSadBlueTheme
                ? 'bg-blue-950/70 border-blue-800 text-sky-300 hover:bg-blue-900'
                : isMidnight
                ? 'bg-[#18183c] border-indigo-700/60 text-amber-300 hover:text-amber-200 hover:bg-[#222250]'
                : 'bg-white/80 border-pink-100 text-gray-600 hover:text-pink-600 hover:bg-white'
            }`}
            title={isMidnight ? 'เปลี่ยนเป็นธีมพาสเทลชมพู' : 'เปลี่ยนเป็นธีมมิดไนท์ (#0f0f26)'}
          >
            {isMidnight ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Sound Toggle (Always visible) */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-full border shadow-xs transition-all cursor-pointer ${
              isSadBlueTheme
                ? 'bg-blue-950/70 border-blue-800 text-sky-300 hover:bg-blue-900'
                : isMidnight
                ? 'bg-[#18183c] border-indigo-700/60 text-indigo-300 hover:text-pink-300 hover:bg-[#222250]'
                : 'bg-white/80 border-pink-100 text-gray-600 hover:text-pink-600 hover:bg-white'
            }`}
            title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
          >
            {soundEnabled ? (
              <Volume2 className={`w-4 h-4 ${isSadBlueTheme ? 'text-sky-400' : isMidnight ? 'text-pink-400' : 'text-pink-500'}`} />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-5 py-2.5 rounded-full shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 max-w-[90vw] text-center ${
              isSadBlueTheme
                ? 'bg-blue-900/95 text-sky-200 border-sky-500/50'
                : isMidnight
                ? 'bg-[#1b1b42]/95 text-indigo-100 border-indigo-500/40 shadow-indigo-950/60'
                : 'bg-white/95 text-pink-700 border-pink-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interactive Stage with dynamic shake animation */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full z-20">
        <motion.div
          layout
          animate={getCardShakeAnimation()}
          className={`w-full rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border flex flex-col items-center text-center relative overflow-hidden transition-all duration-700 ${
            isSadBlueTheme
              ? 'bg-[#0B1A3A]/90 backdrop-blur-xl border-blue-800/80 shadow-sky-950/80 text-blue-100'
              : isMidnight
              ? 'bg-[#151538]/92 backdrop-blur-xl border-indigo-500/30 shadow-2xl shadow-indigo-950/80 text-white'
              : 'bg-white/80 backdrop-blur-xl border-white/60 shadow-pink-200/40 text-gray-800'
          }`}
        >
          {/* Glowing backdrops */}
          <div
            className={`absolute -top-24 -left-24 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
              isSadBlueTheme ? 'bg-sky-600/25' : isMidnight ? 'bg-indigo-600/20' : 'bg-pink-200/40'
            }`}
          />
          <div
            className={`absolute -bottom-24 -right-24 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
              isSadBlueTheme ? 'bg-blue-600/25' : isMidnight ? 'bg-pink-600/15' : 'bg-rose-200/40'
            }`}
          />

          {/* Sticker Animation with "พี่บ้าา" badge */}
          <div className="my-2 relative flex flex-col items-center justify-center">
            <AnimatePresence>
              {(hasLiked || mood === 'accepted') && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: 15, rotate: -4 }}
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: 1,
                    y: [0, -3, 0],
                    rotate: [-3, 2, -3],
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                    y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                    rotate: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' },
                  }}
                  className="z-30 -mb-5 px-5 py-2 bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 text-white font-extrabold text-lg sm:text-xl rounded-full shadow-lg shadow-sky-400/40 border-2 border-white flex items-center gap-2 select-none"
                  style={{ fontFamily: "'Mali', 'Itim', cursive" }}
                >
                  <span className="drop-shadow-sm">พี่บ้าา</span>
                  <span className="text-base animate-pulse">🥺💙</span>
                </motion.div>
              )}
            </AnimatePresence>
            <CuteSticker mood={mood} className="w-48 h-48 sm:w-56 sm:h-56" />
          </div>

          {/* Dialogue Speech Bubble */}
          <motion.div
            key={speechText}
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className={`mt-2 px-6 py-3 rounded-3xl text-lg sm:text-2xl font-bold tracking-wide shadow-xs transition-all duration-500 max-w-lg leading-relaxed ${
              hasLiked
                ? 'bg-gradient-to-r from-amber-400 via-pink-400 to-rose-400 text-white shadow-pink-200/50 shadow-lg'
                : isSadBlueTheme
                ? 'bg-gradient-to-r from-blue-900 to-sky-950 text-sky-200 border border-sky-500/40 shadow-sky-900/40'
                : isMidnight
                ? (yesCount > 0
                    ? 'bg-gradient-to-r from-rose-950/80 via-[#2f1a38] to-pink-950/80 text-rose-200 border border-pink-500/40 shadow-lg shadow-pink-950/50'
                    : noCount === 2
                    ? 'bg-blue-950/90 text-blue-200 border border-blue-500/40'
                    : noCount === 1
                    ? 'bg-amber-950/90 text-amber-200 border border-amber-500/40'
                    : 'bg-gradient-to-r from-[#1c1c46] via-[#222254] to-[#1c1c46] text-indigo-100 border border-indigo-500/30 shadow-indigo-950/50')
                : noCount === 2
                ? 'bg-blue-50 text-blue-900 border border-blue-200'
                : noCount === 1
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : yesCount > 0
                ? 'bg-rose-50 text-rose-900 border border-rose-200'
                : 'bg-gradient-to-r from-pink-50 to-rose-50 text-gray-800 border border-pink-100'
            }`}
          >
            {speechText}
          </motion.div>

          {/* When rejected 3 times: Show the requested sad message card */}
          {noCount >= 3 && !hasLiked && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 p-5 bg-blue-950/80 border border-sky-400/30 rounded-3xl text-sky-200 max-w-lg shadow-lg shadow-sky-950/60 leading-relaxed text-sm sm:text-base font-medium relative"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-0.5 bg-sky-900 text-sky-300 text-[11px] rounded-full border border-sky-600 font-semibold">
                ความในใจของน้อง... 💧
              </div>
              <p className="mt-1 text-sky-100">
                &ldquo;อื้อ ผมเข้าใจได้ เห็นพี่ทำงั้นนึกว่าพี่มีใจ เห็นลงโน้ต แล้วก็อยู่ด้วยตลอด คงจะเหงาแหละ ผมเข้าใจนะ&rdquo;
              </p>
            </motion.div>
          )}

          {/* Choices Buttons Area:
              - When noCount < 3: shows "ชอบ" (shrinking) and "ไม่ชอบ" (dodging)
              - When noCount >= 3: both "ชอบ" and "ไม่ชอบ" are completely removed! */}
          {!hasLiked && noCount < 3 && (
            <div
              ref={playAreaRef}
              className="mt-8 mb-4 relative min-h-[90px] w-full flex flex-wrap items-center justify-center gap-5 sm:gap-8"
            >
              {/* Button: "ชอบ" (Must be clicked 3 times then final to accept, darkens & shakes each time) */}
              <motion.button
                onClick={handleYesClick}
                whileHover={{ scale: getYesButtonScale() * 1.08 }}
                whileTap={{ scale: getYesButtonScale() * 0.92 }}
                animate={{
                  scale: getYesButtonScale(),
                }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="relative px-7 sm:px-9 py-3 sm:py-3.5 font-bold text-base sm:text-lg rounded-full shadow-lg transition-all cursor-pointer flex items-center gap-2 group z-10 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 text-white shadow-pink-300/50 hover:shadow-pink-300/70"
              >
                <Sparkles className="w-5 h-5 text-white group-hover:scale-125 transition-transform" />
                <span>
                  {yesCount === 0 && 'ชอบ'}
                  {yesCount === 1 && 'ชอบสิ! (คิดดีแล้ว)'}
                  {yesCount === 2 && 'ก็ยังจะชอบอยู่ดี!'}
                  {yesCount >= 3 && 'ยืนยันว่าจะชอบ!'}
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">
                  ✨
                </span>
              </motion.button>

              {/* Button: "ไม่ชอบ" (Allowed ONLY 3 times!) */}
              <motion.div
                animate={{
                  x: dodgePosition.x,
                  y: dodgePosition.y,
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                className="inline-block"
              >
                <button
                  onMouseEnter={noCount === 0 ? handleNoDodgeAttempt : undefined}
                  onClick={handleNoClick}
                  className={`px-6 sm:px-7 py-3 sm:py-3.5 font-semibold text-sm sm:text-base rounded-full shadow-xs transition-all duration-200 border cursor-pointer active:scale-95 ${
                    noCount === 2
                      ? isMidnight
                        ? 'bg-blue-950/80 text-sky-300 border-blue-700 hover:bg-blue-900'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : isMidnight
                      ? 'bg-[#1b1b42] text-indigo-200 border-indigo-500/40 hover:bg-[#242456] hover:text-white'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  {noCount === 0 && 'ไม่ชอบ'}
                  {noCount === 1 && 'ไม่ชอบจริงๆ นะ 😗'}
                  {noCount === 2 && 'ยืนยันว่าไม่ชอบ 🥲'}
                </button>
              </motion.div>
            </div>
          )}

          {/* Celebration state controls (NO hearts - clean gentle cute celebration with pleading bunny) */}
          {hasLiked && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div
                className={`p-3 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2 border ${
                  isMidnight
                    ? 'bg-[#1e1e48] text-amber-200 border-amber-500/30'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>งื้ออ พี่ชอบผมได้ไงเนี่ย</span>
              </div>
              <button
                onClick={handleReset}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  isMidnight
                    ? 'bg-[#1e1e48] hover:bg-[#282860] text-pink-300 border-pink-500/30'
                    : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>เล่นใหม่อีกรอบ</span>
              </button>
            </div>
          )}

          {/* Replay option if at 3 no's */}
          {noCount >= 3 && !hasLiked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 mb-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-sky-300 rounded-full text-xs font-medium border border-blue-700 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>เริ่มถามใหม่อีกครั้ง</span>
              </button>
            </motion.div>
          )}

          {/* Custom Message Input Section:
              ต้องกดชอบครบถึงครั้งสุดท้าย หรือกดไม่ชอบครั้งสุดท้ายก่อนถึงจะขึ้นให้พิมพ์ได้! */}
          {(hasLiked || noCount >= 3) && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className={`mt-6 w-full pt-6 border-t ${
                isSadBlueTheme
                  ? 'border-blue-800/60'
                  : isMidnight
                  ? 'border-indigo-500/25'
                  : 'border-pink-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label
                  className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
                    isSadBlueTheme ? 'text-sky-200' : isMidnight ? 'text-indigo-200' : 'text-gray-700'
                  }`}
                >
                  <MessageCircle className={`w-4 h-4 ${isSadBlueTheme ? 'text-sky-400' : 'text-pink-500'}`} />
                  <span>มีอะไรอยากบอกเพิ่มไหมคับบ? พิมพ์บอกได้นะ </span>
                </label>
                {sentMessage && (
                  <span className="text-[11px] text-emerald-500 font-medium">✓ ส่งแล้ว</span>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความในใจถึงน้อง..."
                  className={`flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl border focus:outline-none transition-all ${
                    isSadBlueTheme
                      ? 'bg-blue-950/80 text-sky-100 border-blue-700 focus:ring-2 focus:ring-sky-400 placeholder:text-blue-300/40'
                      : isMidnight
                      ? 'bg-[#0f0f26]/90 text-white border-indigo-500/40 focus:ring-2 focus:ring-indigo-400 placeholder:text-indigo-300/40'
                      : 'bg-pink-50/50 hover:bg-pink-50/80 focus:bg-white text-gray-800 border-pink-200 focus:ring-2 focus:ring-pink-400 placeholder:text-gray-400'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !customMessage.trim()}
                  className={`px-4 sm:px-5 py-2.5 font-semibold text-xs sm:text-sm rounded-2xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer active:scale-95 text-white ${
                    isSadBlueTheme
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ส่งข้อความ</span>
                </button>
              </form>

              {sentMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 text-left p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    isSadBlueTheme
                      ? 'bg-blue-950 text-sky-200 border-blue-700'
                      : isMidnight
                      ? 'bg-[#141438] text-emerald-300 border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  }`}
                >
                  <span>ข้อความล่าสุด: &quot;{sentMessage}&quot;</span>
                  <span className="text-[10px] text-emerald-400 font-medium">ส่งถึงน้องแล้วนะ ✉️</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer & Stealth Watermark:
          Click 3 times to open admin sheet modal without visitor suspecting anything! */}
      <footer className="w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs relative z-30 pointer-events-auto">
        <div className={`text-[11px] hidden sm:block ${isMidnight ? 'text-indigo-400/60' : 'text-gray-400'}`}>
          {noCount > 0 && noCount < 3 && `(ปฏิเสธไปแล้ว ${noCount}/3 ครั้ง)`}
        </div>

        {/* Small bottom-right watermark - Tap 3 times to open admin sheet */}
        <button
          type="button"
          onClick={handleSecretClick}
          className={`sm:fixed sm:bottom-4 sm:right-6 px-3.5 py-1.5 rounded-full border shadow-xs font-medium text-[11px] sm:text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isSadBlueTheme
              ? 'bg-blue-950/80 backdrop-blur-md border-blue-800 text-sky-300 hover:bg-blue-900'
              : isMidnight
              ? 'bg-[#16163a]/80 backdrop-blur-md border-indigo-500/30 text-indigo-200 hover:bg-[#20204d]'
              : 'bg-white/80 backdrop-blur-md border-pink-100/90 text-pink-600/90 hover:bg-white'
          }`}
          title="From เด็กที่ชอบอยู่กับพี่ (คลิก 3 ครั้งเพื่อดูข้อมูลชีต)"
        >
          <Sparkles
            className={`w-3 h-3 ${
              isSadBlueTheme ? 'text-sky-400' : 'text-amber-400'
            }`}
          />
          <span>From เด็กที่ชอบอยู่กับพี่</span>
          <span>🐾</span>
        </button>
      </footer>

      {/* Floating Music Player: "พี่คงไม่ชอบผมหรอก" with Discord Call Cover Art */}
      <SongPlayer />

      {/* Single Sheet Data Viewer Modal */}
      <SingleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        rows={sheetRows}
        onRefresh={fetchSheetRows}
        isLoading={isLoadingSheet}
        driveConnected={driveConnected}
        spreadsheetUrl={spreadsheetUrl}
        onConnectDrive={handleConnectDrive}
        isConnectingDrive={isConnectingDrive}
        webhookUrl={webhookUrl}
        onSaveWebhook={handleSaveWebhook}
        onSyncAll={handleSyncAll}
      />
    </div>
  );
}
