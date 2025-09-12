"use client";

import { useState } from 'react';
import { Button } from "../components/ui/button";
import { ArrowRight } from "lucide-react";
import LoginModal from '../components/LoginModal';

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginClick = () => {
    console.log('Login button clicked'); // Debug log
    setIsLoginModalOpen(true);
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
            <button
              onClick={handleLoginClick}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 h-11 px-8 py-2 cursor-pointer transition-colors"
              type="button"
            >
              Proceed to Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </main>

        <footer className="border-t border-border py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-black">
              © 2024 TeacherMia. All rights reserved.
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