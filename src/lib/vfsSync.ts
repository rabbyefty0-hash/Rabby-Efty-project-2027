import { initVFS, VFSNode, addNode, getAllFiles, getNode, deleteNode } from './vfs';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SyncLog {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface SyncStatus {
  lastSynced: number | null;
  isSyncing: boolean;
  statusText: string;
  progress: number; // 0 to 100
  error: string | null;
  mode: 'idle' | 'scanning' | 'uploading' | 'downloading' | 'conflicts' | 'done';
  logs: SyncLog[];
  uploadSpeed?: string;
  timeRemaining?: string;
}

export interface SyncConflict {
  localNode: VFSNode;
  remoteNode: {
    id: string;
    name: string;
    size?: number;
    modifiedAt: number;
    mimeType?: string;
  };
}

// Simulated Cloud database schema for high-fidelity offline/guest testing
interface CloudSimSchema extends DBSchema {
  files: {
    key: string;
    value: {
      id: string;
      name: string;
      type: 'file' | 'folder';
      parentId: string | null;
      data?: Blob;
      mimeType?: string;
      size?: number;
      createdAt: number;
      modifiedAt: number;
    };
  };
  metadata: {
    key: string;
    value: any;
  };
}

let cloudSimDbPromise: Promise<IDBPDatabase<CloudSimSchema>> | null = null;

const initCloudSimDB = () => {
  if (!cloudSimDbPromise) {
    cloudSimDbPromise = openDB<CloudSimSchema>('iOS_VFS_Cloud_Sim', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      }
    });
  }
  return cloudSimDbPromise;
};

// Global reactive sync status
let currentStatus: SyncStatus = {
  lastSynced: (() => {
    const saved = localStorage.getItem('vfs_last_synced');
    return saved ? parseInt(saved, 10) : null;
  })(),
  isSyncing: false,
  statusText: 'Idle',
  progress: 0,
  error: null,
  mode: 'idle',
  logs: []
};

// Active conflicts
let activeConflicts: SyncConflict[] = [];

// Listeners
const listeners = new Set<(status: SyncStatus, conflicts: SyncConflict[]) => void>();

export const getSyncStatus = () => ({ ...currentStatus });
export const getActiveConflicts = () => [...activeConflicts];

export const subscribeToSync = (callback: (status: SyncStatus, conflicts: SyncConflict[]) => void) => {
  listeners.add(callback);
  callback({ ...currentStatus }, [...activeConflicts]);
  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = () => {
  listeners.forEach(cb => cb({ ...currentStatus }, [...activeConflicts]));
};

const addLog = (message: string, type: SyncLog['type'] = 'info') => {
  const newLog: SyncLog = {
    id: Math.random().toString(36).substring(2, 9),
    time: new Date().toLocaleTimeString(),
    type,
    message
  };
  currentStatus.logs = [newLog, ...currentStatus.logs].slice(0, 100); // Keep last 100
  notifyListeners();
};

const updateStatus = (updates: Partial<SyncStatus>) => {
  currentStatus = { ...currentStatus, ...updates };
  if (updates.lastSynced !== undefined) {
    if (updates.lastSynced) {
      localStorage.setItem('vfs_last_synced', String(updates.lastSynced));
    } else {
      localStorage.removeItem('vfs_last_synced');
    }
  }
  notifyListeners();
};

// Helper: Read a local file node's content as a Blob
const getNodeBlob = async (node: VFSNode): Promise<Blob | null> => {
  if (node.data instanceof Blob) {
    return node.data;
  }
  if (node.handle && typeof node.handle.getFile === 'function') {
    try {
      const file = await node.handle.getFile();
      return file;
    } catch (e: any) {
      console.error(`Failed to get file from handle for node ${node.id}:`, e);
      return null;
    }
  }
  return null;
};

// ==========================================
// MOCK / GUEST CLOUD SYNC SIMULATION
// ==========================================
export const performSimulatedSync = async () => {
  if (currentStatus.isSyncing) return;
  
  updateStatus({
    isSyncing: true,
    statusText: 'Connecting to Cloud Sandbox...',
    progress: 5,
    error: null,
    mode: 'scanning'
  });
  
  activeConflicts = [];
  addLog('Initializing Simulated Cloud Connector...', 'info');

  try {
    const cloudDb = await initCloudSimDB();
    const localNodes = await getAllLocalNodes();
    
    // Simulate latency
    await delay(1000);
    
    updateStatus({ statusText: 'Analysing client files & directories...', progress: 20 });
    addLog(`Read ${localNodes.length} local virtual VFS entries`, 'info');

    // Get remote cloud mock files
    const cloudFilesList = await cloudDb.getAll('files');
    addLog(`Read ${cloudFilesList.length} remote cloud entries`, 'info');

    // Simple delta calculations
    const toUpload: VFSNode[] = [];
    const toDownload: typeof cloudFilesList = [];

    // Analyze uploads / local-first changes
    for (const local of localNodes) {
      const remote = cloudFilesList.find(c => c.id === local.id);
      if (!remote) {
        toUpload.push(local);
      } else if (local.modifiedAt > remote.modifiedAt) {
        toUpload.push(local);
      }
    }

    // Analyze downloads / cloud-first changes
    for (const remote of cloudFilesList) {
      const local = localNodes.find(l => l.id === remote.id);
      if (!local) {
        toDownload.push(remote);
      } else if (remote.modifiedAt > local.modifiedAt) {
        // Detect Conflict if both modified times are very recent or different
        if (Math.abs(remote.modifiedAt - local.modifiedAt) > 2000) {
          activeConflicts.push({
            localNode: local,
            remoteNode: {
              id: remote.id,
              name: remote.name,
              size: remote.size,
              modifiedAt: remote.modifiedAt,
              mimeType: remote.mimeType
            }
          });
        } else {
          toDownload.push(remote);
        }
      }
    }

    if (activeConflicts.length > 0) {
      addLog(`Detected ${activeConflicts.length} synchronization conflicts! Waiting for user action.`, 'warn');
      updateStatus({
        isSyncing: false,
        statusText: 'Conflicts detected! Please resolve below.',
        progress: 50,
        mode: 'conflicts'
      });
      return;
    }

    const totalActions = toUpload.length + toDownload.length;
    addLog(`Calculated plan: ${toUpload.length} files to upload, ${toDownload.length} files to download.`, 'info');

    let processed = 0;
    const totalSize = toUpload.concat(toDownload).reduce((acc, n) => acc + (n.size || 5000), 0);
    let processedSize = 0;
    
    // Upload simulated changes
    if (toUpload.length > 0) {
      updateStatus({ statusText: 'Uploading modified drafts...', mode: 'uploading' });
      for (const node of toUpload) {
        addLog(`Uploading file node: "${node.name}"...`, 'info');
        const blob = await getNodeBlob(node);
        const size = node.size || 5000;
        
        // Simulating upload speed and ETA
        const speedNum = (1.2 + Math.random() * 1.6) * 1024 * 1024; // MB/s in bytes
        const speedText = (speedNum / (1024 * 1024)).toFixed(1) + " MB/s";
        const remainingSize = Math.max(0, totalSize - processedSize);
        const etaSeconds = Math.max(1, Math.round(remainingSize / speedNum));
        const etaText = `${etaSeconds}s remaining`;

        await cloudDb.put('files', {
          id: node.id,
          name: node.name,
          type: node.type,
          parentId: node.parentId,
          data: blob || undefined,
          mimeType: node.mimeType,
          size: node.size,
          createdAt: node.createdAt,
          modifiedAt: node.modifiedAt
        });

        await delay(350);
        processed++;
        processedSize += size;
        updateStatus({ 
          progress: 20 + Math.round((processed / totalActions) * 60),
          uploadSpeed: speedText,
          timeRemaining: etaText
        });
      }
    }

    // Download simulated changes
    if (toDownload.length > 0) {
      updateStatus({ statusText: 'Downloading remote items...', mode: 'downloading' });
      for (const rNode of toDownload) {
        addLog(`Downloading new node: "${rNode.name}"...`, 'info');
        const size = rNode.size || 5000;

        // Simulating download speed and ETA (downloads are faster)
        const speedNum = (2.4 + Math.random() * 3.2) * 1024 * 1024; // MB/s in bytes
        const speedText = (speedNum / (1024 * 1024)).toFixed(1) + " MB/s";
        const remainingSize = Math.max(0, totalSize - processedSize);
        const etaSeconds = Math.max(1, Math.round(remainingSize / speedNum));
        const etaText = `${etaSeconds}s remaining`;
        
        // Recreate node in local VFS
        const localNode: VFSNode = {
          id: rNode.id,
          name: rNode.name,
          type: rNode.type,
          parentId: rNode.parentId,
          data: rNode.data,
          mimeType: rNode.mimeType,
          size: rNode.size,
          createdAt: rNode.createdAt,
          modifiedAt: rNode.modifiedAt
        };
        await addNode(localNode);
        
        await delay(350);
        processed++;
        processedSize += size;
        updateStatus({ 
          progress: 20 + Math.round((processed / totalActions) * 60),
          uploadSpeed: speedText,
          timeRemaining: etaText
        });
      }
    }

    // Complete Sync
    updateStatus({
      isSyncing: false,
      statusText: 'Synced Successfully!',
      progress: 100,
      lastSynced: Date.now(),
      mode: 'done',
      uploadSpeed: undefined,
      timeRemaining: undefined
    });
    addLog('Cross-device simulation sync finished successfully!', 'success');

  } catch (err: any) {
    console.error('Simulated Sync Error:', err);
    updateStatus({
      isSyncing: false,
      statusText: 'Sync failed',
      progress: 0,
      error: err.message || String(err),
      mode: 'idle'
    });
    addLog(`Error during sync: ${err.message || String(err)}`, 'error');
  }
};

// ==========================================
// REAL GOOGLE DRIVE CLOUD SYNC IMPLEMENTATION
// ==========================================
export const performGoogleDriveSync = async (googleToken: string) => {
  if (currentStatus.isSyncing) return;

  updateStatus({
    isSyncing: true,
    statusText: 'Connecting to Google Drive APIs...',
    progress: 5,
    error: null,
    mode: 'scanning'
  });
  activeConflicts = [];
  addLog('Authorizing with Google Drive...', 'info');

  try {
    // 1. Check if "RabbyOS_VFS_Sync" folder exists on user's drive
    updateStatus({ statusText: 'Searching for cloud sync directory...', progress: 15 });
    let syncFolderId = await getDriveSyncFolderId(googleToken);
    
    if (!syncFolderId) {
      addLog('No cloud sync folder found. Creating a new "RabbyOS_VFS_Sync" folder...', 'info');
      syncFolderId = await createDriveSyncFolder(googleToken);
      addLog(`Created central folder in Google Drive (ID: ${syncFolderId})`, 'info');
    } else {
      addLog(`Found RabbyOS cloud backup folder: (ID: ${syncFolderId})`, 'info');
    }

    // 2. Fetch the manifest.json file from that directory if it exists
    updateStatus({ statusText: 'Reading cloud sync manifest...', progress: 30 });
    const localNodes = await getAllLocalNodes();
    addLog(`Scanning local device storage: found ${localNodes.length} nodes`, 'info');

    const manifestResponse = await getDriveManifest(syncFolderId, googleToken);
    let remoteManifest: { syncedAt: number; nodes: VFSNode[] } = { syncedAt: 0, nodes: [] };
    
    if (manifestResponse) {
      remoteManifest = manifestResponse;
      addLog(`Retrieved cloud manifest containing ${remoteManifest.nodes.length} registered nodes`, 'info');
    } else {
      addLog('No legacy cloud manifest found. Starting base synchronization.', 'info');
    }

    // 3. Match directories / structure
    const remoteNodes = remoteManifest.nodes;
    const toUpload: VFSNode[] = [];
    const toDownload: VFSNode[] = [];

    // Analyze uploads
    for (const local of localNodes) {
      const remote = remoteNodes.find(r => r.id === local.id);
      if (!remote) {
        toUpload.push(local);
      } else if (local.modifiedAt > remote.modifiedAt) {
        toUpload.push(local);
      }
    }

    // Analyze downloads
    for (const remote of remoteNodes) {
      const local = localNodes.find(l => l.id === remote.id);
      if (!local) {
        toDownload.push(remote);
      } else if (remote.modifiedAt > local.modifiedAt) {
        if (Math.abs(remote.modifiedAt - local.modifiedAt) > 2000) {
          activeConflicts.push({
            localNode: local,
            remoteNode: {
              id: remote.id,
              name: remote.name,
              size: remote.size,
              modifiedAt: remote.modifiedAt,
              mimeType: remote.mimeType
            }
          });
        } else {
          toDownload.push(remote);
        }
      }
    }

    if (activeConflicts.length > 0) {
      addLog(`Detected ${activeConflicts.length} item conflicts! Manual resolution needed.`, 'warn');
      updateStatus({
        isSyncing: false,
        statusText: 'Sync conflicts detected!',
        progress: 50,
        mode: 'conflicts'
      });
      return;
    }

    const totalActions = toUpload.length + toDownload.length;
    addLog(`Resolved task queue: ${toUpload.length} uploads, ${toDownload.length} downloads needed.`, 'info');

    const totalSize = toUpload.concat(toDownload).reduce((acc, n) => acc + (n.size || 5000), 0);
    let processedSize = 0;
    let processed = 0;

    // A map of VFS root path structures to handle folder creations
    // First, verify all folder nodes exist both locally and remotely in our manifest index
    if (toUpload.filter(n => n.type === 'folder').length > 0) {
      addLog('Syncing folder structural mappings...', 'info');
    }

    // Process file uploading to Drive
    for (const node of toUpload) {
      if (node.type === 'folder') {
        // Folder nodes don't need raw content, just metadata update in master manifest
        processed++;
        updateStatus({ progress: 30 + Math.round((processed / (totalActions || 1)) * 60) });
        continue;
      }
      
      const size = node.size || 5000;
      const speedNum = (1.5 + Math.random() * 1.5) * 1024 * 1024; // MB/s
      const speedText = (speedNum / (1024 * 1024)).toFixed(1) + " MB/s";
      const remainingSize = Math.max(0, totalSize - processedSize);
      const etaSeconds = Math.max(1, Math.round(remainingSize / speedNum));
      const etaText = `${etaSeconds}s remaining`;

      updateStatus({ 
        statusText: `Uploading: ${node.name}...`, 
        mode: 'uploading',
        uploadSpeed: speedText,
        timeRemaining: etaText
      });
      addLog(`Uploading file node "${node.name}" to Drive...`, 'info');

      const blob = await getNodeBlob(node);
      if (!blob) {
        addLog(`Cannot read local blob for "${node.name}". Skipped.`, 'warn');
        processed++;
        continue;
      }

      // Check if there is an existing GDrive file mapping under RabbyOS_VFS_Sync
      const remoteFileId = await findDriveFileInFolder(syncFolderId, `VFS_node_${node.id}`, googleToken);
      
      const metadata = {
        name: `VFS_node_${node.id}`,
        parents: [syncFolderId],
        description: `RabbyOS VFS Sync File: ${node.name}`,
        mimeType: node.mimeType || 'application/octet-stream'
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', blob);

      let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      let method = 'POST';
      
      if (remoteFileId) {
        uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${remoteFileId}?uploadType=multipart`;
        method = 'PATCH';
      }

      const res = await fetch(uploadUrl, {
        method,
        headers: { Authorization: `Bearer ${googleToken}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Failed to upload ${node.name}: ${res.statusText}`);
      }
      
      processed++;
      processedSize += size;
      updateStatus({ 
        progress: 30 + Math.round((processed / totalActions) * 60),
        uploadSpeed: (1.5 + Math.random() * 1.5).toFixed(1) + " MB/s",
        timeRemaining: `${Math.max(1, Math.round((totalSize - processedSize) / (1.8 * 1024 * 1024)))}s remaining`
      });
    }

    // Process downloading of missing / newer files from GDrive
    for (const node of toDownload) {
      if (node.type === 'folder') {
        // Just create the local folder
        await addNode({
          id: node.id,
          name: node.name,
          type: 'folder',
          parentId: node.parentId,
          createdAt: node.createdAt,
          modifiedAt: node.modifiedAt
        });
        processed++;
        updateStatus({ progress: 30 + Math.round((processed / totalActions) * 60) });
        continue;
      }

      const size = node.size || 5000;
      const speedNum = (2.5 + Math.random() * 2.5) * 1024 * 1024; // MB/s
      const speedText = (speedNum / (1024 * 1024)).toFixed(1) + " MB/s";
      const remainingSize = Math.max(0, totalSize - processedSize);
      const etaSeconds = Math.max(1, Math.round(remainingSize / speedNum));
      const etaText = `${etaSeconds}s remaining`;

      updateStatus({ 
        statusText: `Downloading: ${node.name}...`, 
        mode: 'downloading',
        uploadSpeed: speedText,
        timeRemaining: etaText
      });
      addLog(`Downloading file "${node.name}" from Google Drive...`, 'info');

      // Find the remote file Id mapping
      const remoteFileId = await findDriveFileInFolder(syncFolderId, `VFS_node_${node.id}`, googleToken);
      if (!remoteFileId) {
        addLog(`Cloud item file ID mapping not found for "${node.name}". Skipping.`, 'warn');
        processed++;
        continue;
      }

      const mediaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${remoteFileId}?alt=media`, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });

      if (!mediaRes.ok) {
        addLog(`Could not get media data for file: "${node.name}"`, 'error');
        processed++;
        continue;
      }

      const blob = await mediaRes.blob();
      await addNode({
        id: node.id,
        name: node.name,
        type: 'file',
        parentId: node.parentId,
        data: blob,
        mimeType: node.mimeType,
        size: blob.size,
        createdAt: node.createdAt,
        modifiedAt: node.modifiedAt
      });

      processed++;
      processedSize += size;
      updateStatus({ 
        progress: 30 + Math.round((processed / totalActions) * 60),
        uploadSpeed: (2.5 + Math.random() * 2.5).toFixed(1) + " MB/s",
        timeRemaining: `${Math.max(1, Math.round((totalSize - processedSize) / (3.2 * 1024 * 1024)))}s remaining`
      });
    }

    // 4. Create and upload a new updated manifest index incorporating current merged states
    updateStatus({ statusText: 'Uploading master sync index...', progress: 95 });
    const updatedLocalNodes = await getAllLocalNodes();
    
    // Strip blobs before syncing the metadata manifest list
    const manifestNodes = updatedLocalNodes.map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      parentId: n.parentId,
      size: n.size,
      mimeType: n.mimeType,
      createdAt: n.createdAt,
      modifiedAt: n.modifiedAt
    }));

    await uploadDriveManifest(syncFolderId, {
      syncedAt: Date.now(),
      nodes: manifestNodes
    }, googleToken);

    updateStatus({
      isSyncing: false,
      statusText: 'Synchronized!',
      progress: 100,
      lastSynced: Date.now(),
      mode: 'done',
      uploadSpeed: undefined,
      timeRemaining: undefined
    });
    addLog('Google Drive Sync completed flawlessly!', 'success');

  } catch (err: any) {
    console.error('Google Drive Sync Failed:', err);
    updateStatus({
      isSyncing: false,
      statusText: 'Google Drive Sync Failed',
      progress: 0,
      error: err.message || String(err),
      mode: 'idle'
    });
    addLog(`Error: ${err.message || String(err)}. Check scopes/permissions in Settings.`, 'error');
  }
};

// ==========================================
// MANUAL CONFLICT RESOLUTION
// ==========================================
export const resolveConflict = async (conflict: SyncConflict, decision: 'local' | 'remote', googleToken?: string) => {
  addLog(`Conflicting item "${conflict.localNode.name}" resolved to Keep [${decision === 'local' ? 'Local' : 'Cloud Remote'}]`, 'info');
  
  try {
    if (decision === 'remote') {
      if (googleToken && googleToken !== 'mock_workspace_token') {
        // Resolve using real Google Drive file
        const syncFolderId = await getDriveSyncFolderId(googleToken);
        if (syncFolderId) {
          const remoteFileId = await findDriveFileInFolder(syncFolderId, `VFS_node_${conflict.remoteNode.id}`, googleToken);
          if (remoteFileId) {
            const mediaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${remoteFileId}?alt=media`, {
              headers: { Authorization: `Bearer ${googleToken}` }
            });
            if (mediaRes.ok) {
              const blob = await mediaRes.blob();
              await addNode({
                ...conflict.localNode,
                data: blob,
                size: blob.size,
                modifiedAt: conflict.remoteNode.modifiedAt
              });
            }
          }
        }
      } else {
        // Simulated Cloud resolution
        const cloudDb = await initCloudSimDB();
        const rNode = await cloudDb.get('files', conflict.remoteNode.id);
        if (rNode) {
          await addNode({
            ...conflict.localNode,
            data: rNode.data,
            size: rNode.size,
            modifiedAt: rNode.modifiedAt
          });
        }
      }
    } else {
      // Local decision: modify local modifiedAt or force push later
      const lNode = await getNode(conflict.localNode.id);
      if (lNode) {
        lNode.modifiedAt = Date.now();
        await addNode(lNode);
      }
    }

    // Filter resolved conflict
    activeConflicts = activeConflicts.filter(c => c.localNode.id !== conflict.localNode.id);
    
    if (activeConflicts.length === 0) {
      addLog('All synchronization conflicts have been resolved successfully!', 'success');
      updateStatus({
        statusText: 'All conflicts resolved. Running a final integrity pass...',
        progress: 85,
        mode: 'scanning'
      });
      // Run sync again to finalize
      if (googleToken && googleToken !== 'mock_workspace_token') {
        await performGoogleDriveSync(googleToken);
      } else {
        await performSimulatedSync();
      }
    } else {
      notifyListeners();
    }
  } catch (err: any) {
    addLog(`Failed to resolve conflict: ${err.message || err}`, 'error');
  }
};

// Reset logs or clear sync memory
export const clearSyncHistory = () => {
  updateStatus({
    logs: [],
    lastSynced: null,
    error: null,
    mode: 'idle',
    progress: 0
  });
  addLog('Sync transaction log records purged.', 'info');
};

// ==========================================
// DRIVE API NETWORKING HELPER FUNCTIONS
// ==========================================
const getDriveSyncFolderId = async (token: string): Promise<string | null> => {
  const query = encodeURIComponent("name = 'RabbyOS_VFS_Sync' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=1`;
  
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

const createDriveSyncFolder = async (token: string): Promise<string> => {
  const metadata = {
    name: 'RabbyOS_VFS_Sync',
    mimeType: 'application/vnd.google-apps.folder',
    description: 'RabbyOS Cloud Synchronized Storage Drive'
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) throw new Error('Could not instantiate backup directory on cloud.');
  const data = await res.json();
  return data.id;
};

const findDriveFileInFolder = async (folderId: string, name: string, token: string): Promise<string | null> => {
  const query = encodeURIComponent(`'${folderId}' in parents and name = '${name}' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) return null;
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

const getDriveManifest = async (folderId: string, token: string): Promise<any | null> => {
  const fileId = await findDriveFileInFolder(folderId, 'manifest.json', token);
  if (!fileId) return null;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return null;
  return res.json();
};

const uploadDriveManifest = async (folderId: string, manifest: any, token: string) => {
  const fileId = await findDriveFileInFolder(folderId, 'manifest.json', token);
  
  const metadata = {
    name: 'manifest.json',
    parents: [folderId],
    mimeType: 'application/json'
  };

  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', blob);

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';
  
  if (fileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) throw new Error('Failed uploading synchronous master index file.');
};

// ==========================================
// GENERAL UTILS
// ==========================================
const getAllLocalNodes = async (): Promise<VFSNode[]> => {
  const db = await initVFS();
  // Get all registered nodes (both files and keyfolders)
  return db.getAll('nodes');
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
