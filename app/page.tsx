"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from "./components/ui/button";
import { ArrowRight } from "lucide-react";
import LoginModal from './components/LoginModal';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleCtaClick = () => {
    if (status === 'authenticated') {
      setIsNavigating(true);
     
      const userRole = (session.user as any)?.role;
      const destination = userRole === 'admin' ? '/admin' : '/dashboard';
      router.push(destination);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white text-foreground font-sans">
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-black">
              A Simpler Way to Manage Attendance
            </h1>
            <p className="text-lg text-black mb-8">
              Focus on your students, not paperwork. TeacherMia provides a clean, modern, and intuitive
              interface to track attendance, monitor patterns, and keep everything organized.
            </p>
            <Button
              size="lg"
              onClick={handleCtaClick}
              disabled={isNavigating && status === 'authenticated'}
              className="cursor-pointer bg-gray-900 text-white hover:bg-gray-800"
            >
              {status === 'authenticated'
                ? (isNavigating ? "Entering..." : "Go to Dashboard")
                : "Proceed to Login"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </main>

        <footer className="border-t border-border py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-black">
              © 2025 TeacherMia. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}