"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { ethers } from "ethers";
import ProjectABI from "@/utils/abi/Project.json";

export default function StartupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const getProjectById = useProjectStore(state => state.getProjectById);
  const project = getProjectById(projectId);
  
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    if (!project?.address) return;
    
    const calculateTimeRemaining = async () => {
      try {
        if (!(window as any).ethereum) return;
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(project.address, ProjectABI, provider);
        
        // Get start time and duration from contract
        const startTime = await contract.startTime();
        const duration = await contract.duration();
        
        const startTimeMs = Number(startTime) * 1000; // Convert to milliseconds
        const durationMs = Number(duration) * 1000;
        const endTimeMs = startTimeMs + durationMs;
        const currentTimeMs = Date.now();
        
        if (currentTimeMs >= endTimeMs) {
          setTimeRemaining("Project Expired");
          setIsExpired(true);
          return;
        }
        
        const remainingMs = endTimeMs - currentTimeMs;
        
        // Convert to human readable format
        const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeStr = '';
        if (days > 0) timeStr += `${days}d `;
        if (hours > 0) timeStr += `${hours}h `;
        if (minutes > 0) timeStr += `${minutes}m`;
        
        setTimeRemaining(timeStr.trim() || "Less than 1 minute");
        setIsExpired(false);
      } catch (error) {
        console.error("Error calculating time remaining:", error);
        setTimeRemaining("Unable to calculate");
      }
    };
    
    calculateTimeRemaining();
    // Update every minute
    const interval = setInterval(calculateTimeRemaining, 60000);
    
    return () => clearInterval(interval);
  }, [project?.address]);

  // Optionally: fallback to static data or fetch from blockchain if not found
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Project not found</h1>
          <Button onClick={() => router.push('/dashboard')} className="bg-gray-900 hover:bg-black text-white">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            ← Back to Projects
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center">
                <Image src="/placeholder-avatar.png" width={64} height={64} alt="Project avatar" className="rounded-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
                <p className="text-lg text-gray-600 mb-2">by {project.founderName}</p>
                <a
                  href={`https://sepolia.etherscan.io/address/${project.founder}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {project.founder?.slice(0, 6)}...{project.founder?.slice(-4)}
                </a>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`px-4 py-2 rounded-full font-medium ${
                  project.isActive 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {project.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 rounded-full font-medium bg-blue-50 text-blue-700 border-blue-200">
                {project.category}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Description</h2>
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>

            {/* Time Remaining Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Remaining</h2>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-lg ${
                isExpired 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeRemaining}
              </div>
            </div>

            {/* Resources Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resources & Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl">
                  📊 View Analytics
                </Button>
                <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 px-6 py-2 rounded-xl">
                  💬 Join Discord
                </Button>
                <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-xl">
                  📋 View Documents
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Budget</span>
                  <span className="font-semibold text-gray-900">{project.budget} ETH</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">{project.duration}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Proposal Limit</span>
                  <span className="font-semibold text-gray-900">{project.proposalLimit} ETH</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Investment Limit</span>
                  <span className="font-semibold text-gray-900">{project.investmentLimit} ETH</span>
                </div>
              </div>
            </div>

            {/* Contract Info Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Smart Contract</p>
                  <a
                    href={`https://sepolia.etherscan.io/address/${project.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all duration-200 text-sm font-medium w-full justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Etherscan
                  </a>
                </div>
                <div className="text-xs text-gray-500 font-mono bg-gray-50 p-3 rounded-xl break-all">
                  {project.address}
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium"
                  onClick={() => router.push(`/startup/${project.id}/invest`)}
                >
                  💰 Invest in Project
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 py-3 rounded-xl font-medium"
                  onClick={() => router.push(`/startup/${project.id}/proposals`)}
                >
                  🗳️ View Proposals
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}