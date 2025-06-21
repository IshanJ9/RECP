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

interface ProposalDetails {
  proposalId: number;
  proposalTitleAndDesc: string;
  votingThreshold: number;
  fundsNeeded: string;
  beginningTime: number;
  endingTime: number;
  voteOnce: boolean;
}

interface Vote {
  voterAddress: string;
  tokensUsed: number;
  support: boolean;
  timestamp: number;
}

export default function ProposalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const proposalId = params.proposalId as string;
  const getProjectById = useProjectStore(state => state.getProjectById);
  const project = getProjectById(projectId);

  const [proposal, setProposal] = useState<ProposalDetails | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVotesFor, setTotalVotesFor] = useState(0);
  const [totalVotesAgainst, setTotalVotesAgainst] = useState(0);

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

  // Fetch proposal details and votes
  useEffect(() => {
    const fetchProposalDetails = async () => {
      if (!project?.address || !proposalId) return;
      
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

        // Fetch votes using event logs
        const filter = contract.filters.QVVoteCast(proposalId);
        const events = await contract.queryFilter(filter);
        
        const votesList: Vote[] = [];
        let votesFor = 0;
        let votesAgainst = 0;

        for (const event of events) {
          if ('args' in event && event.args) {
            const [, , tokensUsed, support] = event.args;
            const block = await provider.getBlock(event.blockNumber);
            
            // Get voter address from transaction
            const tx = await provider.getTransaction(event.transactionHash);
            
            const vote: Vote = {
              voterAddress: tx?.from || 'Unknown',
              tokensUsed: Number(tokensUsed),
              support: Boolean(support),
              timestamp: block?.timestamp || 0
            };
            
            votesList.push(vote);
            
            if (vote.support) {
              votesFor += vote.tokensUsed;
            } else {
              votesAgainst += vote.tokensUsed;
            }
          }
        }
        
        // Sort votes by timestamp (newest first)
        votesList.sort((a, b) => b.timestamp - a.timestamp);
        
        setVotes(votesList);
        setTotalVotesFor(votesFor);
        setTotalVotesAgainst(votesAgainst);
        
      } catch (error) {
        console.error("Error fetching proposal details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposalDetails();
  }, [project?.address, proposalId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading proposal details...</span>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/startup/${projectId}/proposals`)}
            className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Proposal #{proposal.proposalId}</h1>
            <p className="text-gray-600">for {project.name}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Proposal Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Proposal Details</h2>
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

          {/* Vote Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Votes</h3>
              <div className="text-3xl font-bold text-gray-900">{votes.length}</div>
              <div className="text-sm text-gray-500">Investors participated</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-green-700 mb-2">Votes For</h3>
              <div className="text-3xl font-bold text-green-700">{totalVotesFor}</div>
              <div className="text-sm text-gray-500">Tokens used</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-red-700 mb-2">Votes Against</h3>
              <div className="text-3xl font-bold text-red-700">{totalVotesAgainst}</div>
              <div className="text-sm text-gray-500">Tokens used</div>
            </div>
          </div>

          {/* Votes List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">All Votes ({votes.length})</h3>
            
            {votes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Votes Yet</h4>
                <p className="text-gray-600">No investors have voted on this proposal yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {votes.map((vote, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-gray-900">{vote.voterAddress}</div>
                          <div className="text-xs text-gray-500">{formatDate(vote.timestamp)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{vote.tokensUsed} tokens</div>
                          <div className="text-xs text-gray-500">Used for voting</div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            vote.support
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {vote.support ? 'For' : 'Against'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
