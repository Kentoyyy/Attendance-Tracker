"use client";

import React, { useState, useEffect } from 'react';
type ILog = { _id?: string; id?: string; action?: string; details?: string; timestamp?: string; createdAt?: string; grade?: number };
import { format } from 'date-fns';
import { FileText, ArrowLeft, UserPlus, Users, UserCheck, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

export default function LogsPage() {
  const [logs, setLogs] = useState<ILog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ILog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'absent' | 'students'>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/logs');
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
          setFilteredLogs(data);
        } else {
          console.error('Failed to fetch logs');
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Filter logs based on selected filter
  useEffect(() => {
    let filtered = logs;
    
    switch (filterType) {
      case 'absent':
        filtered = logs.filter(log => 
          log.action?.toLowerCase().includes('absent') || 
          log.action?.toLowerCase().includes('marked') ||
          log.action?.toLowerCase().includes('attendance') ||
          log.action?.toLowerCase().includes('present') ||
          log.details?.toLowerCase().includes('absent')
        );
        break;
      case 'students':
        filtered = logs.filter(log => 
          (log.action?.toLowerCase().includes('student added') ||
           log.action?.toLowerCase().includes('bulk student')) &&
          !log.action?.toLowerCase().includes('absent') &&
          !log.action?.toLowerCase().includes('marked')
        );
        break;
      default:
        filtered = logs;
    }
    
    setFilteredLogs(filtered);
  }, [logs, filterType]);

  // Get icon and color for log type
  const getLogIcon = (action: string) => {
    const lowerAction = action?.toLowerCase() || '';
    if (lowerAction.includes('student') || lowerAction.includes('bulk')) {
      return { icon: Users, color: 'bg-green-100 text-green-600' };
    } else if (lowerAction.includes('teacher') || lowerAction.includes('account')) {
      return { icon: UserPlus, color: 'bg-blue-100 text-blue-600' };
    } else if (lowerAction.includes('absent') || lowerAction.includes('marked')) {
      return { icon: Calendar, color: 'bg-red-100 text-red-600' };
    } else if (lowerAction.includes('attendance')) {
      return { icon: UserCheck, color: 'bg-purple-100 text-purple-600' };
    }
    return { icon: FileText, color: 'bg-gray-100 text-gray-500' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className='flex items-center gap-3'>
            <FileText className="h-8 w-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Action Logs</h1>
              <p className="text-gray-500">A detailed history of all actions performed.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('absent')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  filterType === 'absent'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Absent
              </button>
              <button
                onClick={() => setFilterType('students')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  filterType === 'students'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Students
              </button>
            </div>
            <Link href="/dashboard" passHref>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mb-4 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            Showing {filteredLogs.length} of {logs.length} logs
            {filterType === 'absent' && ' (Attendance & Absent only)'}
            {filterType === 'students' && ' (Student management only)'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {isLoading ? (
              <li className="p-6 text-center text-gray-500">Loading logs...</li>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => (
                <li key={String((log as any).id ?? (log as any)._id ?? idx)} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {(() => {
                        const { icon: Icon, color } = getLogIcon(log.action || '');
                        return (
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <p className="font-semibold text-gray-800">{log.action || 'Unknown Action'}</p>
                        <div className="flex items-center gap-2 mt-1 sm:mt-0">
                          {(log.action?.toLowerCase().includes('absent') || log.details?.toLowerCase().includes('absent')) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Absent
                            </span>
                          )}
                          {log.grade && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Grade {log.grade}
                            </span>
                          )}
                          <p className="text-xs text-gray-400">
                            {(() => {
                              const t: any = (log as any).createdAt || (log as any).timestamp;
                              const d = t ? new Date(t) : null;
                              return d && !isNaN(d.getTime()) ? format(d, "MMM d, yyyy 'at' h:mm a") : '-';
                            })()}
                          </p>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {log.details || 'No details available'}
                        {(log as any).after?.reason && (
                          <span className="ml-2 text-gray-500">Note: {(log as any).after.reason}</span>
                        )}
                        {(log as any).after?.date && (
                          <span className="ml-2 text-gray-500">Date: {format(new Date((log as any).after.date), 'MMM d, yyyy')}</span>
                        )}
                        {(log as any).after?.sex && (
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(log as any).after.sex === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                            {(log as any).after.sex}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="p-6 text-center text-gray-500">
                {filterType === 'absent' ? 'No attendance logs found.' : 
                 filterType === 'students' ? 'No student management logs found.' : 
                 'No logs found.'}
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
} 