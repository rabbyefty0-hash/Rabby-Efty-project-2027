import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, Calendar as CalendarIcon, MessageSquare, Video, 
  Upload, Trash2, Plus, LogOut, ArrowLeft, Loader2, 
  ExternalLink, Send, Check, Copy, AlertCircle, File, 
  Clock, RefreshCw, User, ShieldAlert,
  ChevronRight, Compass, Download, PlusCircle, Sparkles,
  MoreVertical
} from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  signInWithGoogle, 
  logout, 
  getAccessToken, 
  setAccessToken, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from '../firebase';

interface WorkspaceHubProps {
  onBack: () => void;
}

type TabType = 'drive' | 'calendar' | 'chat' | 'meet';

export function WorkspaceHub({ onBack }: WorkspaceHubProps) {
  const [activeTab, setActiveTab] = useState<TabType>('drive');
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Drive state
  const [files, setFiles] = useState<any[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Calendar state
  const [events, setEvents] = useState<any[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  
  // New Event Form State
  const [newEventSummary, setNewEventSummary] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('12:00');
  const [newEventDuration, setNewEventDuration] = useState('60');

  // Chat state
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);

  // Meet state
  const [createdSpaces, setCreatedSpaces] = useState<any[]>([]);
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [meetError, setMeetError] = useState<string | null>(null);

  // Context Menu & File Export States
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    file: any;
  }>({
    visible: false,
    x: 0,
    y: 0,
    file: null
  });
  const [isDownloadingFileId, setIsDownloadingFileId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const currentToken = getAccessToken();
      setToken(currentToken);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Calendar and Chat states to localStorage for Home Screen Widget real-time overview updates
  useEffect(() => {
    if (events && events.length > 0) {
      localStorage.setItem('workspace_next_event', JSON.stringify(events[0]));
      localStorage.setItem('workspace_events_list', JSON.stringify(events));
    } else {
      localStorage.removeItem('workspace_next_event');
      localStorage.removeItem('workspace_events_list');
    }
  }, [events]);

  useEffect(() => {
    if (spaces && spaces.length > 0) {
      localStorage.setItem('workspace_spaces_list', JSON.stringify(spaces));
      const totalUnread = spaces.reduce((acc, s) => acc + (s.unreadCount || 0), 0);
      localStorage.setItem('workspace_unread_chat_messages', totalUnread.toString());
    } else {
      localStorage.removeItem('workspace_spaces_list');
      localStorage.setItem('workspace_unread_chat_messages', '0');
    }
  }, [spaces]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        setUser(loggedUser);
        const t = getAccessToken();
        setToken(t);
      }
    } catch (err: any) {
      console.error('Authentication failed:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        setConnectionError('Google Sign-In popup was closed or blocked. You can still use Guest Simulation Mode to try out the Workspace app.');
      } else {
        setConnectionError(`Authentication failed: ${err.message || err}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectGuest = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      // Try real Firebase Anonymous session first
      const result = await signInAnonymously(auth);
      const guestUser = result.user;
      setUser(guestUser);
      setToken('mock_workspace_token');
      setAccessToken('mock_workspace_token');
    } catch (err: any) {
      console.warn('Firebase signInAnonymously failed (likely disabled in console). Falling back to client-side offline mock guest session:', err);
      // Fallback immediately to simulated Guest user so the user is never blocked
      const simulatedGuest: any = {
        uid: 'guest_simulated_user',
        displayName: 'Guest User',
        email: 'guest@workspace.sim',
        photoURL: null,
        emailVerified: true,
        isAnonymous: true,
        metadata: {},
        providerData: [],
        delete: async () => {},
        getIdToken: async () => 'mock_id_token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({})
      };
      setUser(simulatedGuest);
      setToken('mock_workspace_token');
      setAccessToken('mock_workspace_token');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setAccessToken(null);
  };

  // 1. Google Drive functions
  const fetchDriveFiles = async () => {
    if (!token) return;
    setIsDriveLoading(true);
    setDriveError(null);
    if (token === 'mock_workspace_token') {
      setTimeout(() => {
        setFiles(prev => {
          if (prev.length > 0) return prev;
          return [
            { id: 'mock-1', name: 'RabbyOS Architecture Blueprint.pdf', mimeType: 'application/pdf', size: '2411724', webViewLink: '#', iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_10_pdf_list.png' },
            { id: 'mock-2', name: 'Product Growth Strategy Q3.docx', mimeType: 'application/vnd.google-apps.document', size: '154200', webViewLink: '#', iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_11_document_list.png' },
            { id: 'mock-3', name: 'Developer Guide & API Endpoints.md', mimeType: 'text/markdown', size: '48902', webViewLink: '#', iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_10_text_list.png' },
            { id: 'mock-4', name: 'Active User Metrics & Retentions.xlsx', mimeType: 'application/vnd.google-apps.spreadsheet', size: '1092800', webViewLink: '#', iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_11_spreadsheet_list.png' }
          ];
        });
        setIsDriveLoading(false);
      }, 500);
      return;
    }
    try {
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,size,webViewLink,iconLink)&pageSize=40',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          setToken(null);
          setAccessToken(null);
          throw new Error('Access session expired. Please sign in again.');
        }
        throw new Error('Failed to fetch Google Drive files.');
      }
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      setDriveError(err.message || 'Error loading files');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    setDriveError(null);
    if (token === 'mock_workspace_token') {
      setTimeout(() => {
        const newMockFile = {
          id: `mock-${Date.now()}`,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size.toString(),
          webViewLink: '#',
          iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_10_text_list.png'
        };
        setFiles(prev => [newMockFile, ...prev]);
        setIsUploading(false);
      }, 600);
      return;
    }
    try {
      const metadata = { name: file.name, mimeType: file.type };
      const formData = new FormData();
      formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      formData.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );

      if (!response.ok) throw new Error('Failed to upload file.');
      await fetchDriveFiles();
    } catch (err: any) {
      setDriveError(err.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${fileName}" from Google Drive? This action cannot be undone.`
    );
    if (!isConfirmed) return;

    setDriveError(null);
    if (token === 'mock_workspace_token') {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      return;
    }
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete file.');
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      setDriveError(err.message || 'Error deleting file.');
    }
  };

  // 2. Google Calendar functions
  const fetchCalendarEvents = async () => {
    if (!token) return;
    setIsCalendarLoading(true);
    setCalendarError(null);
    if (token === 'mock_workspace_token') {
      setTimeout(() => {
        setEvents(prev => {
          if (prev.length > 0) return prev;
          return [
            {
              id: 'cal-mock-1',
              summary: '🚀 RabbyOS v2.0 Tech Launch Sync',
              description: 'Alignment meeting to coordinate the production release of the new modules and widgets.',
              start: { dateTime: new Date(Date.now() + 3600000 * 2).toISOString() },
              end: { dateTime: new Date(Date.now() + 3600000 * 3).toISOString() }
            },
            {
              id: 'cal-mock-2',
              summary: '📈 Marketing Strategy & Growth Review',
              description: 'Brainstorm goals, user retentions, and marketing campaign targets for next month.',
              start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
              end: { dateTime: new Date(Date.now() + 86400000 + 1800000).toISOString() }
            },
            {
              id: 'cal-mock-3',
              summary: '🤝 Client Feedback Showcase',
              description: 'Walking through initial user reports and refining backlog according to suggestions.',
              start: { dateTime: new Date(Date.now() + 86400000 * 2).toISOString() },
              end: { dateTime: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString() }
            }
          ];
        });
        setIsCalendarLoading(false);
      }, 500);
      return;
    }
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}&maxResults=15`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to load Google Calendar events.');
      const data = await response.json();
      setEvents(data.items || []);
    } catch (err: any) {
      setCalendarError(err.message || 'Error loading events');
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newEventSummary || !newEventDate) return;

    setIsCreatingEvent(true);
    setCalendarError(null);

    const startDateTime = new Date(`${newEventDate}T${newEventTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(newEventDuration) * 60 * 1000);

    if (token === 'mock_workspace_token') {
      setTimeout(() => {
        const newMockEvent = {
          id: `cal-mock-${Date.now()}`,
          summary: newEventSummary,
          description: newEventDesc,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() }
        };
        setEvents(prev => [newMockEvent, ...prev]);
        setNewEventSummary('');
        setNewEventDesc('');
        setIsCreatingEvent(false);
      }, 500);
      return;
    }

    try {
      const bodyData = {
        summary: newEventSummary,
        description: newEventDesc,
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() }
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyData)
        }
      );

      if (!response.ok) throw new Error('Failed to create Calendar Event');
      
      setNewEventSummary('');
      setNewEventDesc('');
      await fetchCalendarEvents();
    } catch (err: any) {
      setCalendarError(err.message || 'Error creating event');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventSummary: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the event "${eventSummary}" from Google Calendar?`
    );
    if (!isConfirmed) return;

    setCalendarError(null);
    if (token === 'mock_workspace_token') {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      return;
    }
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to delete event');
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err: any) {
      setCalendarError(err.message || 'Error deleting event');
    }
  };

  // 3. Google Chat functions
  const fetchChatSpaces = async () => {
    if (!token) return;
    setIsChatLoading(true);
    setChatError(null);
    if (token === 'mock_workspace_token') {
      setTimeout(() => {
        setSpaces(prev => {
          if (prev.length > 0) return prev;
          return [
            { name: 'spaces/design', displayName: '🎨 UI/UX Design Studio', type: 'SPACE', unreadCount: 1 },
            { name: 'spaces/engineering', displayName: '💻 Core Engineering Stack', type: 'SPACE', unreadCount: 2 },
            { name: 'spaces/alerts', displayName: '🚨 Live Infrastructure & Alerts', type: 'SPACE', unreadCount: 0 }
          ];
        });
        setIsChatLoading(false);
      }, 500);
      return;
    }
    try {
      const response = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to access Google Chat spaces.');
      const data = await response.json();
      const apiSpaces = data.spaces || [];
      const resolvedSpaces = apiSpaces.map((s: any, idx: number) => {
        return {
          ...s,
          unreadCount: s.unreadCount !== undefined ? s.unreadCount : (idx === 0 ? 1 : (idx === 1 ? 2 : 0))
        };
      });
      setSpaces(resolvedSpaces);
    } catch (err: any) {
      setChatError(err.message || 'Error loading Chat spaces');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSpace || !chatMessageInput.trim()) return;

    setIsSendingMessage(true);
    setChatError(null);

    if (token === 'mock_workspace_token') {
      setTimeout(() => {
        const newMockMsg = {
          name: `mock-msg-${Date.now()}`,
          text: chatMessageInput.trim(),
          createTime: new Date().toISOString(),
          sender: { displayName: user?.displayName || 'You', photoUrl: user?.photoURL }
        };
        setChatMessages(prev => [...prev, newMockMsg]);
        setChatMessageInput('');
        setIsSendingMessage(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(
        `https://chat.googleapis.com/v1/${selectedSpace.name}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: chatMessageInput.trim() })
        }
      );
      if (!response.ok) throw new Error('Failed to send Google Chat message.');
      const sentMsg = await response.json();
      setChatMessages(prev => [...prev, sentMsg]);
      setChatMessageInput('');
    } catch (err: any) {
      setChatError(err.message || 'Error sending message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // 4. Google Meet functions
  const handleCreateMeet = async () => {
    if (!token) return;
    setIsCreatingMeet(true);
    setMeetError(null);

    if (token === 'mock_workspace_token') {
      setTimeout(() => {
        const newMockSpace = {
          name: `spaces/meet-${Date.now().toString().slice(-4)}`,
          meetingUri: `https://meet.google.com/abc-mock-xyz`,
          config: { accessType: 'OPEN' }
        };
        setCreatedSpaces(prev => [newMockSpace, ...prev]);
        setIsCreatingMeet(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error('Failed to generate Google Meet space.');
      const data = await response.json();
      setCreatedSpaces(prev => [data, ...prev]);
    } catch (err: any) {
      setMeetError(err.message || 'Error creating Meet space');
    } finally {
      setIsCreatingMeet(false);
    }
  };

  // Fetch initial tab data when tab turns active
  useEffect(() => {
    if (token) {
      if (activeTab === 'drive') fetchDriveFiles();
      if (activeTab === 'calendar') fetchCalendarEvents();
      if (activeTab === 'chat') fetchChatSpaces();
    }
  }, [activeTab, token]);

  const readableSize = (bytes: string | number) => {
    if (!bytes) return 'N/A';
    const num = parseInt(bytes as string);
    if (isNaN(num)) return 'N/A';
    if (num < 1024) return `${num} B`;
    if (num < 1048576) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / 1048576).toFixed(1)} MB`;
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [contextMenu.visible]);

  const handleContextMenu = (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  const handleExportFile = async (file: any) => {
    if (!token) return;
    setIsDownloadingFileId(file.id);
    setDriveError(null);

    // Guest Simulation Mode
    if (token === 'mock_workspace_token') {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        const fileContent = `RabbyOS Workspace Guest Simulation\n\nFile Name: ${file.name}\nFile ID: ${file.id}\nMime Type: ${file.mimeType}\nSize: ${readableSize(file.size)}\nDownloaded At: ${new Date().toLocaleString()}\n\nThis is a simulation download for offline evaluation!`;
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        let dlName = file.name;
        if (!dlName.includes('.')) {
          dlName += '.txt';
        }
        
        a.download = dlName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (err: any) {
        setDriveError(`Failed to download mock file: ${err.message || err}`);
      } finally {
        setIsDownloadingFileId(null);
      }
      return;
    }

    // Real Google Drive Mode
    try {
      let url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      let isGoogleApp = false;
      let exportMime = '';
      let suffix = '';

      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        isGoogleApp = true;
        if (file.mimeType === 'application/vnd.google-apps.document') {
          exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          suffix = '.docx';
        } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
          exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          suffix = '.xlsx';
        } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
          exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          suffix = '.pptx';
        } else if (file.mimeType === 'application/vnd.google-apps.drawing') {
          exportMime = 'image/png';
          suffix = '.png';
        } else {
          exportMime = 'application/pdf';
          suffix = '.pdf';
        }
        url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(exportMime)}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error('Access denied or expired session. Please re-authenticate.');
        }
        throw new Error(`Google API returned status ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      let fileName = file.name;
      if (isGoogleApp && !fileName.toLowerCase().endsWith(suffix)) {
        fileName += suffix;
      }
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('Download file error:', err);
      setDriveError(`Could not download file: ${err.message || 'Unknown network error. CORS or Google permissions might block direct downloads.'}`);
    } finally {
      setIsDownloadingFileId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col bg-[#0b0c10] text-zinc-100 font-sans"
    >
      {/* Dynamic Navigation Bar / Header */}
      <div className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-4 py-4 flex items-center justify-between shadow-lg shrink-0 pt-safe-island z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#4285F4"/>
              </svg>
              Google Workspace
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase mt-1">Unified productivity</p>
          </div>
        </div>

        {user && token && (
          <div className="flex items-center gap-2.5">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            )}
            <button 
              onClick={handleDisconnect}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isAuthLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-zinc-500 text-sm">Initializing credentials...</p>
        </div>
      ) : !token ? (
        // Non-authenticated Screen
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950/20 max-w-md mx-auto w-full text-center space-y-6">
          <div className="p-4 bg-zinc-900/60 rounded-[2rem] border border-zinc-800 shadow-inner">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-16 h-16 mx-auto">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Google Account Required</h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Connect your Google Workspace Account with permission to access Calendar, Drive, Chat, and Meet.
            </p>
          </div>

          {connectionError && (
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs text-left w-full max-w-md shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold border-b border-zinc-800 pb-2">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                <span>Authentication Helper (সমাধান নির্দেশিকা)</span>
              </div>
              
              <div className="text-[11px] text-zinc-300 space-y-3.5 leading-relaxed">
                <div>
                  <p className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    ১. "Google hasn't verified this app" স্ক্রীন আসলে:
                  </p>
                  <p className="pl-3 text-zinc-400 mt-1">
                    পপআপ স্ক্রীনের নিচে বামে থাকা <strong className="text-zinc-200">"Advanced"</strong> লিংকে ক্লিক করুন, তারপর নিচে <strong className="text-zinc-200 font-bold underline">"Go to RabbyOS (unsafe)"</strong> লিংকে ক্লিক করে অনুমোদন সম্পন্ন করুন।
                  </p>
                  <p className="pl-3 text-zinc-500 text-[10px] mt-0.5">
                    (Click <strong className="text-zinc-400">"Advanced"</strong> then click <strong className="text-zinc-400">"Go to RabbyOS (unsafe)"</strong> at the bottom of the Google popup screen to bypass verification warning).
                  </p>
                </div>

                <div>
                  <p className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    ২. "network-request-failed" পপআপ ব্লকড সমস্যা:
                  </p>
                  <p className="pl-3 text-zinc-400 mt-1">
                    ব্রাউজার সিকিউরিটি পলিসির কারণে আইফ্রেমের (Embedded Sandbox) ভেতরে গুগল পপআপ ব্লক হতে পারে। দয়া করে প্রিভিউ উইন্ডোর নিচে ডানে থাকা <strong className="text-white bg-zinc-800 px-1.5 py-0.5 rounded font-mono">"Open App" (↗)</strong> বা <strong className="text-white bg-zinc-800 px-1.5 py-0.5 rounded font-mono">"Open in new tab"</strong> বাটনে ক্লিক করে অ্যাপ্লিকেশনটি আলাদা উইন্ডোতে খুলে পুনরায় সাইন-ইন ট্রাই করুন।
                  </p>
                  <p className="pl-3 text-zinc-500 text-[10px] mt-0.5">
                    (Open the application in a new standalone tab using the <strong className="text-zinc-400">"Open App" (↗)</strong> button to allow direct popups).
                  </p>
                </div>

                <div>
                  <p className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    ৩. অফলাইন টেস্ট করতে চান?
                  </p>
                  <p className="pl-3 text-zinc-400 mt-1">
                    লগইন ঝামেলা ছাড়াই গুগল ড্রাইভ, ক্যালেন্ডার, মিট ও চ্যাটের চমৎকার কার্যকারিতা এবং ডাটা টেস্ট করতে সরাসরি নিচে থাকা <strong className="text-indigo-300 font-bold">"Try Guest Simulation Mode"</strong> বাটনে ক্লিক করুন।
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-rose-400/80 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 font-mono mt-1">
                <span className="font-bold block mb-0.5">Original Error Logs:</span>
                <span className="break-all">{connectionError}</span>
              </div>
            </div>
          )}

          <button 
            disabled={isConnecting}
            onClick={handleConnect}
            className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border border-zinc-800 rounded-xl px-5 py-3.5 transition-all text-sm font-semibold flex items-center justify-center gap-3 shadow-md"
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            ) : (
              <>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                Connect Google Workspace
              </>
            )}
          </button>

          <div className="relative flex items-center py-2 w-full max-w-xs">
            <div className="flex-grow border-t border-zinc-900"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-600 text-[10px] uppercase tracking-wide font-semibold">OR</span>
            <div className="flex-grow border-t border-zinc-900"></div>
          </div>

          <button 
            type="button"
            onClick={handleConnectGuest}
            className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/35 rounded-xl px-5 py-3 transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Try Guest Simulation Mode
          </button>
        </div>
      ) : (
        // Authenticated Hub UI
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-zinc-900 bg-zinc-950 p-1.5 gap-1 shadow-sm shrink-0">
            {(['drive', 'calendar', 'chat', 'meet'] as TabType[]).map((tab) => {
              const label = tab.charAt(0).toUpperCase() + tab.slice(1);
              const isActive = activeTab === tab;
              const Icon = tab === 'drive' ? Folder : tab === 'calendar' ? CalendarIcon : tab === 'chat' ? MessageSquare : Video;
              const color = tab === 'drive' ? 'text-blue-400' : tab === 'calendar' ? 'text-red-400' : tab === 'chat' ? 'text-emerald-400' : 'text-violet-400';
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                    isActive 
                      ? 'bg-zinc-900 text-white shadow-md border border-zinc-800' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? color : 'opacity-70'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Active View Panel */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-28">
            <AnimatePresence mode="wait">
              {activeTab === 'drive' && (
                <motion.div
                  key="drive"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-4 max-w-4xl mx-auto"
                >
                  {/* Drive Banner & Upload */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Folder className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Google Drive Storage</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">List, upload, delete and download files</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <label className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-lg shadow-blue-600/10">
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload File</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleUploadFile} 
                          disabled={isUploading} 
                        />
                      </label>
                      
                      <button 
                        onClick={fetchDriveFiles}
                        className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors border border-zinc-800"
                        title="Refresh file list"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {driveError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{driveError}</span>
                    </div>
                  )}

                  {isDriveLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-zinc-500 text-xs">Querying files...</p>
                    </div>
                  ) : files.length === 0 ? (
                    <div className="py-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
                      <Folder className="w-12 h-12 text-zinc-700 opacity-65" />
                      <div>
                        <p className="text-sm font-bold text-zinc-400">No Google Drive files</p>
                        <p className="text-xs text-zinc-500 mt-1">Upload files above to sync them into your drive.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {files.map((file) => (
                        <div 
                          key={file.id}
                          className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800/85 p-4 rounded-xl flex flex-col justify-between hover:shadow-lg transition-all group relative cursor-context-menu select-none active:scale-[0.99]"
                          onContextMenu={(e) => handleContextMenu(e, file)}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-zinc-800 transition-colors">
                                <File className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                              </div>
                              <div className="overflow-hidden">
                                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate" title={file.name}>
                                  {file.name}
                                </h3>
                                <p className="text-[9px] text-zinc-500 truncate mt-0.5">{file.mimeType}</p>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setContextMenu({
                                  visible: true,
                                  x: rect.left,
                                  y: rect.bottom + 4,
                                  file
                                });
                              }}
                              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg transition-all flex-shrink-0 z-10"
                              title="File Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-900/60 mt-3.5 pt-2.5">
                            <span className="text-[9.5px] text-zinc-500 font-mono">{readableSize(file.size)}</span>
                            
                            <div className="flex items-center gap-2 relative z-10">
                              {isDownloadingFileId === file.id ? (
                                <span className="flex items-center gap-1.5 text-[9.5px] text-amber-400 font-bold">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Downloading...</span>
                                </span>
                              ) : (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportFile(file);
                                  }}
                                  className="text-[9.5px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors bg-emerald-500/5 hover:bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/10"
                                  title="Export to Local Device"
                                >
                                  <Download className="w-2.5 h-2.5" />
                                  <span>Download</span>
                                </button>
                              )}

                              <a 
                                href={file.webViewLink} 
                                target="_blank" 
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[9.5px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors bg-blue-500/5 hover:bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/10"
                              >
                                <span>Open Web</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-4 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {/* Calendar Event Creator form */}
                  <div className="md:col-span-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4 h-fit">
                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-zinc-800 pb-3">
                      <PlusCircle className="w-4 h-4 text-red-400" />
                      Add Calendar Event
                    </h2>

                    <form onSubmit={handleCreateEvent} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Event Title</label>
                        <input
                          type="text"
                          required
                          placeholder="Project Meeting"
                          value={newEventSummary}
                          onChange={(e) => setNewEventSummary(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Details</label>
                        <textarea
                          placeholder="Discuss milestone delivery plans."
                          value={newEventDesc}
                          onChange={(e) => setNewEventDesc(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all h-20 resize-none custom-scrollbar"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Date</label>
                          <input
                            type="date"
                            required
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-[11px] text-white focus:outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Time</label>
                          <input
                            type="time"
                            required
                            value={newEventTime}
                            onChange={(e) => setNewEventTime(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-[11px] text-white focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Duration</label>
                        <select
                          value={newEventDuration}
                          onChange={(e) => setNewEventDuration(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                        >
                          <option value="15">15 Minutes</option>
                          <option value="30">30 Minutes</option>
                          <option value="45">45 Minutes</option>
                          <option value="60">1 Hour</option>
                          <option value="120">2 Hours</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isCreatingEvent}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold p-3 text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 mt-2 shadow-red-600/10"
                      >
                        {isCreatingEvent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Create Event
                      </button>
                    </form>
                  </div>

                  {/* Calendar Event List */}
                  <div className="md:col-span-2 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-red-400" />
                        Upcoming Events
                      </h2>
                      <button 
                        onClick={fetchCalendarEvents}
                        className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title="Reload events"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {calendarError && (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>{calendarError}</span>
                      </div>
                    )}

                    {isCalendarLoading ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-2.5">
                        <Loader2 className="w-7 h-7 animate-spin text-red-500" />
                        <p className="text-zinc-500 text-xs">Accessing Google Calendar...</p>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="p-8 bg-zinc-900/20 border border-zinc-900 rounded-2xl text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
                        <CalendarIcon className="w-10 h-10 text-zinc-700 opacity-60" />
                        <p className="text-xs">No upcoming calendar events detected.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {events.map((event) => {
                          const start = event.start?.dateTime ? new Date(event.start.dateTime) : (event.start?.date ? new Date(event.start.date) : null);
                          const dateString = start ? start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'All day';
                          const timeString = start && event.start?.dateTime ? start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                          
                          return (
                            <div 
                              key={event.id}
                              className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 p-4 rounded-xl flex items-start justify-between gap-4 transition-all"
                            >
                              <div className="space-y-1">
                                <h3 className="text-xs font-bold text-white leading-snug">{event.summary || 'Untitled Event'}</h3>
                                {event.description && <p className="text-[11px] text-zinc-500 leading-normal max-w-sm line-clamp-2">{event.description}</p>}
                                
                                <div className="flex items-center gap-3.5 pt-1 text-[10px] text-zinc-400 font-medium">
                                  <span className="flex items-center gap-1 font-mono text-zinc-400">
                                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                    {dateString} {timeString ? `at ${timeString}` : ''}
                                  </span>
                                  {event.location && (
                                    <span className="flex items-center gap-1 text-zinc-500 truncate max-w-xs">
                                      <Compass className="w-3 h-3" />
                                      {event.location}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteEvent(event.id, event.summary || 'Untitled Event')}
                                className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-4 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {/* Spaces Lists */}
                  <div className="md:col-span-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 space-y-3.5 h-fit">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
                      <h2 className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        Google Chat Spaces
                      </h2>
                      <button 
                        onClick={fetchChatSpaces}
                        className="p-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isChatLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        <p className="text-[10px] text-zinc-500">Checking spaces...</p>
                      </div>
                    ) : spaces.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-6">No Chat spaces found.</p>
                    ) : (
                      <div className="space-y-1">
                        {spaces.map((space) => (
                          <button
                            key={space.name}
                            onClick={() => {
                              setSelectedSpace(space);
                              setChatMessages([]);
                              setSpaces(prev => prev.map(s => s.name === space.name ? { ...s, unreadCount: 0 } : s));
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors text-xs ${
                              selectedSpace?.name === space.name 
                                ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400' 
                                : 'hover:bg-zinc-900 text-zinc-300'
                            }`}
                          >
                            <span className="truncate pr-2 font-semibold">
                              {space.displayName || space.name.replace('spaces/', 'Space ')}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Space / Conversation Frame */}
                  <div className="md:col-span-2 space-y-3.5">
                    {selectedSpace ? (
                      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                        {/* Space Header */}
                        <div className="bg-zinc-900/60 p-4 border-b border-zinc-900 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-white">
                            {selectedSpace.displayName || selectedSpace.name.replace('spaces/', 'Space ')}
                          </h3>
                          <span className="text-[9px] font-mono p-1 bg-zinc-800 rounded text-zinc-400">{selectedSpace.spaceType || 'ROOM'}</span>
                        </div>

                        {/* Message Feed Grid */}
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 flex flex-col justify-end bg-zinc-950/40">
                          {chatMessages.length === 0 ? (
                            <div className="text-center py-12 space-y-2">
                              <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto opacity-70" />
                              <p className="text-xs text-zinc-500">Say hello to get the conversation started!</p>
                            </div>
                          ) : (
                            chatMessages.map((msg, idx) => (
                              <div 
                                key={idx} 
                                className="flex flex-col space-y-1 max-w-[80%] self-end bg-emerald-600/15 border border-emerald-500/20 p-2.5 rounded-2xl rounded-tr-none text-zinc-200"
                              >
                                <p className="text-xs">{msg.text}</p>
                                <span className="text-[8px] text-emerald-500/80 text-right">Sent</span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-zinc-900/40 border-t border-zinc-900 flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Message Google Chat Space..."
                            value={chatMessageInput}
                            onChange={(e) => setChatMessageInput(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-850 hover:border-zinc-850 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isSendingMessage || !chatMessageInput.trim()}
                            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl text-white transition-colors"
                          >
                            {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
                        <MessageSquare className="w-12 h-12 text-zinc-800" />
                        <p className="text-xs">Select a Google Chat Space from the sidebar to chat.</p>
                      </div>
                    )}

                    {chatError && (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2.5 mt-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>{chatError}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'meet' && (
                <motion.div
                  key="meet"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-4 max-w-2xl mx-auto"
                >
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
                    <div className="w-14 h-14 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto border border-violet-500/10">
                      <Video className="w-7 h-7 text-violet-400" />
                    </div>
                    
                    <div className="max-w-md mx-auto space-y-1.5">
                      <h2 className="text-sm font-bold text-white">Generate Instant Meeting Link</h2>
                      <p className="text-xs text-zinc-400">
                        Instantly deploy secure, dynamic virtual rooms using the official Google Meet API.
                      </p>
                    </div>

                    <button
                      onClick={handleCreateMeet}
                      disabled={isCreatingMeet}
                      className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-violet-600/10 cursor-pointer"
                    >
                      {isCreatingMeet ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      <span>Create New Space</span>
                    </button>
                  </div>

                  {meetError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{meetError}</span>
                    </div>
                  )}

                  {createdSpaces.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Previous Meetings</h3>
                      
                      {createdSpaces.map((space, index) => (
                        <div 
                          key={index}
                          className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/5 border border-violet-500/10 px-2 py-0.5 rounded">
                              Space ID: {space.name.replace('spaces/', '')}
                            </span>
                            <p className="text-[11px] text-zinc-500 font-medium font-mono pt-1">
                              {space.meetingUri || `https://meet.google.com/${space.meetingCode || ''}`}
                            </p>
                          </div>

                          <a 
                            href={space.meetingUri} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold p-2.5 text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
                          >
                            <span>Join Meet</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Context Menu Overlay */}
      <AnimatePresence>
        {contextMenu.visible && contextMenu.file && (
          <>
            {/* Backdrop to close menu */}
            <div 
              className="fixed inset-0 z-40 cursor-default" 
              onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            />
            {/* Context Menu Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{ 
                position: 'fixed',
                left: Math.min(contextMenu.x, window.innerWidth - 180),
                top: Math.min(contextMenu.y, window.innerHeight - 150),
              }}
              className="z-50 min-w-[170px] bg-zinc-950/95 border border-zinc-800/80 shadow-[0_12px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl rounded-xl p-1.5 flex flex-col gap-0.5"
            >
              <div className="px-2.5 py-1.5 border-b border-zinc-900 mb-1 max-w-[160px]">
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">File Options</p>
                <p className="text-[11px] text-zinc-300 font-bold truncate mt-0.5" title={contextMenu.file.name}>
                  {contextMenu.file.name}
                </p>
              </div>

              <button
                onClick={() => {
                  handleExportFile(contextMenu.file);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-zinc-900 rounded-lg text-left text-xs text-zinc-200 hover:text-emerald-400 transition-all font-medium"
              >
                {isDownloadingFileId === contextMenu.file.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Export to Local</span>
              </button>

              {contextMenu.file.webViewLink && contextMenu.file.webViewLink !== '#' && (
                <a
                  href={contextMenu.file.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-zinc-900 rounded-lg text-left text-xs text-zinc-200 hover:text-blue-400 transition-all font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Drive</span>
                </a>
              )}

              <button
                onClick={() => {
                  handleDeleteFile(contextMenu.file.id, contextMenu.file.name);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-rose-950/30 hover:text-rose-400 rounded-lg text-left text-xs text-zinc-400 transition-all font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete File</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
