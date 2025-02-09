"use client"
import React from 'react';
import { Home, Users, Settings, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isExpanded, onToggle }: SidebarProps) => {
  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help', path: '/help' }
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
              <a
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
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;