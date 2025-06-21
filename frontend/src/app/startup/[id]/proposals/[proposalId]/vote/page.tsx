"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useProjectStore } from '@/store/projectStore';
import { ethers } from "ethers";
import ProjectABI from "@/utils/abi/Project.json";
import VotingTokensABI from "@/utils/abi/VotingTokens.json";
import dynamic from 'next/dynamic';

// Import markdown preview component dynamically
const MarkdownPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

interface ProposalDetails {
  proposalId: number;
  proposalTitleAndDesc: string;
  votingThreshold: number;
  fundsNeeded: string;
  beginningTime: number;
  endingTime: number;
  voteOnce: boolean;
}

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const proposalId = params.proposalId as string;
  const getProjectById = useProjectStore(state => state.getProjectById);
  const project = getProjectById(projectId);

  const [proposal, setProposal] = useState<ProposalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [tokensToUse, setTokensToUse] = useState<string>("");
  const [selectedVote, setSelectedVote] = useState<boolean | null>(null);
  const [userTokenBalance, setUserTokenBalance] = useState<string>("0");
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if proposal is active
  const isProposalActive = (beginningTime: number, endingTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    return now >= beginningTime && now <= endingTime;
  };

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
  }, []);

  // Fetch proposal details and user voting status
  useEffect(() => {
    const fetchProposalAndUserData = async () => {
      if (!project?.address || !proposalId || !connectedAddress) return;
      
      try {
        if (!(window as any).ethereum) return;
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(project.address, ProjectABI, provider);
        
        // Fetch proposal details
        const proposalData = await contract.proposalIdtoProposal(proposalId);
        const proposalDetails: ProposalDetails = {
          proposalId: Number(proposalData.proposalId),
          proposalTitleAndDesc: proposalData.proposalTitleAndDesc,
          votingThreshold: Number(proposalData.votingThreshold),
          fundsNeeded: ethers.formatEther(proposalData.fundsNeeded),
          beginningTime: Number(proposalData.beginningTime),
          endingTime: Number(proposalData.endingTime),
          voteOnce: proposalData.voteOnce
        };
        setProposal(proposalDetails);

        // Get user's token balance
        const tokenBalance = await contract.getBalanceOfTokens(connectedAddress);
        setUserTokenBalance(ethers.formatEther(tokenBalance));

        // Check if user has already voted (if voteOnce is true)
        if (proposalDetails.voteOnce) {
          const userWalletToUserId = await contract.userWallettoUserId(connectedAddress);
          if (userWalletToUserId > 0) {
            const hasVoted = await contract.hasVoted(userWalletToUserId, proposalId);
            setHasAlreadyVoted(hasVoted);
          }
        }
        
      } catch (error) {
        console.error("Error fetching proposal details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposalAndUserData();
  }, [project?.address, proposalId, connectedAddress]);

  // Handle vote submission
  const handleVote = async () => {
    if (!proposal || !connectedAddress || !project?.address || selectedVote === null || !tokensToUse) {
      alert("Please select a vote option and enter the number of tokens to use");
      return;
    }

    if (parseFloat(tokensToUse) <= 0) {
      alert("Please enter a valid number of tokens");
      return;
    }

    if (parseFloat(tokensToUse) > parseFloat(userTokenBalance)) {
      alert("You don't have enough tokens");
      return;
    }

    if (parseFloat(tokensToUse) > proposal.votingThreshold) {
      alert(`You cannot use more than ${proposal.votingThreshold} tokens for this proposal`);
      return;
    }

    try {
      setIsVoting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(project.address, ProjectABI, signer);


      // Call castVote function
      const tx = await contract.castVote(proposalId, tokensToUse, selectedVote);
      await tx.wait();

      // Show success message
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      // Redirect back to proposal details after a short delay
      setTimeout(() => {
        router.push(`/startup/${projectId}/proposals/${proposalId}`);
      }, 2000);

    } catch (error: any) {
      console.error("Vote failed:", error);
      alert(`Vote failed: ${error.message || error.reason || "Unknown error"}`);
    } finally {
      setIsVoting(false);
    }
  };

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

  if (!connectedAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">Please connect your wallet to vote on this proposal</p>
          <Button onClick={() => router.push(`/startup/${projectId}/proposals/${proposalId}`)} className="bg-gray-900 hover:bg-black text-white">
            Back to Proposal
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading proposal...</span>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Proposal not found</h1>
          <Button onClick={() => router.push(`/startup/${projectId}/proposals`)} className="bg-gray-900 hover:bg-black text-white">
            Back to Proposals
          </Button>
        </div>
      </div>
    );
  }

  const isActive = isProposalActive(proposal.beginningTime, proposal.endingTime);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/startup/${projectId}/proposals/${proposalId}`)}
            className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vote on Proposal #{proposal.proposalId}</h1>
            <p className="text-gray-600">for {project.name}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Proposal Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Proposal Summary</h2>
              <Badge 
                variant="outline" 
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                {isActive ? 'Active' : 'Ended'}
              </Badge>
              {proposal.voteOnce && (
                <Badge variant="outline" className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border-blue-200">
                  Vote Once
                </Badge>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none text-gray-700 mb-6">
              <MarkdownPreview 
                source={proposal.proposalTitleAndDesc} 
                style={{ 
                  whiteSpace: 'pre-wrap',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{proposal.fundsNeeded} ETH</div>
                <div className="text-xs text-gray-500">Funds Needed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{proposal.votingThreshold} tokens</div>
                <div className="text-xs text-gray-500">Max Voting Tokens</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{formatDate(proposal.beginningTime)}</div>
                <div className="text-xs text-gray-500">Start Date</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{formatDate(proposal.endingTime)}</div>
                <div className="text-xs text-gray-500">End Date</div>
              </div>
            </div>
          </div>

          {/* Voting Section */}
          {!isActive ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Voting Period Ended</h3>
                <p className="text-gray-600">This proposal is no longer accepting votes.</p>
              </div>
            </div>
          ) : hasAlreadyVoted ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Already Voted</h3>
                <p className="text-gray-600">You have already voted on this proposal.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Cast Your Vote</h2>
              
              {/* User Token Balance */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Your Token Balance:</span>
                  <span className="text-lg font-bold text-blue-900">{parseFloat(userTokenBalance).toFixed(4)} tokens</span>
                </div>
              </div>

              {/* Vote Options */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select your vote:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedVote(true)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      selectedVote === true
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold">Vote YES</h4>
                      <p className="text-sm text-gray-600">Support this proposal</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedVote(false)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      selectedVote === false
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold">Vote NO</h4>
                      <p className="text-sm text-gray-600">Oppose this proposal</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Token Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of tokens to use for voting:
                </label>
                <Input
                  type="number"
                  placeholder="Enter tokens to use"
                  value={tokensToUse}
                  onChange={(e) => setTokensToUse(e.target.value)}
                  className="w-full"
                  step="0.001"
                  min="0"
                  max={Math.min(Number(userTokenBalance), proposal.votingThreshold).toString()}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum: {Math.min(Number(userTokenBalance), proposal.votingThreshold).toFixed(4)} tokens
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleVote}
                disabled={isVoting || selectedVote === null || !tokensToUse || parseFloat(tokensToUse) <= 0}
                className={`w-full py-3 rounded-xl font-medium text-white ${
                  selectedVote === true
                    ? 'bg-green-600 hover:bg-green-700'
                    : selectedVote === false
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isVoting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting Vote...
                  </div>
                ) : selectedVote === true ? (
                  `Vote YES with ${tokensToUse || '0'} tokens`
                ) : selectedVote === false ? (
                  `Vote NO with ${tokensToUse || '0'} tokens`
                ) : (
                  'Select a vote option'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium">Vote submitted successfully!</span>
        </div>
      )}
    </div>
  );
}
