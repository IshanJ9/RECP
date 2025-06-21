"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/store/projectStore';
import { ethers } from "ethers";
import ProjectABI from "@/utils/abi/Project.json";
import dynamic from 'next/dynamic';

// Import markdown preview component dynamically
const MarkdownPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

interface Proposal {
  proposalId: number;
  proposalTitleAndDesc: string;
  votingThreshold: number;
  fundsNeeded: string;
  beginningTime: number;
  endingTime: number;
  voteOnce: boolean;
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
            proposalsList.push({
              proposalId: Number(proposal.proposalId),
              proposalTitleAndDesc: proposal.proposalTitleAndDesc,
              votingThreshold: Number(proposal.votingThreshold),
              fundsNeeded: ethers.formatEther(proposal.fundsNeeded),
              beginningTime: Number(proposal.beginningTime),
              endingTime: Number(proposal.endingTime),
              voteOnce: proposal.voteOnce
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

  // Check if proposal is active
  const isProposalActive = (beginningTime: number, endingTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    return now >= beginningTime && now <= endingTime;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
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
      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading proposals...</span>
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
                All Proposals ({proposals.length})
              </h2>
            </div>
            
            <div className="grid gap-6">
              {proposals.map((proposal) => (
                <div key={proposal.proposalId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Proposal #{proposal.proposalId}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isProposalActive(proposal.beginningTime, proposal.endingTime)
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {isProposalActive(proposal.beginningTime, proposal.endingTime) ? 'Active' : 'Ended'}
                        </Badge>
                        {proposal.voteOnce && (
                          <Badge variant="outline" className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border-blue-200">
                            Vote Once
                          </Badge>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-700 mb-4">
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
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push(`/startup/${projectId}/proposals/${proposal.proposalId}`)}
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-xl font-medium"
                    >
                      View Details
                    </Button>
                    {isProposalActive(proposal.beginningTime, proposal.endingTime) && (
                      <Button 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-medium"
                      >
                        Vote Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
