"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { FileText, Calendar, User, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme, getThemeColors } from '../../context/ThemeProvider';

interface Log {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  user?: {
    name: string;
  };
  createdAt: string;
  before?: any;
  after?: any;
}

export default function ActionLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'students' | 'users' | 'absent'>('all');
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'students') return log.entityType === 'Student';
    if (filter === 'users') return log.entityType === 'User';
    if (filter === 'absent') return log.action.toLowerCase().includes('absent') || log.action.toLowerCase().includes('marked absent');
    return false;
  });

  const getActionColor = (action: string) => {
    if (action.includes('Created') || action.includes('Added')) return 'text-green-600 bg-green-100';
    if (action.includes('Updated') || action.includes('Modified')) return 'text-blue-600 bg-blue-100';
    if (action.includes('Deleted') || action.includes('Removed')) return 'text-red-600 bg-red-100';
    if (action.includes('Archived')) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const exportLogs = async () => {
    try {
      const XLSX = await import('xlsx');
      const exportData = filteredLogs.map(log => ({
        'Date': format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        'User': log.user?.name || 'System',
        'Action': log.action,
        'Entity Type': log.entityType,
        'Entity ID': log.entityId || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Action Logs');
      
      const filename = `action_logs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: colors.text }}>Action Logs</h2>
          <p className="text-sm sm:text-base" style={{ color: colors.textSecondary }}>View all system activities and user actions.</p>
        </div>
        <Button
          onClick={exportLogs}
          className="border-0 hover:opacity-90 transition-opacity w-full sm:w-auto"
          style={{ backgroundColor: colors.primary, color: colors.text }}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" style={{ color: colors.textSecondary }} />
            <span className="text-sm font-medium" style={{ color: colors.text }}>Filter by:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Actions' },
              { key: 'students', label: 'Students' },
              { key: 'users', label: 'Users' },
              { key: 'absent', label: 'Absent' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter !== filterOption.key ? 'hover:opacity-80' : ''
                }`}
                style={{
                  backgroundColor: filter === filterOption.key ? colors.primary : (isDark ? colors.hover : colors.lightButton),
                  color: filter === filterOption.key ? '#ffffff' : colors.text
                }}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="rounded-lg border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
            <p style={{ color: colors.textSecondary }}>Loading logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
            <p style={{ color: colors.textSecondary }}>No logs found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3 sm:p-4 transition-colors hover:opacity-80">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {(() => {
                          // Check if this is an absence log and include the actual absence date
                          if (log.action.toLowerCase().includes('absent') && log.after) {
                            try {
                              const afterData = typeof log.after === 'string' ? JSON.parse(log.after) : log.after;
                              if (afterData && afterData.date) {
                                const absenceDate = format(new Date(afterData.date), 'MMM dd, yyyy');
                                return `${log.action} on ${absenceDate}`;
                              }
                            } catch (e) {
                              // Fallback to original action
                            }
                          }
                          return log.action;
                        })()}
                      </span>
                      {log.entityType && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: colors.hover, color: colors.text }}>
                          {log.entityType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-2" style={{ color: colors.text }}>
                      {log.before && log.after ? 'Updated' : (log.action.toLowerCase().includes('absent') ? 'Marked' : 'Created')} by{' '}
                      <span className="font-medium">{log.user?.name || 'Teacher'}</span>
                    </p>
                    {log.before && log.after && (
                      <div className="text-xs" style={{ color: colors.textSecondary }}>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: '#4a1a1a', color: '#ff6b6b' }}>Before</span>
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: '#1a4a2a', color: '#006239' }}>After</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-left sm:text-right text-xs" style={{ color: colors.textSecondary }}>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div style={{ color: colors.textMuted }}>
                      {format(new Date(log.createdAt), 'HH:mm:ss')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {!isLoading && filteredLogs.length > 0 && (
        <div className="rounded-lg p-4 border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm" style={{ color: colors.textSecondary }}>
            <span>Showing {filteredLogs.length} of {logs.length} total logs</span>
            <span className="text-xs sm:text-sm">Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
