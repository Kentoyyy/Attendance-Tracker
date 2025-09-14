"use client";

import { useState } from 'react';
import { Button } from "../components/ui/button";
import { ArrowRight, BookOpen, Users, BarChart3, Shield } from "lucide-react";
import LoginModal from '../components/LoginModal';
import { useTheme, getThemeColors } from '../context/ThemeProvider';

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  const handleLoginClick = () => {
    console.log('Login button clicked'); // Debug log
    setIsLoginModalOpen(true);
  };

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Easy Attendance Tracking",
      description: "Mark student attendance with just a few clicks. Simple calendar interface for quick access."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Student Management",
      description: "Organize students by grade, track patterns, and manage student information efficiently."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Detailed Reports",
      description: "Generate comprehensive reports and export data for analysis and record keeping."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Reliable",
      description: "PIN-based authentication and secure data storage to protect student information."
    }
  ];

  return (
    <>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-4 border-b" style={{ borderColor: colors.border, backgroundColor: colors.headerBackground }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <span className="text-xl font-semibold" style={{ color: colors.text }}>Attendance</span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: isDark ? colors.hover : colors.lightButton,
                color: colors.textSecondary
              }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6" style={{ backgroundColor: colors.primary }}>
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6" style={{ color: colors.text }}>
                A Simpler Way to Manage Attendance
              </h1>
              <p className="text-lg sm:text-xl mb-8 leading-relaxed max-w-3xl mx-auto" style={{ color: colors.textSecondary }}>
                Focus on your students, not paperwork. Our attendance system provides a clean, modern, and intuitive
                interface to track attendance, monitor patterns, and keep everything organized.
              </p>
              <button
                onClick={handleLoginClick}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-base font-semibold h-14 px-8 py-4 cursor-pointer transition-all duration-200 border-0 shadow-lg hover:shadow-xl"
                style={{ 
                  backgroundColor: colors.primary, 
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                type="button"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </section>

          {/* Features Section */}
          <section className="px-4 sm:px-6 lg:px-8 py-16" style={{ backgroundColor: colors.cardBackground }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: colors.text }}>
                  Everything You Need
                </h2>
                <p className="text-lg" style={{ color: colors.textSecondary }}>
                  Powerful features designed for modern educators
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-xl border transition-all duration-200 hover:shadow-lg"
                    style={{ 
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4" style={{ color: colors.text }}>
                Ready to Get Started?
              </h2>
              <p className="text-lg mb-8" style={{ color: colors.textSecondary }}>
                Join teachers who are already using our system to streamline their attendance tracking.
              </p>
              <button
                onClick={handleLoginClick}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-base font-semibold h-12 px-8 py-3 cursor-pointer transition-all duration-200 border-0"
                style={{ 
                  backgroundColor: colors.primary, 
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                type="button"
              >
                Proceed to Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t py-8" style={{ borderColor: colors.border, backgroundColor: colors.headerBackground }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                  <span className="text-sm font-bold text-white">A</span>
                </div>
                <span className="text-lg font-semibold" style={{ color: colors.text }}>Attendance Tracker</span>
              </div>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                © 2024 Attendance Tracker. All rights reserved. Made with ❤️ for educators.
              </p>
            </div>
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