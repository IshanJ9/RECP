"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

export default function ProtectedRoute({ children, fallback = '/signin' }: ProtectedRouteProps) {
  const router = useRouter();
  const { currentUser } = useUserStore();

  useEffect(() => {
    if (!currentUser) {
      router.push(fallback);
    }
  }, [currentUser, router, fallback]);

  // Show loading or redirect if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
