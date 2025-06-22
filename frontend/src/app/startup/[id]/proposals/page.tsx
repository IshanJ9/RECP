"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/store/projectStore';
import { ethers } from "ethers";
import ProjectABI from "@/utils/abi/Project.json";

interface Proposal {
  proposalId: number;
  proposalTitleAndDesc: string;
  votingThreshold: number;
  fundsNeeded: string;
  beginningTime: number;
  endingTime: number;
  voteOnce: boolean;
  isResultCalculated?: boolean;
}

export default function ProposalsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const getProjectById = useProjectStore(state => state.getProjectById);
  const project = getProjectById(projectId);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFounder, setIsFounder] = useState(false);
  const [userAddress, setUserAddress] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  // Fetch proposals and check if user is founder
  useEffect(() => {
    const fetchProposalsAndCheckFounder = async () => {
      if (!project?.address) return;
      
      try {
        if (!(window as any).ethereum) return;
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(project.address, ProjectABI, provider);
        const signer = await provider.getSigner();
        const currentUserAddress = await signer.getAddress();
        setUserAddress(currentUserAddress);
        
        // Check if current user is the founder
        const founderAddress = await contract.founder();
        setIsFounder(currentUserAddress.toLowerCase() === founderAddress.toLowerCase());
        
        // Get total proposals
        const totalProposals = await contract.totalProposals();
        const proposalsList: Proposal[] = [];
        
        // Fetch each proposal
        for (let i = 1; i <= Number(totalProposals); i++) {
          try {
            const proposal = await contract.proposalIdtoProposal(i);
            const resultCalculated = await contract.proposalToResultCalculated(i);
            
            proposalsList.push({
              proposalId: Number(proposal.proposalId),
              proposalTitleAndDesc: proposal.proposalTitleAndDesc,
              votingThreshold: Number(proposal.votingThreshold),
              fundsNeeded: ethers.formatEther(proposal.fundsNeeded),
              beginningTime: Number(proposal.beginningTime),
              endingTime: Number(proposal.endingTime),
              voteOnce: proposal.voteOnce,
              isResultCalculated: resultCalculated
            });
          } catch (error) {
            console.error(`Error fetching proposal ${i}:`, error);
          }
        }
        
        setProposals(proposalsList);
        
      } catch (error) {
        console.error("Error fetching proposals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposalsAndCheckFounder();
  }, [project?.address]);

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

  // Extract title from proposal content (first line or up to first period/newline)
  const extractTitle = (titleAndDesc: string) => {
    // First try to split by newlines and take the first line
    const lines = titleAndDesc.split('\n');
    const firstLine = lines[0].trim();
    
    // If first line is too short, look for a title-like pattern
    if (firstLine.length < 10 && lines.length > 1) {
      const secondLine = lines[1].trim();
      if (secondLine.length > firstLine.length) {
        return secondLine.length > 80 ? secondLine.substring(0, 80) + '...' : secondLine;
      }
    }
    
    // If still too short or too long, use first sentence or truncate
    if (firstLine.length > 80) {
      const firstSentence = firstLine.split('.')[0];
      return firstSentence.length > 80 ? firstLine.substring(0, 80) + '...' : firstSentence;
    }
    
    return firstLine || `Proposal #${titleAndDesc.substring(0, 30)}...`;
  };

  // Check if proposal is active
  const isProposalActive = (beginningTime: number, endingTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    return now >= beginningTime && now <= endingTime;
  };

  // Check if proposal is awaiting results (ended but results not calculated)
  const isAwaitingResults = (proposal: Proposal) => {
    const now = Math.floor(Date.now() / 1000);
    const hasEnded = now > proposal.endingTime;
    return hasEnded && !proposal.isResultCalculated;
  };

  // Get proposal status
  const getProposalStatus = (proposal: Proposal) => {
    if (isProposalActive(proposal.beginningTime, proposal.endingTime)) {
      return 'Active';
    } else if (isAwaitingResults(proposal)) {
      return 'Awaiting Results';
    } else {
      return 'Inactive';
    }
  };

  // Filter proposals based on selected filter
  const filteredProposals = proposals.filter(proposal => {
    if (selectedFilter === "All") return true;
    return getProposalStatus(proposal) === selectedFilter;
  });

  // Get filter counts
  const filterCounts = {
    All: proposals.length,
    Active: proposals.filter(p => isProposalActive(p.beginningTime, p.endingTime)).length,
    'Awaiting Results': proposals.filter(p => isAwaitingResults(p)).length,
    Inactive: proposals.filter(p => {
      const now = Math.floor(Date.now() / 1000);
      return now > p.endingTime && p.isResultCalculated;
    }).length
  };

  // Function to calculate proposal results
  const handleCalculateResults = async (proposalId: number) => {
    if (!isFounder || !project?.address) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(project.address, ProjectABI, signer);

      // Call calculateProposalResult function
      const tx = await contract.calculateProposalResult(proposalId);
      await tx.wait();

      // Update the proposal in the list to reflect that results have been calculated
      setProposals(prev => prev.map(p => 
        p.proposalId === proposalId 
          ? { ...p, isResultCalculated: true }
          : p
      ));
      
      alert("Proposal results calculated successfully!");

    } catch (error: any) {
      console.error("Calculate results failed:", error);
      alert(`Calculate results failed: ${error.message || error.reason || "Unknown error"}`);
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

  return (
    <div className="min-h-screen bg-gray-50 px-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 rounded-2xl shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/startup/${projectId}`)}
            className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Proposals for {project.name}</h1>
              <p className="text-gray-600">by {project.founderName}</p>
            </div>
            
            {/* Create Proposal Button - Only visible to founder */}
            {isFounder && (
              <Button 
                onClick={() => router.push(`/startup/${projectId}/create-proposal`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Create Proposal
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 py-8">
        {/* Filter Section */}
        {!loading && proposals.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filter Proposals</h3>
              <div className="flex gap-2">
                {Object.entries(filterCounts).map(([filter, count]) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedFilter === filter
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter} ({count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading proposals...</span>
          </div>
        ) : filteredProposals.length === 0 && proposals.length > 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No {selectedFilter} Proposals</h3>
              <p className="text-gray-600 mb-6">
                There are no proposals matching the "{selectedFilter}" filter.
              </p>
              <button
                onClick={() => setSelectedFilter("All")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Proposals
              </button>
            </div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Proposals Yet</h3>
              <p className="text-gray-600 mb-6">
                {isFounder 
                  ? "You haven't created any proposals yet. Create your first proposal to start the decision-making process."
                  : "The project founder hasn't created any proposals yet."
                }
              </p>
              {isFounder && (
                <Button 
                  onClick={() => router.push(`/startup/${projectId}/create-proposal`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
                >
                  Create First Proposal
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedFilter === "All" 
                  ? `All Proposals (${proposals.length})` 
                  : `${selectedFilter} Proposals (${filteredProposals.length})`
                }
              </h2>
            </div>
            
            <div className="grid gap-4 md:gap-6">
              {filteredProposals.map((proposal) => {
                const status = getProposalStatus(proposal);
                const title = extractTitle(proposal.proposalTitleAndDesc);
                
                return (
                  <div key={proposal.proposalId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
                    {/* Header with title and status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{proposal.proposalId}</span>
                          <Badge 
                            variant="outline" 
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              status === 'Active'
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : status === 'Awaiting Results'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {status === 'Active' && (
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            )}
                            {status === 'Awaiting Results' && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                            )}
                            {status}
                          </Badge>
                          {proposal.voteOnce && (
                            <Badge variant="outline" className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border-blue-200">
                              Vote Once
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                          {title}
                        </h3>
                      </div>
                      
                      {/* Result status badge */}
                      {proposal.isResultCalculated && (
                        <Badge variant="outline" className="px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border-purple-200">
                          Results Calculated
                        </Badge>
                      )}
                    </div>
                    
                    {/* Key stats in a compact grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{proposal.fundsNeeded}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">ETH Needed</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{proposal.votingThreshold}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Max Tokens</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-black-700">
                          {formatDate(proposal.beginningTime)}
                        </div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Start Date</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-900">
                          {isProposalActive(proposal.beginningTime, proposal.endingTime) 
                            ? `Ends ${formatDate(proposal.endingTime)}`
                            : ` ${formatDate(proposal.endingTime)}`
                          }
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {isProposalActive(proposal.beginningTime, proposal.endingTime) ? 'Voting Period' : 'End Date'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => router.push(`/startup/${projectId}/proposals/${proposal.proposalId}`)}
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-xl font-medium transition-all"
                      >
                        View Details
                      </Button>
                      {isProposalActive(proposal.beginningTime, proposal.endingTime) && (
                        <Button 
                          onClick={() => router.push(`/startup/${projectId}/proposals/${proposal.proposalId}/vote`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-medium transition-all"
                        >
                          Vote Now
                        </Button>
                      )}
                      {isFounder && Math.floor(Date.now() / 1000) > proposal.endingTime && !proposal.isResultCalculated && (
                        <Button 
                          onClick={() => handleCalculateResults(proposal.proposalId)}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                        >
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          Get Results
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
