"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjectStore } from '@/store/projectStore';
import { ethers } from "ethers";
import ProjectABI from "@/utils/abi/Project.json";
import dynamic from 'next/dynamic';

// Import markdown editor dynamically to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

interface CreateProposalFormData {
  proposalTitleAndDesc: string;
  votingThreshold: string;
  fundsNeeded: string;
  beginningTime: string;
  endingTime: string;
  voteOnce: boolean;
}

export default function CreateProposalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const getProjectById = useProjectStore(state => state.getProjectById);
  const project = getProjectById(projectId);

  const [formData, setFormData] = useState<CreateProposalFormData>({
    proposalTitleAndDesc: '',
    votingThreshold: '',
    fundsNeeded: '',
    beginningTime: '',
    endingTime: '',
    voteOnce: false
  });

  const [loading, setLoading] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [checkingFounder, setCheckingFounder] = useState(true);
  const [errors, setErrors] = useState<Partial<CreateProposalFormData>>({});
  const [currentInvestedAmount, setCurrentInvestedAmount] = useState<string>("0");
  const [totalVotingTokens, setTotalVotingTokens] = useState<string>("0");

  // Check if current user is the founder and fetch contract limits
  useEffect(() => {
    const checkFounderStatusAndLimits = async () => {
      if (!project?.address) return;
      
      try {
        if (!(window as any).ethereum) {
          router.push(`/startup/${projectId}`);
          return;
        }
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(project.address, ProjectABI, provider);
        const signer = await provider.getSigner();
        const currentUserAddress = await signer.getAddress();
        
        // Check founder status
        const founderAddress = await contract.founder();
        const isFounderCheck = currentUserAddress.toLowerCase() === founderAddress.toLowerCase();
        
        if (!isFounderCheck) {
          // Redirect non-founders back to the project page
          router.push(`/startup/${projectId}`);
          return;
        }
        
        setIsFounder(true);
        
        // Fetch current invested amount and total voting tokens
        try {
          const currentInvestedWei = await contract.currentInvestedAmount();
          const currentInvestedEth = ethers.formatEther(currentInvestedWei);
          setCurrentInvestedAmount(currentInvestedEth);
          
          const totalTokens = await contract.tokenGivenToEveryone();
          setTotalVotingTokens(totalTokens.toString());
        } catch (limitError) {
          console.error("Error fetching contract data:", limitError);
        }
        
      } catch (error) {
        console.error("Error checking founder status:", error);
        router.push(`/startup/${projectId}`);
      } finally {
        setCheckingFounder(false);
      }
    };

    checkFounderStatusAndLimits();
  }, [project?.address, projectId, router]);

  // Helper function to format date to mm/dd/yyyy hh:mm
  const formatDateDisplay = (dateTimeString: string): string => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Partial<CreateProposalFormData> = {};

    if (!formData.proposalTitleAndDesc.trim()) {
      newErrors.proposalTitleAndDesc = 'Title and description are required';
    }

    if (!formData.votingThreshold || Number(formData.votingThreshold) <= 0 || Number(formData.votingThreshold) > Number(totalVotingTokens)) {
      newErrors.votingThreshold = `Voting threshold must be between 1 and ${totalVotingTokens} tokens`;
    }

    if (!formData.fundsNeeded || Number(formData.fundsNeeded) <= 0) {
      newErrors.fundsNeeded = 'Funds needed must be greater than 0';
    }

    // Validate funds needed against current invested amount
    if (formData.fundsNeeded && Number(formData.fundsNeeded) > Number(currentInvestedAmount)) {
      newErrors.fundsNeeded = `Funds needed cannot exceed current invested amount of ${currentInvestedAmount} ETH`;
    }

    if (!formData.beginningTime) {
      newErrors.beginningTime = 'Start time is required';
    }

    if (!formData.endingTime) {
      newErrors.endingTime = 'End time is required';
    }

    if (formData.beginningTime && formData.endingTime) {
      const startTime = new Date(formData.beginningTime).getTime();
      const endTime = new Date(formData.endingTime).getTime();
      const now = Date.now();

      if (startTime <= now) {
        newErrors.beginningTime = 'Start time must be in the future';
      }

      if (endTime <= startTime) {
        newErrors.endingTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (!(window as any).ethereum) {
        throw new Error('MetaMask not found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(project!.address, ProjectABI, signer);

      // Convert times to timestamps
      const beginningTimestamp = Math.floor(new Date(formData.beginningTime).getTime() / 1000);
      const endingTimestamp = Math.floor(new Date(formData.endingTime).getTime() / 1000);

      // Convert funds needed to Wei
      const fundsNeededWei = ethers.parseEther(formData.fundsNeeded);

      // Call the contract function
      const tx = await contract.createProposal(
        formData.proposalTitleAndDesc,
        Number(formData.votingThreshold),
        fundsNeededWei,
        beginningTimestamp,
        endingTimestamp,
        formData.voteOnce
      );

      // Wait for transaction confirmation
      await tx.wait();

      // Navigate back to proposals page
      router.push(`/startup/${projectId}/proposals`);

    } catch (error: any) {
      console.error('Error creating proposal:', error);
      
      // Handle specific errors
      if (error?.reason) {
        alert(`Transaction failed: ${error.reason}`);
      } else if (error?.message?.includes('user rejected')) {
        alert('Transaction was cancelled by user');
      } else {
        alert('Failed to create proposal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with real-time validation feedback
  const handleInputChange = (field: keyof CreateProposalFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    // Real-time validation for specific fields
    if (field === 'fundsNeeded' && typeof value === 'string' && value !== '') {
      const fundsValue = Number(value);
      const investedValue = Number(currentInvestedAmount);
      if (fundsValue > investedValue && investedValue > 0) {
        setErrors(prev => ({
          ...prev,
          fundsNeeded: `Funds needed cannot exceed current invested amount of ${currentInvestedAmount} ETH`
        }));
      }
    }
    
    if (field === 'votingThreshold' && typeof value === 'string' && value !== '') {
      const thresholdValue = Number(value);
      const maxTokens = Number(totalVotingTokens);
      if (thresholdValue > maxTokens && maxTokens > 0) {
        setErrors(prev => ({
          ...prev,
          votingThreshold: `Voting threshold cannot exceed ${totalVotingTokens} tokens`
        }));
      }
    }
  };

  // Loading state while checking founder status
  if (checkingFounder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Checking permissions...</span>
        </div>
      </div>
    );
  }

  // If not founder or project not found, this will be handled by useEffect redirect
  if (!project || !isFounder) {
    return null;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Proposal</h1>
            <p className="text-gray-600">for {project.name}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Title and Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposal Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="proposalTitleAndDesc" className="text-sm font-medium text-gray-700 mb-2 block">
                    Title and Description *
                  </Label>
                  <div className="prose-editor">
                    <MDEditor
                      value={formData.proposalTitleAndDesc}
                      onChange={(value) => handleInputChange('proposalTitleAndDesc', value || '')}
                      preview="live"
                      height={300}
                      data-color-mode="light"
                      visibleDragbar={false}
                    />
                  </div>
                  {errors.proposalTitleAndDesc && (
                    <p className="text-red-500 text-sm mt-1">{errors.proposalTitleAndDesc}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    Use markdown to format your proposal. Include the title and detailed description.
                  </p>
                </div>
              </div>
            </div>

            {/* Voting Configuration */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Voting Configuration</h2>
              
              {/* Important Points */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="text-sm text-yellow-800">
                  <ul className="space-y-1">
                    <li className="flex items-start">
                      <span className="text-yellow-600 font-bold mr-2">*</span>
                      <span>Funds needed cannot exceed the current invested amount</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 font-bold mr-2">*</span>
                      <span>Voting threshold cannot exceed total voting tokens</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="votingThreshold" className="text-sm font-medium text-gray-700 mb-2 block">
                    Voting Threshold (Tokens) *
                  </Label>
                  <Input
                    id="votingThreshold"
                    type="number"
                    min="1"
                    max={totalVotingTokens}
                    value={formData.votingThreshold}
                    onChange={(e) => handleInputChange('votingThreshold', e.target.value)}
                    placeholder="e.g., 50"
                    className={`w-full ${
                      formData.votingThreshold && Number(formData.votingThreshold) > Number(totalVotingTokens) * 0.8
                        ? 'border-yellow-300 focus:border-yellow-500'
                        : ''
                    }`}
                  />
                  {errors.votingThreshold && (
                    <p className="text-red-500 text-sm mt-1">{errors.votingThreshold}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    {totalVotingTokens && (
                      <span className="block text-xs text-blue-600 mt-1">
                        Total minted tokens: {totalVotingTokens}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <Label htmlFor="fundsNeeded" className="text-sm font-medium text-gray-700 mb-2 block">
                    Funds Needed (ETH) *
                  </Label>
                  <Input
                    id="fundsNeeded"
                    type="number"
                    step="0.001"
                    min="0"
                    max={currentInvestedAmount}
                    value={formData.fundsNeeded}
                    onChange={(e) => handleInputChange('fundsNeeded', e.target.value)}
                    placeholder="e.g., 1.5"
                    className={`w-full ${
                      formData.fundsNeeded && Number(formData.fundsNeeded) > Number(currentInvestedAmount) * 0.8
                        ? 'border-yellow-300 focus:border-yellow-500'
                        : ''
                    }`}
                  />
                  {errors.fundsNeeded && (
                    <p className="text-red-500 text-sm mt-1">{errors.fundsNeeded}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">

                    {currentInvestedAmount && (
                      <span className="block text-xs text-blue-600 mt-1">
                        Current invested amount: {currentInvestedAmount} ETH
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Allow only one vote per investor
                    </Label>
                    <p className="text-gray-500 text-xs mt-1">
                      When enabled, each investor can only vote once on this proposal
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('voteOnce', !formData.voteOnce)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.voteOnce ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.voteOnce ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {/* Contract Information */}
            
            </div>

            {/* Timing */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Voting Period</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="beginningTime" className="text-sm font-medium text-gray-700 mb-2 block">
                    Start Date and Time *
                  </Label>
                  <Input
                    id="beginningTime"
                    type="datetime-local"
                    value={formData.beginningTime}
                    onChange={(e) => handleInputChange('beginningTime', e.target.value)}
                    className="w-full"
                  />
                  {errors.beginningTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.beginningTime}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    When voting will begin
                    {formData.beginningTime }
                  </p>
                </div>

                <div>
                  <Label htmlFor="endingTime" className="text-sm font-medium text-gray-700 mb-2 block">
                    End Date and Time *
                  </Label>
                  <Input
                    id="endingTime"
                    type="datetime-local"
                    value={formData.endingTime}
                    onChange={(e) => handleInputChange('endingTime', e.target.value)}
                    className="w-full"
                  />
                  {errors.endingTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.endingTime}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    When voting will end
                    {formData.endingTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/startup/${projectId}/proposals`)}
                className="px-8 py-3 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Proposal'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
