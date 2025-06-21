"use client"

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Download, Upload } from 'lucide-react';
import { OfflineStorage } from '../lib/offline-storage';

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending sync operations
    checkPendingSync();

    // Set up periodic sync check
    const syncInterval = setInterval(checkPendingSync, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  const checkPendingSync = async () => {
    try {
      const pending = await OfflineStorage.getPendingSync();
      setPendingSync(pending.length);
    } catch (error) {
      console.error('Failed to check pending sync:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await OfflineStorage.syncPendingOperations();
      await checkPendingSync();
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await OfflineStorage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          await OfflineStorage.importData(text);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Failed to import data. Please check the file format.');
        }
      }
    };
    input.click();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        {/* Status Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {pendingSync > 0 ? (
              <CloudOff className="h-4 w-4 text-orange-600" />
            ) : (
              <Cloud className="h-4 w-4 text-green-600" />
            )}
            {pendingSync > 0 && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {pendingSync} pending
              </span>
            )}
          </div>
        </div>

        {/* Sync Status */}
        {!isOnline && (
          <div className="text-xs text-gray-600 mb-3">
            Working offline. Changes will sync when you're back online.
          </div>
        )}

        {pendingSync > 0 && isOnline && (
          <div className="text-xs text-gray-600 mb-3">
            {pendingSync} changes waiting to sync
          </div>
        )}

        {/* Last Sync */}
        {lastSync && (
          <div className="text-xs text-gray-500 mb-3">
            Last sync: {lastSync.toLocaleTimeString()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isOnline && pendingSync > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="h-3 w-3" />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            title="Export data backup"
          >
            <Download className="h-3 w-3" />
            Export
          </button>

          <button
            onClick={handleImport}
            className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            title="Import data backup"
          >
            <Upload className="h-3 w-3" />
            Import
          </button>
        </div>

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <strong>Offline Mode:</strong> All data is stored locally and will sync automatically when you reconnect.
          </div>
        )}
      </div>
    </div>
  );
} 