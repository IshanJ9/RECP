"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProjectFactoryABI from "@/utils/abi/ProjectFactory.json";
import ProjectABI from "@/utils/abi/Project.json";
import { ethers } from "ethers";

const PROJECT_FACTORY_ADDRESS = "0xeb93f5612E883b38e023b2b1943dEAb0B5395Bfc"; // Replace with your deployed address

export default function CreateProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [deploying, setDeploying] = useState(false);
  const [addingDetails, setAddingDetails] = useState(false);
  const [deployedProjectAddress, setDeployedProjectAddress] = useState("");
  const [formData, setFormData] = useState({
    // Step 1 fields
    name: "",
    founderName: "",
    budget: "",
    duration: "",
    proposalLimit: "",
    investmentLimit: "",
    // Step 2 fields
    tokenName: "",
    tokenSymbol: "",
    supply: "",
    description: "",
    category: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState({
    budget: "ETH",
    proposalLimit: "ETH",
    investmentLimit: "ETH",
  });
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };
  // Helper to get decimals for ethers.parseUnits
  const getDecimals = (u: string) => {
    if (u === "ETH") return 18;
    if (u === "GWEI") return 9;
    if (u === "WEI") return 0;
    return 18;
  };

  // Helper to safely parse units with better decimal handling
  const safeParseUnits = (value: string, unit: string) => {
    try {
      // Ensure we have a valid number
      const numValue = parseFloat(value || "0");
      if (isNaN(numValue) || numValue < 0) {
        return ethers.parseUnits("0", getDecimals(unit));
      }
      // Convert to string with appropriate precision
      const stringValue = numValue.toString();
      return ethers.parseUnits(stringValue, getDecimals(unit));
    } catch (error) {
      console.warn(`Failed to parse ${value} ${unit}, using 0 instead:`, error);
      return ethers.parseUnits("0", getDecimals(unit));
    }
  };

  const handleUnitChange = (field: string, value: string) => {
    setUnit(prev => ({ ...prev, [field]: value }));
  };

  // Deploy project (Step 1)
  const handleDeployProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    setErrors({});
    try {
      if (!(window as any).ethereum) throw new Error("No wallet found");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(
        PROJECT_FACTORY_ADDRESS,
        ProjectFactoryABI,
        signer
      );      // Use parseUnits for conversion with safer parsing
      const tx = await factory.createProject(
        formData.name,
        formData.founderName,
        safeParseUnits(formData.budget, unit.budget),
        Number(formData.duration) * 24 * 60 * 60, // days to seconds
        safeParseUnits(formData.proposalLimit, unit.proposalLimit),
        safeParseUnits(formData.investmentLimit, unit.investmentLimit)
      );
      const receipt = await tx.wait();
      // Get the deployed project address from the event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === "ProjectCreated");
      if (event) {
        const projectId = event.args.projectId;
        const projectAddress = await factory.projectIdToAddress(projectId);
        setDeployedProjectAddress(projectAddress);
        setStep(2);
      } else {
        setErrors({ general: "Could not get deployed project address." });
      }
    } catch (err: any) {
      setErrors({ general: err.message || "Failed to deploy project" });
    } finally {
      setDeploying(false);
    }
  };

  // Add project details (Step 2)
  const handleAddDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingDetails(true);
    setErrors({});
    try {
      if (!(window as any).ethereum) throw new Error("No wallet found");
      if (!deployedProjectAddress) throw new Error("No deployed project address");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const project = new ethers.Contract(
        deployedProjectAddress,
        ProjectABI,
        signer
      );
      // Call addProjectDetails
      const tx = await project.addProjectDetails(
        formData.tokenName,
        formData.tokenSymbol,
        formData.supply,
        formData.description,
        formData.category
      );
      await tx.wait();
      router.push("/dashboard");
    } catch (err: any) {
      setErrors({ general: err.message || "Failed to add project details" });
    } finally {
      setAddingDetails(false);
    }
  };
  // Simple preview
  const Preview = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
      
      {/* Project Card Preview */}
      <div className="bg-gradient-to-br from-gray-50/50 to-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-full">
            {formData.category || 'Category'}
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-1">
          {formData.name || 'Project Name'}
        </h4>
        <p className="text-sm text-gray-500 mb-3">by {formData.founderName || 'Founder'}</p>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {formData.description || 'Project description will appear here...'}
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm font-bold text-gray-900">
              {formData.budget || '0'} {unit.budget}
            </div>
            <div className="text-xs text-gray-500">Budget</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-sm font-bold text-gray-900">
              {formData.duration || '0'} days
            </div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium text-center">
          View Details
        </div>
      </div>

      {/* Project Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">Project Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium text-gray-900">{formData.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Founder:</span>
            <span className="font-medium text-gray-900">{formData.founderName || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Budget:</span>
            <span className="font-medium text-gray-900">{formData.budget || '0'} {unit.budget}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium text-gray-900">{formData.duration || '0'} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Proposal Limit:</span>
            <span className="font-medium text-gray-900">{formData.proposalLimit || '0'} {unit.proposalLimit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Investment Limit:</span>
            <span className="font-medium text-gray-900">{formData.investmentLimit || '0'} {unit.investmentLimit}</span>
          </div>
        </div>

        {step === 2 && (
          <>
            <div className="border-t border-gray-200 pt-3 mt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Token & DAO Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Name:</span>
                  <span className="font-medium text-gray-900">{formData.tokenName || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Symbol:</span>
                  <span className="font-medium text-gray-900">{formData.tokenSymbol || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supply:</span>
                  <span className="font-medium text-gray-900">{formData.supply || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-900">{formData.category || 'Not set'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
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
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">
            {step === 1 ? "Deploy your project smart contract" : "Add project details and create DAO"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Deploy Project Contract</h2>
                      <p className="text-sm text-gray-600">Set up the basic project parameters</p>
                    </div>
                  </div>

                  <form onSubmit={handleDeployProject} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                        <Input 
                          name="name" 
                          placeholder="Enter project name" 
                          value={formData.name} 
                          onChange={handleChange} 
                          required 
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Founder Name</label>
                        <Input 
                          name="founderName" 
                          placeholder="Enter founder name" 
                          value={formData.founderName} 
                          onChange={handleChange} 
                          required 
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-4">                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                          <Input 
                            name="budget" 
                            placeholder="0.01" 
                            value={formData.budget} 
                            onChange={handleChange} 
                            required 
                            type="number" 
                            min="0" 
                            step="any"
                            className="rounded-xl"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                          <select 
                            value={unit.budget} 
                            onChange={e => handleUnitChange("budget", e.target.value)} 
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                          >
                            <option value="ETH">ETH</option>
                            <option value="GWEI">GWEI</option>
                            <option value="WEI">WEI</option>                          </select>
                        </div>
                      </div>
                      
                      {/* Helper text for budget conversion */}
                      {formData.budget && !isNaN(parseFloat(formData.budget)) && parseFloat(formData.budget) > 0 && (
                        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">💡 Conversion Help:</span>
                          </div>
                          <div>
                            {unit.budget === "ETH" && (
                              <span>
                                {formData.budget} ETH = {(parseFloat(formData.budget) * 1e18).toLocaleString()} WEI
                                {parseFloat(formData.budget) < 1 && " • For small amounts, consider using WEI unit"}
                              </span>
                            )}
                            {unit.budget === "GWEI" && (
                              <span>
                                {formData.budget} GWEI = {(parseFloat(formData.budget) * 1e-9).toFixed(9)} ETH = {(parseFloat(formData.budget) * 1e9).toLocaleString()} WEI
                              </span>
                            )}
                            {unit.budget === "WEI" && (
                              <span>
                                {formData.budget} WEI = {(parseFloat(formData.budget) * 1e-18).toFixed(18)} ETH
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                        <Input 
                          name="duration" 
                          placeholder="30" 
                          value={formData.duration} 
                          onChange={handleChange} 
                          required 
                          type="number" 
                          min="1" 
                          className="rounded-xl"
                        />
                      </div>

                      <div className="flex gap-4">                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Proposal Limit</label>
                          <Input 
                            name="proposalLimit" 
                            placeholder="0.01" 
                            value={formData.proposalLimit} 
                            onChange={handleChange} 
                            required 
                            type="number" 
                            min="0" 
                            step="any"
                            className="rounded-xl"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                          <select 
                            value={unit.proposalLimit} 
                            onChange={e => handleUnitChange("proposalLimit", e.target.value)} 
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                          >
                            <option value="ETH">ETH</option>
                            <option value="GWEI">GWEI</option>
                            <option value="WEI">WEI</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-4">                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Investment Limit</label>
                          <Input 
                            name="investmentLimit" 
                            placeholder="0.01" 
                            value={formData.investmentLimit} 
                            onChange={handleChange} 
                            required 
                            type="number" 
                            min="0" 
                            step="any"
                            className="rounded-xl"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                          <select 
                            value={unit.investmentLimit} 
                            onChange={e => handleUnitChange("investmentLimit", e.target.value)} 
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                          >
                            <option value="ETH">ETH</option>
                            <option value="GWEI">GWEI</option>
                            <option value="WEI">WEI</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {errors.general && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {errors.general}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
                      disabled={deploying}
                    >
                      {deploying ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Deploying Contract...
                        </div>
                      ) : (
                        "Deploy Project Contract"
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Project Details & DAO Setup</h2>
                      <p className="text-sm text-gray-600">Configure token and project information</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddDetails} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Token Name</label>
                        <Input 
                          name="tokenName" 
                          placeholder="Project Token" 
                          value={formData.tokenName} 
                          onChange={handleChange} 
                          required 
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Token Symbol</label>
                        <Input 
                          name="tokenSymbol" 
                          placeholder="PTK" 
                          value={formData.tokenSymbol} 
                          onChange={handleChange} 
                          required 
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Token Supply</label>
                      <Input 
                        name="supply" 
                        placeholder="1000" 
                        value={formData.supply} 
                        onChange={handleChange} 
                        required 
                        type="number" 
                        min="1" 
                        className="rounded-xl"
                      />
                    </div>                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                      >
                        <option value="">Select a renewable energy category</option>
                        <option value="Solar Energy">Solar Energy</option>
                        <option value="Wind Energy">Wind Energy</option>
                        <option value="Hydroelectric">Hydroelectric</option>
                        <option value="Geothermal">Geothermal</option>
                        <option value="Biomass">Biomass</option>
                        <option value="Ocean Energy">Ocean Energy</option>
                        <option value="Green Hydrogen">Green Hydrogen</option>
                        <option value="Energy Storage">Energy Storage</option>
                        <option value="Smart Grid">Smart Grid</option>
                        <option value="Carbon Capture">Carbon Capture</option>
                        <option value="Sustainable Transport">Sustainable Transport</option>
                        <option value="Energy Efficiency">Energy Efficiency</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea 
                        name="description" 
                        placeholder="Describe your project and its goals..." 
                        value={formData.description} 
                        onChange={handleChange} 
                        required 
                        rows={4}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 resize-none"
                      />
                    </div>

                    {errors.general && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {errors.general}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
                      disabled={addingDetails}
                    >
                      {addingDetails ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating DAO...
                        </div>
                      ) : (
                        "Complete Project Setup"
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Preview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
