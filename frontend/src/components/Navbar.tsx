"use client"
import React, { useState, useEffect } from 'react';
import {Search, User, LogOut } from 'lucide-react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();
  const { currentUser, clearUser } = useUserStore();

  const handleSignOut = () => {
    clearUser();
    router.push('/signin');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-50">
      {/* Left section - Brand/Logo */}
      <div className="flex items-center ml-4 space-x-3">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-8 h-8 md:w-8 md:h-8 object-contain" />
        <span className="text-xl font-semibold">ETH Town</span>
      </div>

      {/* Center section - Search */}
      <div className={`flex-1 max-w-2xl mx-4 ${isSearchOpen ? 'block' : 'hidden md:block'}`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 pl-10"
          />
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20}
          />
        </div>
      </div>

      {/* Right section - User Actions */}
      <div className="flex items-center space-x-4">
        <button 
          className="md:hidden"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Search size={20} />
        </button>

        {currentUser ? (
          /* Signed in user */
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <img 
                src={currentUser.userProfile || "/placeholder-avatar.png"} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {currentUser.name}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut size={16} />
              <span className="hidden md:inline ml-1">Sign Out</span>
            </Button>
          </div>
        ) : (
          /* Not signed in */
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/signin')}
              className="text-gray-600 hover:text-gray-900"
            >
              <User size={16} />
              <span className="hidden md:inline ml-1">Sign In</span>
            </Button>
            <Button 
              size="sm"
              onClick={() => router.push('/signup')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;