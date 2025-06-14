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

const PROJECT_FACTORY_ADDRESS = "0x85aEce15ba6c5743339a3a869c6d636f80AB31aE"; // Replace with your deployed address

const StartupsPage = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All"); // Move this up
  const router = useRouter();

  useEffect(() => {
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
        
        try {          console.log("Factory address:", PROJECT_FACTORY_ADDRESS);
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
            try {              console.log(`Fetching project ${i} address...`);
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
                const duration = await project.duration;
                projectData.duration = duration?.toString?.();
              } catch (error) {
                console.error(`Error fetching duration for project ${i}:`, error);
                projectData.duration = "0";
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
              
              console.log(`Adding project ${i} to list:`, projectData);
              projectsArr.push(projectData);
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
  }, []);

  const categories = ["All", ...Array.from(new Set(projects.map(p => p.category)))];
  const filteredProjects = projects.filter(p => selectedCategory === "All" || p.category === selectedCategory);

  const handleViewDetails = (projectId: string) => {
    router.push(`/startup/${projectId}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Projects</h1>
      <div className="mb-8 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="mr-2"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>
      {loading ? (
        <div>Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow flex flex-col h-auto min-h-[300px] w-full">
              <CardHeader className="flex-none">
                <div className="space-y-2">
                  <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
                  <Badge variant="secondary">Founder: {project.founderName}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div className="space-y-2 mt-2">
                  <CardDescription className="text-sm">{project.description}</CardDescription>
                  <Badge variant="outline">{project.category}</Badge>
                  <div className="text-sm text-gray-500">Budget: {project.budget} ETH</div>
                  <div className="text-sm text-gray-500">Duration: {project.duration} days</div>
                  <div className="text-sm text-gray-500">Proposal Limit: {project.proposalLimit}</div>
                  <div className="text-sm text-gray-500">Investment Limit: {project.investmentLimit} ETH</div>
                  <div className="text-xs text-gray-400">Contract: {project.address}</div>
                </div>
                <Button 
                  className="w-full mt-4 bg-black text-white font-bold hover:bg-gray-800"
                  variant="outline"
                  onClick={() => handleViewDetails(project.id)}
                >
                  View Details
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