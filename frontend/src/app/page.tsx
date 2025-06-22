
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

export default function Home() {
  const router = useRouter();
  const { currentUser } = useUserStore();

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    } else {
      router.push('/signin');
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
