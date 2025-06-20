"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { ethers } from "ethers";
import ProjectABI from "@/utils/abi/Project.json";
import UserABI from "@/utils/abi/User.json";

const USER_CONTRACT_ADDRESS = "0x6E351c6758458Cd5bb20D263D566B50dDaE488C9";

export default function StartupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const getProjectById = useProjectStore(state => state.getProjectById);
  const project = getProjectById(projectId);
  
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [userInvestment, setUserInvestment] = useState<string>("0");
  const [isInvestmentLoading, setIsInvestmentLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [isInvesting, setIsInvesting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string>("");  const [userName, setUserName] = useState<string>("");
  const [totalRaised, setTotalRaised] = useState<string>("0");
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastFadingOut, setToastFadingOut] = useState(false);

  // Get connected wallet address
  useEffect(() => {
    const getConnectedAddress = async () => {
      try {
        if (!(window as any).ethereum) return;
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0].address);
        }
      } catch (error) {
        console.error("Error getting connected address:", error);
      }
    };

    getConnectedAddress();

    // Listen for account changes
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
        } else {
          setConnectedAddress("");
        }
      });
    }
  }, []);  // Fetch project stats (total raised) even without wallet connection
  useEffect(() => {
    if (!project?.address) {
      setIsLoadingStats(false);
      return;
    }
    
    const fetchProjectStats = async () => {
      try {
        setIsLoadingStats(true);
        if (!(window as any).ethereum) {
          setIsLoadingStats(false);
          return;
        }
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(project.address, ProjectABI, provider);
        
        // Try multiple methods to get total raised amount
        try {
          // Method 1: Try currentInvestedAmount function
          const currentInvestedWei = await contract.currentInvestedAmount();
          const currentInvestedEth = ethers.formatEther(currentInvestedWei);
          setTotalRaised(currentInvestedEth);
          console.log("Got total raised from currentInvestedAmount:", currentInvestedEth);
        } catch (error1) {
          console.log("currentInvestedAmount failed, trying contract balance:", error1);
          try {
            // Method 2: Get contract balance as fallback
            const contractBalance = await provider.getBalance(project.address);
            const balanceEth = ethers.formatEther(contractBalance);
            setTotalRaised(balanceEth);
            console.log("Got total raised from contract balance:", balanceEth);
          } catch (error2) {
            console.error("Both methods failed:", error2);
            setTotalRaised("0");
          }
        }
      } catch (error) {
        console.error("Error fetching project stats:", error);
        setTotalRaised("0");
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchProjectStats();
  }, [project?.address]);
  // Fetch user investment amount and user data
  useEffect(() => {
    if (!project?.address || !connectedAddress) {
      setIsInvestmentLoading(false);
      return;
    }
    
    const fetchUserData = async () => {
      try {
        setIsInvestmentLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(project.address, ProjectABI, provider);
        
        // Get user investment amount
        const investmentWei = await contract.userWallettoAmtInvested(connectedAddress);
        const investmentEth = ethers.formatEther(investmentWei);
        setUserInvestment(investmentEth);

        // Try to get username from User contract
        try {
          const userContract = new ethers.Contract(USER_CONTRACT_ADDRESS, UserABI, provider);
          const userData = await userContract.getUser(connectedAddress);
          setUserName(userData[1]); // username is the second element
        } catch (userError) {
          console.log("User not found in contract, will use 'Anonymous' for investment");
          setUserName("Anonymous");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsInvestmentLoading(false);
      }
    };
    
    fetchUserData();
  }, [project?.address, connectedAddress]);

  // Handle investment
  const handleInvestment = async () => {
    if (!investmentAmount || !connectedAddress || !project?.address) {
      alert("Please enter an investment amount and ensure your wallet is connected");
      return;
    }

    try {
      setIsInvesting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(project.address, ProjectABI, signer);

      // Convert investment amount to wei
      const investmentWei = ethers.parseEther(investmentAmount);

      // Call invest function
      const tx = await contract.invest(userName || "Anonymous", {
        value: investmentWei
      });

      await tx.wait();      // Refresh data after successful investment
      const newInvestmentWei = await contract.userWallettoAmtInvested(connectedAddress);
      const newInvestmentEth = ethers.formatEther(newInvestmentWei);
      setUserInvestment(newInvestmentEth);
      
      // Refresh total raised amount with fallback methods
      try {
        const newTotalRaisedWei = await contract.currentInvestedAmount();
        const newTotalRaisedEth = ethers.formatEther(newTotalRaisedWei);
        setTotalRaised(newTotalRaisedEth);
      } catch (error) {
        console.log("currentInvestedAmount failed after investment, using contract balance");
        try {
          const contractBalance = await provider.getBalance(project.address);
          const balanceEth = ethers.formatEther(contractBalance);
          setTotalRaised(balanceEth);
        } catch (balanceError) {
          console.error("Failed to get contract balance:", balanceError);
        }
      }      setInvestmentAmount("");
      setShowSuccessToast(true);
      setToastFadingOut(false);
      setTimeout(() => {
        setToastFadingOut(true);
        setTimeout(() => setShowSuccessToast(false), 300);
      }, 2700);
    } catch (error: any) {
      console.error("Investment failed:", error);
      alert(`Investment failed: ${error.message || error.reason || "Unknown error"}`);
    } finally {
      setIsInvesting(false);
    }
  };
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
  }  return (
    <div className="min-h-screen bg-gray-50">      {/* Header */}
      <div className="bg-white border-b border-gray-200">        <div className="container mx-auto px-4 sm:px-6 py-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="mb-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg w-10 h-10"
            title="Back to Projects"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center">
                <Image src="/placeholder-avatar.png" width={64} height={64} alt="Project avatar" className="rounded-2xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 break-words">{project.name}</h1>
                <p className="text-base sm:text-lg text-gray-600 mb-2">by {project.founderName}</p>
                <a
                  href={`https://sepolia.etherscan.io/address/${project.founder}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="hidden sm:inline">{project.founder?.slice(0, 6)}...{project.founder?.slice(-4)}</span>
                  <span className="sm:hidden">{project.founder?.slice(0, 4)}...{project.founder?.slice(-2)}</span>
                </a>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Badge 
                variant="outline" 
                className={`px-3 sm:px-4 py-2 rounded-full font-medium ${
                  project.isActive 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {project.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="px-3 sm:px-4 py-2 rounded-full font-medium bg-blue-50 text-blue-700 border-blue-200">
                {project.category}
              </Badge>
            </div>
          </div>
          
          {/* Investment Status Bar */}
          {connectedAddress ? (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl border border-blue-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">Your Investment</h3>
                    {isInvestmentLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-green-600">
                        {parseFloat(userInvestment) > 0 ? `${parseFloat(userInvestment).toFixed(4)} ETH` : "Not invested yet"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 lg:min-w-0">
                  <Input
                    type="number"
                    placeholder="Amount in ETH"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="sm:w-32"
                    step="0.001"
                    min="0"
                    disabled={isExpired}
                  />
                  <Button 
                    onClick={handleInvestment}
                    disabled={isInvesting || !investmentAmount || isExpired || parseFloat(investmentAmount) <= 0}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isInvesting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Investing...
                      </div>
                    ) : isExpired ? (
                      'Project Expired'
                    ) : (
                      '💰 Invest Now'
                    )}
                  </Button>
                </div>
              </div>
              {isExpired && (
                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm text-red-700">⚠️ This project has expired and is no longer accepting investments.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-yellow-800">Connect Wallet to Invest</h3>
                  <p className="text-sm text-yellow-700">Please connect your wallet to view your investment status and invest in this project.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Funding Progress Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Funding Progress</h2>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-gray-600">Total Raised</span>
                    <span className="text-2xl font-bold text-green-600">{parseFloat(totalRaised).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-gray-600">Target Budget</span>
                    <span className="text-lg font-semibold text-gray-900">{project.budget} ETH</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((parseFloat(totalRaised) / parseFloat(project.budget)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {((parseFloat(totalRaised) / parseFloat(project.budget)) * 100).toFixed(1)}% funded
                  </p>
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Description</h2>
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>

            {/* Resources Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resources & Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-xl">
                  📋 View Documents
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Total Raised</span>
                  {isLoadingStats ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="font-semibold text-green-600 text-sm">{parseFloat(totalRaised).toFixed(4)} ETH</span>
                  )}
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Target Budget</span>
                  <span className="font-semibold text-gray-900 text-sm">{project.budget} ETH</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900 text-sm">{project.duration}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Proposal Limit</span>
                  <span className="font-semibold text-gray-900 text-sm">{project.proposalLimit} ETH</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Investment Limit</span>
                  <span className="font-semibold text-gray-900 text-sm">{project.investmentLimit} ETH</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 py-3 rounded-xl font-medium"
                  onClick={() => router.push(`/startup/${project.id}/proposals`)}
                >                  🗳️ View Proposals
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* Success Toast */}
      {showSuccessToast && (
        <div className={`fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${toastFadingOut ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium">Investment successful!</span>
        </div>
      )}
    </div>
  );
}