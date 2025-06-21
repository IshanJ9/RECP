"use client"
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ethers } from "ethers";
import { formatEther } from "ethers";
import ProjectFactoryABI from "@/utils/abi/ProjectFactory.json";
import ProjectABI from "@/utils/abi/Project.json";
import { useProjectStore } from '@/store/projectStore';

const PROJECT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROJECT_FACTORY_ADDRESS || "0xeb93f5612E883b38e023b2b1943dEAb0B5395Bfc";

const StartupsPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copyTooltips, setCopyTooltips] = useState<{[key: string]: string}>({});
  const [showTooltips, setShowTooltips] = useState<{[key: string]: boolean}>({});  const router = useRouter();
  const projects = useProjectStore(state => state.projects);
  const setProjects = useProjectStore(state => state.setProjects);

  // Initialize tooltips for each project
  useEffect(() => {
    if (projects.length > 0) {
      const initialTooltips: {[key: string]: string} = {};
      const initialShowStates: {[key: string]: boolean} = {};
      
      projects.forEach(project => {
        initialTooltips[project.id] = "Copy address";
        initialShowStates[project.id] = false;
      });
      
      setCopyTooltips(initialTooltips);
      setShowTooltips(initialShowStates);
    }
  }, [projects]);

  // Copy to clipboard function
  const copyAddress = async (projectId: string, address: string) => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopyTooltips(prev => ({ ...prev, [projectId]: "Copied!" }));
      setShowTooltips(prev => ({ ...prev, [projectId]: false }));
      setTimeout(() => {
        setShowTooltips(prev => ({ ...prev, [projectId]: true }));
        setTimeout(() => {
          setCopyTooltips(prev => ({ ...prev, [projectId]: "Copy address" }));
          setShowTooltips(prev => ({ ...prev, [projectId]: false }));
        }, 2000);
      }, 10);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyTooltips(prev => ({ ...prev, [projectId]: "Copied!" }));
      setShowTooltips(prev => ({ ...prev, [projectId]: false }));
      setTimeout(() => {
        setShowTooltips(prev => ({ ...prev, [projectId]: true }));
        setTimeout(() => {
          setCopyTooltips(prev => ({ ...prev, [projectId]: "Copy address" }));
          setShowTooltips(prev => ({ ...prev, [projectId]: false }));
        }, 2000);
      }, 10);
    }
  };

  useEffect(() => {
    if (projects.length > 0) {
      setLoading(false);
      return;
    }
    const fetchProjects = async () => {
      try {
        if (!(window as any).ethereum) {
          console.log("No ethereum object found. Are you using a wallet like MetaMask?");
          return;
        }
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        try {
          await provider.send("eth_requestAccounts", []); // Request wallet connection
        } catch (walletError) {
          console.error("Failed to connect to wallet:", walletError);
        }
        
        try {          
          console.log("Factory address:", PROJECT_FACTORY_ADDRESS);
          const factory = new ethers.Contract(
            PROJECT_FACTORY_ADDRESS, 
            ProjectFactoryABI, 
            provider
          );
          
          const signer = await provider.getSigner();
          // @ts-ignore - TypeScript doesn't know about our contract methods
          const connectedFactory = factory.connect(signer);
            console.log("Getting number of projects...");
          // @ts-ignore - TypeScript doesn't know about our contract methods
          const numProjects = await connectedFactory.getNumberOfProjects();
          console.log("Number of projects:", numProjects);
          
          const projectsArr = [];
          
          for (let i = 1; i <= numProjects; i++) {
            try {              
              console.log(`Fetching project ${i} address...`);
              // @ts-ignore - TypeScript doesn't know about our contract methods
              const projectAddr = await connectedFactory.projectIdToAddress(i);
              console.log(`Project ${i} address:`, projectAddr);
              
              if (!projectAddr || projectAddr === ethers.ZeroAddress) {
                console.warn(`Project address ${i} is invalid or zero address, skipping`);
                continue;
              }
              
              const project = new ethers.Contract(projectAddr, ProjectABI, signer);
              
              // Fetch each property individually with error handling
              const projectData: Record<string, any> = { address: projectAddr };
              
              try {
                projectData.id = await project.id();
                console.log(`Project ${i} ID:`, projectData.id);
              } catch (error) {
                console.error(`Error fetching ID for project ${i}:`, error);
              }
              
              try {
                projectData.name = await project.name();
                console.log(`Project ${i} name:`, projectData.name);
              } catch (error) {
                console.error(`Error fetching name for project ${i}:`, error);
                projectData.name = `Project ${i}`;
              }
              
              try {
                projectData.founderName = await project.founderName();
              } catch (error) {
                console.error(`Error fetching founderName for project ${i}:`, error);
                projectData.founderName = "Unknown";
              }
              
              try {
                projectData.founder = await project.founder();
              } catch (error) {
                console.error(`Error fetching founder for project ${i}:`, error);
              }
              
              try {
                const budget = await project.budget();
                projectData.budget = budget._isBigNumber ? formatEther(budget) : budget?.toString?.();
              } catch (error) {
                console.error(`Error fetching budget for project ${i}:`, error);
                projectData.budget = "0";
              }
              
              try { 
                let durationSeconds = await project.duration();
                if (durationSeconds?._isBigNumber) durationSeconds = durationSeconds.toString();
                durationSeconds = Number(durationSeconds);
                // Convert seconds to years, months, days (using average month = 30.44 days)
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
                projectData.duration = durationStr.trim();
              } catch (error) {
                console.error(`Error fetching duration for project ${i}:`, error);
                projectData.duration = "0 days";
              }
              
              try {
                const proposalLimit = await project.proposalLimit();
                projectData.proposalLimit = proposalLimit?.toString?.();
              } catch (error) {
                console.error(`Error fetching proposalLimit for project ${i}:`, error);
                projectData.proposalLimit = "0";
              }
              
              try {
                const investmentLimit = await project.investmentLimit();
                projectData.investmentLimit = investmentLimit._isBigNumber ? formatEther(investmentLimit) : investmentLimit?.toString?.();
              } catch (error) {
                console.error(`Error fetching investmentLimit for project ${i}:`, error);
                projectData.investmentLimit = "0";
              }
              
              try {
                projectData.description = await project.description();
              } catch (error) {
                console.error(`Error fetching description for project ${i}:`, error);
                projectData.description = "No description available";
              }
                try {
                projectData.category = await project.category();
              } catch (error) {
                console.error(`Error fetching category for project ${i}:`, error);
                projectData.category = "Other";
              }
              
              try {
                projectData.isActive = await project.isActive();
              } catch (error) {
                console.error(`Error fetching isActive for project ${i}:`, error);
                projectData.isActive = true; // Default to active if we can't fetch
              }
                console.log(`Adding project ${i} to list:`, projectData);
              // Ensure all required fields are present and string-typed for Zustand store
              // Convert values from wei to ETH (divide by 1e18)
              projectsArr.push({
                id: projectData.id?.toString?.() ?? String(i),
                name: projectData.name ?? `Project ${i}`,
                founderName: projectData.founderName ?? "Unknown",
                founder: projectData.founder ?? "",
                budget: projectData.budget ? (Number(projectData.budget) / 1e18).toString() : "0",
                duration: projectData.duration?.toString?.() ?? "0",
                proposalLimit: projectData.proposalLimit ? (Number(projectData.proposalLimit) / 1e18).toString() : "0",
                investmentLimit: projectData.investmentLimit ? (Number(projectData.investmentLimit) / 1e18).toString() : "0",
                description: projectData.description ?? "No description available",
                category: projectData.category ?? "Other",
                address: projectData.address ?? "",
                isActive: projectData.isActive ?? true,
              });
            } catch (projectError) {
              console.error(`Error processing project ${i}:`, projectError);
            }
          }
          
          console.log("All projects:", projectsArr);
          setProjects(projectsArr);
        } catch (contractError) {
          console.error("Error interacting with contract:", contractError);
        }
      } catch (e) {
        console.error('Global error in fetchProjects:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [projects.length, setProjects]);
  // Default renewable energy categories
  const defaultCategories = [
    "All",
    "Solar Energy",
    "Wind Energy", 
    "Hydroelectric",
    "Geothermal",
    "Biomass",
    "Ocean Energy",
    "Green Hydrogen",
    "Energy Storage",
    "Smart Grid",
    "Carbon Capture",
    "Sustainable Transport",
    "Energy Efficiency"
  ];
  
  // Combine default categories with any additional categories from projects
  const projectCategories = Array.from(new Set(projects.map(p => p.category)));
  const additionalCategories = projectCategories.filter(cat => !defaultCategories.includes(cat));
  const categories = [...defaultCategories, ...additionalCategories];
  
  const filteredProjects = projects.filter(p => selectedCategory === "All" || p.category === selectedCategory);

  const handleViewDetails = (projectId: string) => {
    router.push(`/startup/${projectId}`);
  };
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Projects</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">Filter:</span>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div>Loading projects...</div>
      ) : (        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Card key={project.id} className="group relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl">
              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white"></div>
              
              <CardContent className="relative p-6 h-full flex flex-col">
                {/* Header section */}                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border-gray-200 rounded-full">
                      {project.category}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${project.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
                    {project.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 font-medium">by {project.founderName}</p>
                </div>

                {/* Description */}
                <CardDescription className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-2 flex-grow">
                  {project.description}
                </CardDescription>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-lg font-bold text-gray-900">{project.budget}</div>
                    <div className="text-xs text-gray-500">Budget (ETH)</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-lg font-bold text-gray-900">{project.duration}</div>
                    <div className="text-xs text-gray-500">Duration</div>
                  </div>
                </div>                {/* Contract address */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://sepolia.etherscan.io/address/${project.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {project.address?.slice(0, 6)}...{project.address?.slice(-4)}
                    </a>
                    
                    <div className="relative">
                      <button
                        onClick={() => copyAddress(project.id, project.address)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200"
                        disabled={!project.address}
                        onMouseEnter={() => setShowTooltips(prev => ({ ...prev, [project.id]: true }))}
                        onMouseLeave={() => setShowTooltips(prev => ({ ...prev, [project.id]: false }))}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      {showTooltips[project.id] && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20">
                          {copyTooltips[project.id] || "Copy address"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <Button 
                  className="w-full bg-gray-900 hover:bg-black text-white font-medium py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => handleViewDetails(project.id)}
                >
                  View Details
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StartupsPage;