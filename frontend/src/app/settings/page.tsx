'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        
        <div className="flex items-center justify-between">
          <span>Theme</span>
          <button 
            onClick={toggleTheme}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          </button>
        </div>
      </div>
    </div>
  );
}
