"use client"
import React from 'react';
import { Home, FolderPlus, Settings, Folders, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isExpanded, onToggle }: SidebarProps) => {
  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: FolderPlus, label: 'Create Project', path: '/create-project' },
    { icon: Folders, label: 'Your Projects', path: '/your-projects' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  return (
    <div className="h-full relative">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-white rounded-full p-1 border border-gray-200 hover:bg-gray-100 transition-colors"
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <nav className="h-full pt-4">
        <div className="px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-4 p-2 rounded-lg hover:bg-gray-100 transition-colors mb-2 ${
                  !isExpanded ? 'justify-center' : ''
                }`}
                title={!isExpanded ? item.label : ''}
              >
                <Icon size={20} />
                {isExpanded && (
                  <span className="font-medium transition-opacity duration-300">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;