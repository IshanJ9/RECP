"use client"
import React, { useState } from 'react';
import {Search, User } from 'lucide-react';
import Image from "next/image";
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-50">
      {/* Left section - Brand/Logo */}
      <div className="flex items-center ml-4 space-x-3">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-8 h-8 md:w-8 md:h-8 object-contain" />
        <span className="text-xl font-semibold">Your Brand</span>
      </div>

      {/* Center section - Search */}
      <div className={`flex-1 max-w-2xl mx-4 ${isSearchOpen ? 'block' : 'hidden md:block'}`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 pl-10"
          />
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20}
          />
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center space-x-4">
        <button 
          className="md:hidden"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Search size={20} />
        </button>

      <ConnectButton
        label="Sign in"
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
        showBalance={false}
        chainStatus="icon"
      />
      </div>
    </nav>
  );
};

export default Navbar;