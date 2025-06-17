"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CreateProjectPage() {
  const router = useRouter();
  
  // Add step state to track which form page we're on
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // Step 1 fields (mandatory)
    name: '',
    founderName: '',
    founder: '',
    budget: '',
    duration: '',
    proposalLimit: '',
    investmentLimit: '',
    
    // Step 2 fields
    tokenName: '',
    tokenSymbol: '',
    supply: '',
    description: '',
    category: '',
    
    // Other existing fields
    fundingStage: '',
    averageProjectTime: '',
    tagline: '',
    detailText: '',
    features: ['', '', '', ''],
    mission: '',
    energyStatus: '',
    projectStatus: 'Not Started'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const updated = {...prev};
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const updated = {...prev};
        delete updated[name];
        return updated;
      });
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    
    setFormData(prevData => ({
      ...prevData,
      features: updatedFeatures
    }));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields for step 1
    const requiredFields = ['name', 'founderName', 'founder', 'budget', 'duration', 'proposalLimit', 'investmentLimit'];
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Validate numeric fields
    ['budget', 'duration', 'proposalLimit', 'investmentLimit'].forEach(field => {
      if (formData[field as keyof typeof formData] && isNaN(Number(formData[field as keyof typeof formData]))) {
        newErrors[field] = 'Must be a number';
      }
    });

    // Validate Ethereum address
    if (formData.founder && !/^0x[a-fA-F0-9]{40}$/.test(formData.founder)) {
      newErrors.founder = 'Must be a valid Ethereum address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields for step 2
    const requiredFields = ['tokenName', 'tokenSymbol', 'supply', 'description', 'category'];
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Validate supply is a number
    if (formData.supply && isNaN(Number(formData.supply))) {
      newErrors.supply = 'Supply must be a number';
    }

    // Validate token symbol (3-4 characters)
    if (formData.tokenSymbol && (formData.tokenSymbol.length < 2 || formData.tokenSymbol.length > 6)) {
      newErrors.tokenSymbol = 'Token symbol should be 2-6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNextStep();
    } else {
      if (validateStep2()) {
        // Here you would typically send the data to an API
        console.log('Form submitted:', formData);
        
        // Navigate to the home page after submission
        router.push('/');
      }
    }
  };

  const categories = ['Solar Energy', 'Wind Energy', 'Hydroelectric', 'Geothermal', 'Biomass', 'Tidal Energy', 'Conventional Energy'];
  const projectStatuses = ['Not Started', 'In Progress', 'On Time', 'Delayed', 'Completed'];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">
        {step === 1 ? 'Create New Project - Basic Information' : 'Project Details'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 ? (
          // Step 1: Mandatory Project Information
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Project Information</h2>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Project Name*
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="founderName" className="block text-sm font-medium mb-1">
                  Founder Name*
                </label>
                <Input
                  id="founderName"
                  name="founderName"
                  value={formData.founderName}
                  onChange={handleChange}
                  className={errors.founderName ? "border-red-500" : ""}
                />
                {errors.founderName && <p className="text-red-500 text-xs mt-1">{errors.founderName}</p>}
              </div>

              

              <div>
                <label htmlFor="budget" className="block text-sm font-medium mb-1">
                  Budget* (in ETH)
                </label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleChange}
                  className={errors.budget ? "border-red-500" : ""}
                />
                {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Project Parameters</h2>
              
              <div>
                <label htmlFor="duration" className="block text-sm font-medium mb-1">
                  Duration* (in days)
                </label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  className={errors.duration ? "border-red-500" : ""}
                />
                {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
              </div>
              
              <div>
                <label htmlFor="proposalLimit" className="block text-sm font-medium mb-1">
                  Proposal Limit* (max proposals)
                </label>
                <Input
                  id="proposalLimit"
                  name="proposalLimit"
                  type="number"
                  value={formData.proposalLimit}
                  onChange={handleChange}
                  className={errors.proposalLimit ? "border-red-500" : ""}
                />
                {errors.proposalLimit && <p className="text-red-500 text-xs mt-1">{errors.proposalLimit}</p>}
              </div>
              
              <div>
                <label htmlFor="investmentLimit" className="block text-sm font-medium mb-1">
                  Investment Limit* (in ETH)
                </label>
                <Input
                  id="investmentLimit"
                  name="investmentLimit"
                  type="number"
                  value={formData.investmentLimit}
                  onChange={handleChange}
                  className={errors.investmentLimit ? "border-red-500" : ""}
                />
                {errors.investmentLimit && <p className="text-red-500 text-xs mt-1">{errors.investmentLimit}</p>}
              </div>
            </div>
          </div>
        ) : (
          // Step 2: Project Token & Details
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Token Information</h2>
              
              <div>
                <label htmlFor="tokenName" className="block text-sm font-medium mb-1">
                  Token Name*
                </label>
                <Input
                  id="tokenName"
                  name="tokenName"
                  value={formData.tokenName}
                  onChange={handleChange}
                  className={errors.tokenName ? "border-red-500" : ""}
                />
                {errors.tokenName && <p className="text-red-500 text-xs mt-1">{errors.tokenName}</p>}
              </div>
              
              <div>
                <label htmlFor="tokenSymbol" className="block text-sm font-medium mb-1">
                  Token Symbol*
                </label>
                <Input
                  id="tokenSymbol"
                  name="tokenSymbol"
                  value={formData.tokenSymbol}
                  onChange={handleChange}
                  className={errors.tokenSymbol ? "border-red-500" : ""}
                  placeholder="e.g. BTC, ETH, etc."
                />
                {errors.tokenSymbol && <p className="text-red-500 text-xs mt-1">{errors.tokenSymbol}</p>}
              </div>
              
              <div>
                <label htmlFor="supply" className="block text-sm font-medium mb-1">
                  Token Supply*
                </label>
                <Input
                  id="supply"
                  name="supply"
                  type="number"
                  value={formData.supply}
                  onChange={handleChange}
                  className={errors.supply ? "border-red-500" : ""}
                />
                {errors.supply && <p className="text-red-500 text-xs mt-1">{errors.supply}</p>}
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Project Details</h2>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Project Description*
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={errors.description ? "border-red-500" : ""}
                  rows={3}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Category*
                </label>
                <Select 
                  name="category"
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
            </div>
          </div>
        )}
        
        {/* Preview section - only show if some data is filled */}
        {(formData.name || formData.tokenName) && (
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            
            <div className="bg-card text-card-foreground p-4 rounded-lg dark:bg-gray-800">
              {formData.name && (
                <div className="mb-4">
                  <h3 className="font-bold text-lg">{formData.name}</h3>
                  {formData.tokenName && formData.tokenSymbol && (
                    <p className="text-sm text-muted-foreground">
                      Token: {formData.tokenName} ({formData.tokenSymbol})
                    </p>
                  )}
                </div>
              )}
              
              {formData.description && (
                <p className="mb-4 text-muted-foreground">{formData.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.category && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    {formData.category}
                  </Badge>
                )}
                {formData.budget && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
                    Budget: {formData.budget} ETH
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Form actions */}
        <div className="flex justify-end gap-4 pt-6">
          {step === 1 ? (
            <>
              <Button type="button" variant="outline" onClick={() => router.push('/startup')}>
                Cancel
              </Button>
              <Button type="button" onClick={handleNextStep}>
                Next: Project Details
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handlePrevStep}>
                Back
              </Button>
              <Button type="submit">
                Create Project
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
