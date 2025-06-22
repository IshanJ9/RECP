"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/store/userStore';
import { ethers } from "ethers";
import { UserABI } from "@/utils/abi/User";
import ProjectABI from "@/utils/abi/Project.json";
import ProjectFactoryABI from "@/utils/abi/ProjectFactory.json";

const USER_CONTRACT_ADDRESS = "0x6E351c6758458Cd5bb20D263D566B50dDaE488C9";
const PROJECT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROJECT_FACTORY_ADDRESS || "0xeb93f5612E883b38e023b2b1943dEAb0B5395Bfc";

interface Project {
  id: string;
  name: string;
  founderName: string;
  founder: string;
  budget: string;
  duration: string;
  description: string;
  category: string;
  address: string;
  isActive: boolean;
  totalRaised?: string;
  userInvestment?: string;
}

export default function YourProjectsPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [investedProjects, setInvestedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'owned' | 'invested'>('owned');

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

  // Fetch project details by ID
  const fetchProjectDetails = async (projectId: number, projectAddress?: string): Promise<Project | null> => {
    try {
      if (!(window as any).ethereum) return null;

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      let contractAddress = projectAddress;
      
      // If we don't have the project address, get it from the factory
      if (!contractAddress) {
        const factory = new ethers.Contract(PROJECT_FACTORY_ADDRESS, ProjectFactoryABI, provider);
        // @ts-ignore
        contractAddress = await factory.projectIdToAddress(projectId);
        
        if (!contractAddress || contractAddress === ethers.ZeroAddress) {
          return null;
        }
      }

      const contract = new ethers.Contract(contractAddress, ProjectABI, provider);

      // Fetch project data
      const [
        id,
        name,
        founderName,
        founder,
        budget,
        duration,
        description,
        category,
        isActive
      ] = await Promise.all([
        contract.id(),
        contract.name(),
        contract.founderName(),
        contract.founder(),
        contract.budget(),
        contract.duration(),
        contract.description(),
        contract.category(),
        contract.isActive()
      ]);

      // Format duration
      const durationSeconds = Number(duration);
      const years = Math.floor(durationSeconds / (365 * 24 * 60 * 60));
      let remaining = durationSeconds % (365 * 24 * 60 * 60);
      const months = Math.floor(remaining / (30.44 * 24 * 60 * 60));
      remaining = remaining % Math.floor(30.44 * 24 * 60 * 60);
      const days = Math.floor(remaining / (24 * 60 * 60));
      
      let durationStr = '';
      if (years > 0) durationStr += `${years} years `;
      if (months > 0) durationStr += `${months} months `;
      if (days > 0) durationStr += `${days} days`;
      if (!durationStr) durationStr = '0 days';

      const project: Project = {
        id: id.toString(),
        name: name,
        founderName: founderName,
        founder: founder,
        budget: ethers.formatEther(budget),
        duration: durationStr.trim(),
        description: description,
        category: category,
        address: contractAddress,
        isActive: isActive
      };

      return project;
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      return null;
    }
  };

  // Fetch user's projects
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!connectedAddress) return;

      try {
        setLoading(true);
        
        if (!(window as any).ethereum) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const userContract = new ethers.Contract(USER_CONTRACT_ADDRESS, UserABI, provider);

        // Check if user exists
        try {
          const userData = await userContract.getUser(connectedAddress);
          if (userData[0] === ethers.ZeroAddress) {
            console.log("User not found in contract");
            return;
          }
        } catch (error) {
          console.log("User not found in contract");
          return;
        }

        // Get owned and invested project IDs
        const [ownedProjectIds, investedProjectIds] = await Promise.all([
          userContract.getOwnedProjects(connectedAddress),
          userContract.getInvestedProjects(connectedAddress)
        ]);

        console.log("Owned project IDs:", ownedProjectIds);
        console.log("Invested project IDs:", investedProjectIds);

        // Fetch details for owned projects
        const ownedProjectsPromises = ownedProjectIds.map((id: any) => 
          fetchProjectDetails(Number(id))
        );
        const ownedProjectsResults = await Promise.all(ownedProjectsPromises);
        const validOwnedProjects = ownedProjectsResults.filter((p): p is Project => p !== null);

        // Fetch details for invested projects (exclude owned ones)
        const investedProjectsPromises = investedProjectIds
          .filter((id: any) => !ownedProjectIds.some((ownedId: any) => Number(ownedId) === Number(id)))
          .map(async (id: any) => {
            const project = await fetchProjectDetails(Number(id));
            if (project && connectedAddress) {
              // Get user's investment amount
              try {
                const projectContract = new ethers.Contract(project.address, ProjectABI, provider);
                const investmentWei = await projectContract.userWallettoAmtInvested(connectedAddress);
                project.userInvestment = ethers.formatEther(investmentWei);
              } catch (error) {
                console.error("Error fetching user investment:", error);
                project.userInvestment = "0";
              }
            }
            return project;
          });
        
        const investedProjectsResults = await Promise.all(investedProjectsPromises);
        const validInvestedProjects = investedProjectsResults.filter((p): p is Project => p !== null);

        setOwnedProjects(validOwnedProjects);
        setInvestedProjects(validInvestedProjects);

      } catch (error) {
        console.error("Error fetching user projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, [connectedAddress]);

  // Project card component
  const ProjectCard = ({ project, isOwned }: { project: Project; isOwned: boolean }) => (
    <Card className="p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300 cursor-pointer"
          onClick={() => router.push(`/startup/${project.id}`)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
          <p className="text-gray-600 text-sm">by {project.founderName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              project.isActive 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {project.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
            {project.category}
          </Badge>
        </div>
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{project.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-semibold text-gray-900">{parseFloat(project.budget).toFixed(2)} ETH</div>
          <div className="text-xs text-gray-500">Target Budget</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-semibold text-gray-900">{project.duration}</div>
          <div className="text-xs text-gray-500">Duration</div>
        </div>
      </div>

      {!isOwned && project.userInvestment && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-semibold text-blue-700">Your Investment</div>
          <div className="text-lg font-bold text-blue-900">{parseFloat(project.userInvestment).toFixed(4)} ETH</div>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <span className="text-xs text-gray-500 font-mono">{project.address.slice(0, 10)}...{project.address.slice(-8)}</span>
        <Button variant="outline" size="sm" className="text-xs">
          View Details
        </Button>
      </div>
    </Card>
  );

  if (!currentUser || !connectedAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">You need to sign in to view your projects.</p>
          <Button onClick={() => router.push('/signin')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 rounded-2xl shadow-sm mb-8">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h1>
              <p className="text-gray-600">Manage projects you own and track your investments</p>
            </div>
            <Button 
              onClick={() => router.push('/create-project')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
            >
              Create New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container mx-auto px-6 mb-8">
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200 inline-flex">
          <button
            onClick={() => setActiveTab('owned')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'owned'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Projects You Own ({ownedProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('invested')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'invested'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Projects You Invested In ({investedProjects.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading your projects...</span>
          </div>
        ) : (
          <>
            {activeTab === 'owned' && (
              <div>
                {ownedProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 max-w-md mx-auto">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Created</h3>
                      <p className="text-gray-600 mb-6">
                        You haven't created any projects yet. Create your first project to get started!
                      </p>
                      <Button 
                        onClick={() => router.push('/create-project')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
                      >
                        Create First Project
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ownedProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} isOwned={true} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invested' && (
              <div>
                {investedProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 max-w-md mx-auto">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Investments</h3>
                      <p className="text-gray-600 mb-6">
                        You haven't invested in any projects yet. Browse projects to start investing!
                      </p>
                      <Button 
                        onClick={() => router.push('/dashboard')}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium"
                      >
                        Browse Projects
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {investedProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} isOwned={false} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
