// Service Worker for RabbyOS Virtual File System (VFS) Sync
const CACHE_NAME = 'rabbyos-vfs-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css'
];

// Inside the service worker, we can maintain an in-memory or IDB-backed queue of VFS change transactions
let pendingChangesQueue = [];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Message Listener for tracking VFS local changes
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'RECORD_VFS_CHANGE') {
    const { id, name, action, size, modifiedAt } = data.payload;
    
    // Remove duplicate entries for the same file, keeping the latest action
    pendingChangesQueue = pendingChangesQueue.filter(change => change.id !== id);
    
    pendingChangesQueue.push({
      id,
      name,
      action,
      size,
      modifiedAt: modifiedAt || Date.now()
    });

    // Broadcast updated queue length to all pages
    broadcastMessage({
      type: 'VFS_PENDING_UPDATED',
      queue: pendingChangesQueue
    });
  }

  else if (data.type === 'GET_SYNCHRONIZATION_QUEUE') {
    event.ports[0].postMessage({
      type: 'SYNCHRONIZATION_QUEUE_RESPONSE',
      queue: pendingChangesQueue
    });
  }

  else if (data.type === 'CLEAR_SYNCHRONIZATION_QUEUE') {
    pendingChangesQueue = [];
    broadcastMessage({
      type: 'VFS_PENDING_UPDATED',
      queue: pendingChangesQueue
    });
  }

  else if (data.type === 'RESOLVE_ITEM_IN_QUEUE') {
    const { id } = data.payload;
    pendingChangesQueue = pendingChangesQueue.filter(item => item.id !== id);
    broadcastMessage({
      type: 'VFS_PENDING_UPDATED',
      queue: pendingChangesQueue
    });
  }
});

// Helper to broadcast messages to all connected client tabs
async function broadcastMessage(message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

// Background Sync capability support
self.addEventListener('sync', (event) => {
  if (event.tag === 'vfs-manual-push-sync') {
    // Notify clients to prompt or auto-perform sync
    event.waitUntil(
      broadcastMessage({
        type: 'BACKGROUND_SYNC_TRIGGERED',
        tag: event.tag
      })
    );
  }
});
