"use client";

import React, { useState, useEffect } from 'react';
import { ILog } from '@/app/models/Log';
import { format } from 'date-fns';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

export default function LogsPage() {
  const [logs, setLogs] = useState<ILog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/logs');
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
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
          <Link href="/dashboard" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {isLoading ? (
              <li className="p-6 text-center text-gray-500">Loading logs...</li>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <li key={String(log._id)} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <p className="font-semibold text-gray-800">{log.action}</p>
                        <div className="flex items-center gap-2 mt-1 sm:mt-0">
                          {log.grade && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Grade {log.grade}
                            </span>
                          )}
                          <p className="text-xs text-gray-400">
                            {format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{log.details}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="p-6 text-center text-gray-500">No logs found.</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
} 