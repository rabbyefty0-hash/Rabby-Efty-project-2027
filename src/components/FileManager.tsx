import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, File as FileIcon, Image as ImageIcon, Music, Video, 
  MoreHorizontal, Plus, Search, ChevronLeft, Trash2, Edit2, X, Download, Play, Pause,
  LayoutGrid, List, HardDrive, Share, Upload,
  Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle, Settings2, Activity, LogOut, History
} from 'lucide-react';
import { VFSNode, getNodesByParent, addNode, deleteNode, renameNode, generateId, getNode, getAllFiles, verifyPermission } from '../lib/vfs';
import { getMimeType } from '../lib/mime';
import { VideoPlayer } from './VideoPlayer';
import { CloudSyncDashboard } from './CloudSyncDashboard';
import { 
  getSyncStatus, subscribeToSync, performSimulatedSync, performGoogleDriveSync, 
  resolveConflict, clearSyncHistory, getActiveConflicts, SyncStatus, SyncConflict 
} from '../lib/vfsSync';
import { getAccessToken, signInWithGoogle, logout, auth } from '../firebase';

interface FileManagerProps {
  onBack?: () => void;
}

export function FileManager({ onBack }: FileManagerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<{id: string | null, name: string}[]>([{id: null, name: 'On My Device'}]);
  const [nodes, setNodes] = useState<VFSNode[]>([]);
  const [isConnectingDevice, setIsConnectingDevice] = useState(false);
  const [selectedNode, setSelectedNode] = useState<VFSNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: VFSNode } | null>(null);
  const [renamingNode, setRenamingNode] = useState<VFSNode | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [previewNode, setPreviewNode] = useState<VFSNode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('fileManager_viewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'list';
  });
  const [activeTab, setActiveTab] = useState<'browse' | 'recents' | 'sync'>('browse');
  const [uploadingFiles, setUploadingFiles] = useState<{id: string, name: string, progress: number, mimeType: string}[]>([]);
  const [needsPermission, setNeedsPermission] = useState(false);
  
  // Cloud sync states
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [conflicts, setConflicts] = useState<SyncConflict[]>(getActiveConflicts());
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem('fileManager_autoSync') === 'true');
  const [forceTriggerKey, setForceTriggerKey] = useState(0); // triggers connection state reload

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    localStorage.setItem('fileManager_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('fileManager_autoSync', String(autoSync));
  }, [autoSync]);

  // Subscribe to sync state updates
  useEffect(() => {
    const unsubscribe = subscribeToSync((status, activeConflicts) => {
      setSyncStatus(status);
      setConflicts(activeConflicts);
    });
    return unsubscribe;
  }, []);

  // Listen to local node modifications and trigger auto-sync if enabled
  useEffect(() => {
    if (!autoSync || syncStatus.isSyncing) return;

    const handleVfsUpdateForSync = () => {
      const dbgToken = getAccessToken();
      const delayTimer = setTimeout(() => {
        if (dbgToken) {
          performGoogleDriveSync(dbgToken);
        } else {
          performSimulatedSync();
        }
      }, 3000); // 3-second debounce to batch files
      return () => clearTimeout(delayTimer);
    };

    window.addEventListener('vfs-updated', handleVfsUpdateForSync);
    return () => window.removeEventListener('vfs-updated', handleVfsUpdateForSync);
  }, [autoSync, syncStatus.isSyncing]);

  useEffect(() => {
    if (activeTab === 'sync') return; // Don't run node load if sync tab is active
    loadNodes();
    
    const handleVfsUpdate = () => loadNodes();
    window.addEventListener('vfs-updated', handleVfsUpdate);
    return () => window.removeEventListener('vfs-updated', handleVfsUpdate);
  }, [currentFolderId, activeTab]);

  useEffect(() => {
    setSelectedNodeIds([]);
  }, [currentFolderId, activeTab]);

  const loadNodes = async () => {
    if (activeTab === 'recents') {
      const allFiles = await getAllFiles();
      allFiles.sort((a, b) => b.createdAt - a.createdAt);
      setNodes(allFiles);
    } else {
      let fetchedNodes = await getNodesByParent(currentFolderId);
      setNeedsPermission(false);

      if (currentFolderId) {
        const currentNode = await getNode(currentFolderId);
        if (currentNode?.handle && currentNode.handle.kind === 'directory') {
          let hasPermission = false;
          try {
            hasPermission = (await currentNode.handle.queryPermission({ mode: 'readwrite' })) === 'granted';
          } catch (e) {}
          
          if (hasPermission) {
            try {
              const currentEntries = new Map();
              // @ts-ignore
              for await (const entry of currentNode.handle.values()) {
                currentEntries.set(entry.name, entry);
              }
              
              let changed = false;
              // Remove deleted
              for (const node of fetchedNodes) {
                if (!currentEntries.has(node.name)) {
                  await deleteNode(node.id);
                  changed = true;
                }
              }
              
              // Add new
              const existingNames = new Set(fetchedNodes.map(n => n.name));
              for (const [name, entry] of currentEntries.entries()) {
                if (!existingNames.has(name)) {
                  let size = 0;
                  let mimeType = 'application/octet-stream';
                  let lastModified = Date.now();
                  
                  if (entry.kind === 'file') {
                    try {
                      const file = await entry.getFile();
                      size = file.size;
                      mimeType = getMimeType(entry.name, file.type);
                      lastModified = file.lastModified || lastModified;
                    } catch (e) {}
                  } else {
                    mimeType = 'folder';
                  }
                  
                  await addNode({
                    id: generateId(),
                    name: entry.name,
                    type: entry.kind === 'directory' ? 'folder' : 'file',
                    parentId: currentFolderId,
                    handle: entry,
                    size,
                    mimeType,
                    createdAt: lastModified,
                    modifiedAt: lastModified
                  });
                  changed = true;
                }
              }
              
              if (changed) {
                fetchedNodes = await getNodesByParent(currentFolderId);
              }
            } catch (e) {
              console.error("Error reading directory:", e);
            }
          } else {
            setNeedsPermission(true);
          }
        }
      }

      // Sort: Folders first, then alphabetically
      fetchedNodes.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });
      setNodes(fetchedNodes);
    }
  };

  const handleCreateFolderPrompt = async () => {
    const folderName = window.prompt("Enter folder name:");
    if (!folderName || !folderName.trim()) return;
    
    let parentHandle = null;
    if (currentFolderId) {
      const currentNode = await getNode(currentFolderId);
      if (currentNode?.handle && currentNode.handle.kind === 'directory') {
        parentHandle = currentNode.handle;
      }
    }
    
    let newHandle = null;
    if (parentHandle) {
      try {
        newHandle = await parentHandle.getDirectoryHandle(folderName.trim(), { create: true });
      } catch (e) {
        console.error("Failed to create directory on device", e);
        alert("Failed to create folder on device.");
        return;
      }
    }

    const newNode: VFSNode = {
      id: generateId(),
      name: folderName.trim(),
      type: 'folder',
      parentId: currentFolderId,
      handle: newHandle,
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };
    await addNode(newNode);
    loadNodes();
  };

  const handleConnectDeviceFolder = async () => {
    try {
      setIsConnectingDevice(true);
      // @ts-ignore
      if (!window.showDirectoryPicker) {
        alert("Your browser doesn't support direct folder access. Please use Chrome or Edge.");
        return;
      }
      
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      
      const existingNodes = await getNodesByParent(currentFolderId);
      const existing = existingNodes.find(n => n.name === dirHandle.name && n.handle);
      
      if (!existing) {
        const deviceFolderId = generateId();
        await addNode({
          id: deviceFolderId,
          name: dirHandle.name,
          type: 'folder',
          parentId: currentFolderId,
          handle: dirHandle,
          isDeviceRoot: true,
          createdAt: Date.now(),
          modifiedAt: Date.now()
        });
      }

      await loadNodes();
      window.dispatchEvent(new Event('vfs-updated'));
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error connecting device folder:", error);
        alert("Could not access the folder. Permission might have been denied.");
      }
    } finally {
      setIsConnectingDevice(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    let parentHandle = null;
    if (currentFolderId) {
      const currentNode = await getNode(currentFolderId);
      if (currentNode?.handle && currentNode.handle.kind === 'directory') {
        parentHandle = currentNode.handle;
      }
    }
    
    const newUploads = Array.from(files).map(file => ({
      id: generateId(),
      file,
      name: file.name,
      progress: 0,
      mimeType: getMimeType(file.name, file.type)
    }));

    setUploadingFiles(prev => [...prev, ...newUploads.map(u => ({ id: u.id, name: u.name, progress: 0, mimeType: u.mimeType }))]);

    await Promise.all(newUploads.map(async (upload) => {
      return new Promise<void>(resolve => {
        let progress = 0;
        const interval = setInterval(async () => {
          progress += Math.random() * 20 + 10; // 10-30% per tick
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            let newHandle = null;
            if (parentHandle) {
              try {
                newHandle = await parentHandle.getFileHandle(upload.file.name, { create: true });
                const writable = await newHandle.createWritable();
                await writable.write(upload.file);
                await writable.close();
              } catch (e) {
                console.error("Failed to write to device", e);
              }
            }
            
            const newNode: VFSNode = {
              id: upload.id,
              name: upload.file.name,
              type: 'file',
              parentId: currentFolderId,
              data: parentHandle ? undefined : upload.file,
              handle: newHandle,
              mimeType: getMimeType(upload.file.name, upload.file.type),
              size: upload.file.size,
              createdAt: Date.now(),
              modifiedAt: Date.now()
            };
            await addNode(newNode);
            
            setUploadingFiles(prev => prev.filter(f => f.id !== upload.id));
            loadNodes();
            resolve();
          } else {
            setUploadingFiles(prev => prev.map(f => f.id === upload.id ? { ...f, progress } : f));
          }
        }, 200);
      });
    }));
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const navigateToFolder = (folder: VFSNode) => {
    setCurrentFolderId(folder.id);
    setFolderHistory([...folderHistory, { id: folder.id, name: folder.name }]);
  };

  const navigateBack = () => {
    if (folderHistory.length <= 1) return;
    const newHistory = [...folderHistory];
    newHistory.pop();
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
  };

  const handleDelete = async (id: string) => {
    const node = await getNode(id);
    if (node?.handle) {
      try {
        const parentNode = node.parentId ? await getNode(node.parentId) : null;
        if (parentNode?.handle) {
          await parentNode.handle.removeEntry(node.name, { recursive: true });
        }
      } catch (e) {
        console.error("Failed to delete from device", e);
        alert("Failed to delete from device.");
        return;
      }
    }
    await deleteNode(id);
    setSelectedNode(null);
    loadNodes();
  };

  const handleRename = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed) {
      const node = await getNode(id);
      if (node?.handle) {
        alert("Renaming device files is not supported yet.");
        return;
      }
      await renameNode(id, trimmed);
      setSelectedNode(null);
      loadNodes();
    }
  };

  const handleShare = async (node: VFSNode) => {
    try {
      let file: File | undefined;
      
      if (node.data instanceof File) {
        file = node.data;
      } else if (node.data instanceof Blob) {
        file = new File([node.data], node.name, { type: node.mimeType || 'application/octet-stream' });
      }
      
      if (!file && node.handle && node.handle.kind === 'file') {
        const hasPermission = await verifyPermission(node.handle, false);
        if (!hasPermission) {
          alert("Permission to access this file is required.");
          return;
        }
        file = await node.handle.getFile();
      }

      if (!file) {
        const fullNode = await getNode(node.id);
        if (fullNode?.data instanceof File) {
          file = fullNode.data;
        } else if (fullNode?.data instanceof Blob) {
          file = new File([fullNode.data], fullNode.name, { type: fullNode.mimeType || 'application/octet-stream' });
        }
      }

      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: file.name,
          text: `Sharing ${file.name}`
        });
      } else {
        alert("Sharing files is not supported on this browser or device.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error sharing file:", error);
        alert("Could not share the file.");
      }
    }
  };

  const handleBulkDelete = async (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete ${nodeIds.length} selected items locally?`);
    if (!confirmDelete) return;

    for (const id of nodeIds) {
      const node = nodes.find(n => n.id === id);
      if (!node) continue;
      if (node.handle) {
        try {
          const parentNode = node.parentId ? await getNode(node.parentId) : null;
          if (parentNode?.handle) {
            await parentNode.handle.removeEntry(node.name, { recursive: true });
          }
        } catch (e) {
          console.error(`Failed to delete "${node.name}" from device`, e);
        }
      }
      await deleteNode(id);
    }
    
    setSelectedNodeIds([]);
    loadNodes();
  };

  const handleBulkShare = async (nodeIds: string[]) => {
    try {
      const filesToShare: File[] = [];
      for (const id of nodeIds) {
        const node = nodes.find(n => n.id === id);
        if (!node || node.type !== 'file') continue;
        
        let file: File | undefined;
        if (node.data instanceof File) {
          file = node.data;
        } else if (node.data instanceof Blob) {
          file = new File([node.data], node.name, { type: node.mimeType || 'application/octet-stream' });
        }
        
        if (!file && node.handle && node.handle.kind === 'file') {
          const hasPermission = await verifyPermission(node.handle, false);
          if (hasPermission) {
            file = await node.handle.getFile();
          }
        }

        if (!file) {
          const fullNode = await getNode(node.id);
          if (fullNode?.data instanceof File) {
            file = fullNode.data;
          } else if (fullNode?.data instanceof Blob) {
            file = new File([fullNode.data], fullNode.name, { type: fullNode.mimeType || 'application/octet-stream' });
          }
        }
        
        if (file) {
          filesToShare.push(file);
        }
      }

      if (filesToShare.length === 0) {
        alert("No shareable files were selected.");
        return;
      }

      if (navigator.share && navigator.canShare && navigator.canShare({ files: filesToShare })) {
        await navigator.share({
          files: filesToShare,
          title: "Shared Workspace Files",
          text: `Sharing ${filesToShare.length} files`
        });
      } else {
        alert("Sharing multiple files is not supported on this browser context. You can share nodes individually.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error bulk sharing files:", error);
        alert("Failed to share files.");
      }
    }
  };

  const openPreview = async (node: VFSNode) => {
    if (node.type === 'folder') {
      if (node.handle) {
        const hasPermission = await verifyPermission(node.handle, true);
        if (!hasPermission) {
          alert("Permission to access this folder is required.");
          return;
        }
      }
      navigateToFolder(node);
      return;
    }
    
    if (node.handle) {
       const hasPermission = await verifyPermission(node.handle, true);
       if (!hasPermission) {
          alert("Permission to access this file is required.");
          return;
       }
       try {
         const file = await node.handle.getFile();
         const url = URL.createObjectURL(file);
         setPreviewUrl(url);
         setPreviewNode({...node, data: file, mimeType: getMimeType(node.name, file.type)});
         setIsPlaying(false);
       } catch (e) {
         console.error("Error reading file", e);
         alert("Could not read the file from the device.");
       }
       return;
    }
    
    // Fetch full node to get data blob if not loaded
    const fullNode = await getNode(node.id);
    if (fullNode?.data) {
      const url = URL.createObjectURL(fullNode.data);
      setPreviewUrl(url);
      setPreviewNode({...fullNode, mimeType: getMimeType(fullNode.name, fullNode.mimeType)});
      setIsPlaying(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewNode(null);
    setIsPlaying(false);
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getIcon = (node: VFSNode) => {
    if (node.type === 'folder') return <Folder className="w-12 h-12 text-blue-400 fill-blue-400/20" />;
    const mime = getMimeType(node.name, node.mimeType);
    if (mime.startsWith('image/')) return <ImageIcon className="w-12 h-12 text-purple-400" />;
    if (mime.startsWith('audio/')) return <Music className="w-12 h-12 text-pink-400" />;
    if (mime.startsWith('video/')) return <Video className="w-12 h-12 text-indigo-400" />;
    return <FileIcon className="w-12 h-12 text-gray-400" />;
  };

  const currentFolderName = folderHistory[folderHistory.length - 1].name;

  return (
    <div 
      className="h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white flex flex-col relative overflow-hidden font-sans"
      style={{ touchAction: 'pan-y' }}
    >
      <div 
        className="absolute inset-y-0 left-0 w-4 z-50"
        onPointerDown={(e) => {
          const startX = e.clientX;
          const handlePointerUp = (upEvent: PointerEvent) => {
            if (upEvent.clientX - startX > 50) {
              if (onBack) onBack();
            }
            window.removeEventListener('pointerup', handlePointerUp);
          };
          window.addEventListener('pointerup', handlePointerUp);
        }}
      />
      {/* Header */}
      <div key={`header-${forceTriggerKey}`} className="pt-12 pb-4 px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 z-10 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          {activeTab === 'browse' && folderHistory.length > 1 ? (
            <button onClick={navigateBack} className="flex items-center text-blue-500 font-medium">
              <ChevronLeft className="w-6 h-6 -ml-2" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-16" /> // Spacer
          )}
          <div className="flex gap-3 items-center">
            {activeTab !== 'sync' && (
              <button 
                onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} 
                className="p-2 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-full transition-colors active:scale-95"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
              </button>
            )}
            {activeTab === 'browse' && (
              <>
                <button 
                  onClick={handleConnectDeviceFolder}
                  disabled={isConnectingDevice}
                  className="flex items-center gap-1.5 bg-zinc-800 text-white px-3 py-2 rounded-full font-medium shadow-sm hover:bg-zinc-700 transition-colors active:scale-95 disabled:opacity-50"
                  title="Connect Device Folder"
                >
                  <HardDrive className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">{isConnectingDevice ? 'Syncing...' : 'Sync Device'}</span>
                </button>
                <button 
                  onClick={handleCreateFolderPrompt} 
                  className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-full font-medium shadow-sm hover:bg-blue-600 transition-colors active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm">New Folder</span>
                </button>
              </>
            )}
            {activeTab !== 'sync' && (
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-full transition-colors active:scale-95" title="Upload File">
                <Upload className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {activeTab === 'recents' ? 'Recents' : activeTab === 'sync' ? 'Cloud Sync' : currentFolderName}
        </h1>
        
        {/* Search Bar */}
        {activeTab !== 'sync' && (
          <div className="mt-4 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-black/5 dark:bg-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        multiple 
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'sync' ? (
          <CloudSyncDashboard 
            syncStatus={syncStatus}
            conflicts={conflicts}
            autoSync={autoSync}
            setAutoSync={setAutoSync}
            onTriggerSync={async () => {
              const driveToken = getAccessToken();
              if (driveToken && driveToken !== 'mock_workspace_token') {
                await performGoogleDriveSync(driveToken);
              } else {
                await performSimulatedSync();
              }
            }}
            onClearHistory={clearSyncHistory}
            onResolveConflict={async (conflict, decision) => {
              const driveToken = getAccessToken();
              await resolveConflict(conflict, decision, (driveToken && driveToken !== 'mock_workspace_token') ? driveToken : undefined);
            }}
            forceTriggerKey={forceTriggerKey}
            setForceTriggerKey={setForceTriggerKey}
          />
        ) : needsPermission ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 h-full">
            <HardDrive className="w-16 h-16 mb-4 opacity-20" />
            <p className="mb-6">Permission required to access this folder</p>
            <button 
              onClick={async () => {
                const currentNode = await getNode(currentFolderId!);
                if (currentNode?.handle) {
                  const granted = await verifyPermission(currentNode.handle, true);
                  if (granted) {
                    loadNodes();
                  }
                }
              }}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-blue-600 transition-colors active:scale-95"
            >
              Grant Permission
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {uploadingFiles.map(file => (
              <div key={file.id} className="flex flex-col items-center gap-2 relative group opacity-60">
                <div className="w-full aspect-square bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden">
                  {getIcon({ type: 'file', mimeType: file.mimeType } as VFSNode)}
                  <div className="absolute inset-0 bg-black/5 dark:bg-black/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-black/10 dark:border-white/10 border-t-blue-500 animate-spin" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-zinc-800">
                    <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${file.progress}%` }} />
                  </div>
                </div>
                <span className="text-xs text-center line-clamp-2 font-medium break-all px-1">
                  {file.name}
                </span>
                <span className="text-[10px] text-blue-500 font-medium">{Math.round(file.progress)}%</span>
              </div>
            ))}
             {nodes.map(node => (
              <div 
                key={node.id} 
                className="flex flex-col items-center gap-2 relative group"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, node });
                }}
              >
                <div className="w-full aspect-square bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-sm relative group hover:scale-[1.02] transition-all border border-black/5 dark:border-white/5 overflow-hidden">
                  <button 
                    onClick={() => openPreview(node)}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {getIcon(node)}
                  </button>

                  {/* Hover Quick Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 bg-black/60 dark:bg-zinc-950/80 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 backdrop-blur-md">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewNameInput(node.name);
                        setRenamingNode(node);
                      }}
                      className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(node.id);
                      }}
                      className="p-1.5 hover:bg-rose-500/30 rounded-lg text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <span className="text-xs text-center line-clamp-2 font-medium break-all px-1">
                  {node.name}
                </span>
                {node.size && <span className="text-[10px] text-gray-500">{formatSize(node.size)}</span>}
              </div>
            ))}
            {nodes.length === 0 && uploadingFiles.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Folder className="w-16 h-16 mb-4 opacity-20" />
                <p className="mb-6">{activeTab === 'recents' ? 'No recent files' : 'Folder is empty'}</p>
                {activeTab === 'browse' && (
                  <div className="flex gap-4">
                    <button 
                      onClick={handleCreateFolderPrompt}
                      className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-blue-600 transition-colors active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                      Create New Folder
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-zinc-800 text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-zinc-700 transition-colors active:scale-95"
                    >
                      <Upload className="w-5 h-5" />
                      Upload File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {uploadingFiles.map(file => (
              <div key={file.id} className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm opacity-60 relative overflow-hidden">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center relative">
                  {getIcon({ type: 'file', mimeType: file.mimeType } as VFSNode)}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-black/10 dark:border-white/10 border-t-blue-500 animate-spin" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${file.progress}%` }} />
                  </div>
                </div>
                <span className="text-xs text-blue-500 font-medium w-10 text-right">{Math.round(file.progress)}%</span>
              </div>
            ))}
            {/* Bulk Selection Header Bar */}
            {nodes.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-black/5 dark:border-white/5 mb-1">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={nodes.length > 0 && selectedNodeIds.length === nodes.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = selectedNodeIds.length > 0 && selectedNodeIds.length < nodes.length;
                      }
                    }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNodeIds(nodes.map(n => n.id));
                      } else {
                        setSelectedNodeIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {selectedNodeIds.length > 0 
                      ? `${selectedNodeIds.length} of ${nodes.length} Selected` 
                      : 'Select All Items'}
                  </span>
                </div>
                
                {selectedNodeIds.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkShare(selectedNodeIds)}
                      className="px-2.5 py-1.5 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      title="Bulk Share Selected"
                    >
                      <Share className="w-3.5 h-3.5" /> Share
                    </button>
                    <button
                      onClick={() => handleBulkDelete(selectedNodeIds)}
                      className="px-2.5 py-1.5 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 text-rose-600 dark:text-rose-450 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      title="Bulk Delete Selected"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {nodes.map(node => {
              const isSelected = selectedNodeIds.includes(node.id);
              return (
                <div 
                  key={node.id} 
                  className={`flex items-center gap-4 p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors relative group cursor-pointer ${isSelected ? 'ring-2 ring-blue-500/50' : ''}`}
                  onClick={() => openPreview(node)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, node });
                  }}
                >
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center pl-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNodeIds(prev => [...prev, node.id]);
                        } else {
                          setSelectedNodeIds(prev => prev.filter(id => id !== node.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                    {getIcon(node)}
                  </div>
                <div className="flex-1 min-w-0 pr-24">
                  <p className="text-sm font-medium truncate">{node.name}</p>
                  <p className="text-xs text-gray-500">
                    {node.type === 'folder' ? 'Folder' : formatSize(node.size)} • {new Date(node.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Hover Quick Actions in List Mode */}
                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewNameInput(node.name);
                      setRenamingNode(node);
                    }}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-gray-600 dark:text-zinc-300 transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(node.id);
                    }}
                    className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg text-rose-500/70 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, node });
                  }}
                  className="p-2 text-gray-400 hover:text-blue-500 absolute right-3"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              );
            })}
            {nodes.length === 0 && uploadingFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Folder className="w-16 h-16 mb-4 opacity-20" />
                <p className="mb-6">{activeTab === 'recents' ? 'No recent files' : 'Folder is empty'}</p>
                {activeTab === 'browse' && (
                  <div className="flex gap-4">
                    <button 
                      onClick={handleCreateFolderPrompt}
                      className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-blue-600 transition-colors active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                      Create New Folder
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-zinc-800 text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-zinc-700 transition-colors active:scale-95"
                    >
                      <Upload className="w-5 h-5" />
                      Upload File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-black/5 dark:border-white/10 flex justify-around items-center p-2 pb-safe">
        <button 
          onClick={() => setActiveTab('recents')}
          className={`flex flex-col items-center gap-1 p-2 w-20 ${activeTab === 'recents' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <List className="w-6 h-6" />
          <span className="text-[10px] font-medium">Recents</span>
        </button>
        <button 
          onClick={() => setActiveTab('browse')}
          className={`flex flex-col items-center gap-1 p-2 w-20 ${activeTab === 'browse' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <Folder className="w-6 h-6" />
          <span className="text-[10px] font-medium">Browse</span>
        </button>
        <button 
          onClick={() => setActiveTab('sync')}
          className={`flex flex-col items-center gap-1 p-2 w-20 ${activeTab === 'sync' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <Cloud className="w-6 h-6" />
          <span className="text-[10px] font-medium">Cloud Sync</span>
        </button>
      </div>

      {/* Click outside to close legacy context menu (if any still triggers) */}
      {selectedNode && (
        <div 
          className="absolute inset-0 z-10" 
          onClick={() => setSelectedNode(null)} 
        />
      )}

      {/* Floating Context Menu */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
          />
          <div 
            style={{ 
              top: Math.min(contextMenu.y, window.innerHeight - 155), 
              left: Math.min(contextMenu.x, window.innerWidth - 185) 
            }}
            className="fixed bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 z-[101] w-44 overflow-hidden py-1"
          >
            <div className="px-3.5 py-2 border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-950/20">
              <p className="text-[9px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest truncate">
                {contextMenu.node.type === 'folder' ? 'Folder Actions' : 'File Actions'}
              </p>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate mt-0.5" title={contextMenu.node.name}>
                {contextMenu.node.name}
              </p>
            </div>
            
            {contextMenu.node.type === 'file' && (
              <button 
                onClick={() => {
                  handleShare(contextMenu.node);
                  setContextMenu(null);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 text-zinc-700 dark:text-zinc-300"
              >
                <Share className="w-3.5 h-3.5 text-blue-500" /> Share File
              </button>
            )}
            
            <button 
              onClick={() => {
                setNewNameInput(contextMenu.node.name);
                setRenamingNode(contextMenu.node);
                setContextMenu(null);
              }}
              className="w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 text-zinc-700 dark:text-zinc-300"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Rename Item
            </button>
            
            <button 
              onClick={() => {
                handleDelete(contextMenu.node.id);
                setContextMenu(null);
              }}
              className="w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-rose-500 font-extrabold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Locally
            </button>
          </div>
        </>
      )}

      {/* Custom Rename Modal */}
      <AnimatePresence>
        {renamingNode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 text-white"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-xs rounded-3xl p-5 shadow-2xl relative"
            >
              <h3 className="font-extrabold text-sm text-zinc-100 mb-1.5">Rename Item</h3>
              <p className="text-[10px] text-zinc-400 mb-4 leading-normal">
                Choose a custom name for your local file storage entry.
              </p>
              
              <input
                type="text"
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newNameInput.trim()) {
                    handleRename(renamingNode.id, newNameInput);
                    setRenamingNode(null);
                  } else if (e.key === 'Escape') {
                    setRenamingNode(null);
                  }
                }}
                className="w-full bg-zinc-800 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 mb-4 font-bold shadow-inner"
                placeholder="Filename"
              />
              
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setRenamingNode(null)}
                  className="flex-1 bg-zinc-850 hover:bg-zinc-800 active:scale-95 text-zinc-300 font-bold py-2.5 rounded-xl transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newNameInput.trim()) {
                      handleRename(renamingNode.id, newNameInput);
                      setRenamingNode(null);
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold py-2.5 rounded-xl transition-all"
                >
                  Rename
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewNode && previewUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                closePreview();
              }
            }}
          >
            <div className="flex justify-between items-center p-4 pt-12 text-white">
              <button onClick={closePreview} className="text-blue-400 font-medium">Done</button>
              <span className="font-semibold text-sm truncate max-w-[200px]">{previewNode.name}</span>
              <div className="flex items-center gap-4">
                <button onClick={() => handleShare(previewNode)} className="text-blue-400"><Share className="w-5 h-5" /></button>
                <button onClick={() => {
                  if (previewUrl && previewNode) {
                    const a = document.createElement('a');
                    a.href = previewUrl;
                    a.download = previewNode.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }} className="text-blue-400"><Download className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {previewNode.mimeType?.startsWith('image/') && (
                <img src={previewUrl} alt={previewNode.name} className="max-w-full max-h-full object-contain rounded-lg" />
              )}
              
              {previewNode.mimeType?.startsWith('video/') && (
                <div className="w-full max-w-4xl max-h-full flex items-center justify-center">
                  <VideoPlayer src={previewUrl} autoPlay className="w-full h-full max-h-[80vh]" />
                </div>
              )}

              {previewNode.mimeType?.startsWith('audio/') && (
                <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-8 flex flex-col items-center shadow-2xl border border-white/10">
                  <div className="w-48 h-48 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-8 flex items-center justify-center shadow-lg">
                    <Music className="w-20 h-20 text-white/50" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2 text-center w-full truncate">{previewNode.name}</h2>
                  <p className="text-zinc-400 text-sm mb-8">Audio File</p>
                  
                  <audio 
                    ref={audioRef} 
                    src={previewUrl} 
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                    autoPlay
                  />
                </div>
              )}

              {!previewNode.mimeType?.startsWith('image/') && 
               !previewNode.mimeType?.startsWith('video/') && 
               !previewNode.mimeType?.startsWith('audio/') && (
                <div className="flex flex-col items-center text-white/50">
                  <FileIcon className="w-24 h-24 mb-4" />
                  <p>Preview not available for this file type</p>
                  <p className="text-sm mt-2">{formatSize(previewNode.size)}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
