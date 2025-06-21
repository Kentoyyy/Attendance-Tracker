"use client";

import { useRouter } from "next/navigation";
import { Button } from "./components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGoToDashboard = async () => {
    setIsNavigating(true);
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Dashboard Access',
          details: 'User entered the dashboard.',
        }),
      });
    } catch (error) {
      console.error('Failed to log dashboard access:', error);
    } finally {
      router.push("/dashboard");
    }
  };

  return (
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
            onClick={handleGoToDashboard}
            disabled={isNavigating}
            className="cursor-pointer text-black"
          >
            {isNavigating ? "Entering..." : "Go to Dashboard"} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
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
  );
}