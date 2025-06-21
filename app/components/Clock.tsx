"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="text-left sm:text-right">
      <div className="text-xl font-semibold text-gray-800">
        {format(time, 'h:mm:ss a')}
      </div>
      <div className="text-sm text-gray-500">
        {format(time, 'eeee')}
      </div>
    </div>
  );
} 