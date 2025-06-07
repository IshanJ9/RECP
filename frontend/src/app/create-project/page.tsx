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
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    fundingStage: '',
    location: '',
    founded: '',
    budget: '',
    averageProjectTime: '',
    founderName: '',
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    const requiredFields = ['name', 'description', 'category', 'fundingStage', 'founderName', 'tagline'];
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Here you would typically send the data to an API
      console.log('Form submitted:', formData);
      
      // For demo purposes, we'll just navigate back to the startups list
      // In a real app, you'd wait for API response before redirecting
      router.push('/startups');
    }
  };

  const categories = ['CleanTech', 'HealthTech', 'FinTech', 'Enterprise', 'EdTech', 'AI/ML'];
  const fundingStages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'];
  const energyStatuses = ['Wind Energy', 'High Priority', 'High Volume', 'Moderate Use', 'Low Energy'];
  const projectStatuses = ['Not Started', 'In Progress', 'On Time', 'Delayed', 'Completed'];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
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
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Short Description*
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
            
            <div>
              <label htmlFor="fundingStage" className="block text-sm font-medium mb-1">
                Funding Stage*
              </label>
              <Select 
                name="fundingStage"
                value={formData.fundingStage}
                onValueChange={(value) => handleSelectChange("fundingStage", value)}
              >
                <SelectTrigger className={errors.fundingStage ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select funding stage" />
                </SelectTrigger>
                <SelectContent>
                  {fundingStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fundingStage && <p className="text-red-500 text-xs mt-1">{errors.fundingStage}</p>}
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Additional Details</h2>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">
                Location
              </label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="founded" className="block text-sm font-medium mb-1">
                Founded Year
              </label>
              <Input
                id="founded"
                name="founded"
                value={formData.founded}
                onChange={handleChange}
                placeholder="e.g., 2023"
              />
            </div>
            
            <div>
              <label htmlFor="budget" className="block text-sm font-medium mb-1">
                Budget
              </label>
              <Input
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="e.g., $5M"
              />
            </div>
            
            <div>
              <label htmlFor="averageProjectTime" className="block text-sm font-medium mb-1">
                Average Project Time
              </label>
              <Input
                id="averageProjectTime"
                name="averageProjectTime"
                value={formData.averageProjectTime}
                onChange={handleChange}
                placeholder="e.g., 6-9 months"
              />
            </div>
          </div>
        </div>
        
        {/* Founder Information */}
        <div className="pt-4 border-t">
          <h2 className="text-xl font-semibold mb-4">Founder Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>
        
        {/* Project Details */}
        <div className="pt-4 border-t">
          <h2 className="text-xl font-semibold mb-4">Project Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="tagline" className="block text-sm font-medium mb-1">
                Tagline* <span className="text-gray-400 text-xs">(Start with "is a..." since it follows the project name)</span>
              </label>
              <Input
                id="tagline"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="is an innovative platform designed for..."
                className={errors.tagline ? "border-red-500" : ""}
              />
              {errors.tagline && <p className="text-red-500 text-xs mt-1">{errors.tagline}</p>}
            </div>
            
            <div>
              <label htmlFor="detailText" className="block text-sm font-medium mb-1">
                Detailed Description
              </label>
              <Textarea
                id="detailText"
                name="detailText"
                value={formData.detailText}
                onChange={handleChange}
                rows={5}
                placeholder="Provide a detailed explanation of your project..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Key Features
              </label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <Input
                    key={index}
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder={`Feature ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="mission" className="block text-sm font-medium mb-1">
                Mission Statement
              </label>
              <Textarea
                id="mission"
                name="mission"
                value={formData.mission}
                onChange={handleChange}
                rows={2}
                placeholder="Our mission is simple: ..."
              />
            </div>
          </div>
        </div>
        
        {/* Status Information */}
        <div className="pt-4 border-t">
          <h2 className="text-xl font-semibold mb-4">Status Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="energyStatus" className="block text-sm font-medium mb-1">
                Energy Status
              </label>
              <Select 
                name="energyStatus"
                value={formData.energyStatus}
                onValueChange={(value) => handleSelectChange("energyStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select energy status" />
                </SelectTrigger>
                <SelectContent>
                  {energyStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="projectStatus" className="block text-sm font-medium mb-1">
                Project Status
              </label>
              <Select 
                name="projectStatus"
                value={formData.projectStatus}
                onValueChange={(value) => handleSelectChange("projectStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project status" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Preview section */}
        <div className="pt-6 border-t">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            {formData.name && (
              <div className="mb-4">
                <h3 className="font-bold text-lg">{formData.name}</h3>
                {formData.tagline && (
                  <p>{formData.name} {formData.tagline}</p>
                )}
              </div>
            )}
            
            {formData.description && (
              <p className="mb-4 text-gray-700">{formData.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.category && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {formData.category}
                </Badge>
              )}
              {formData.fundingStage && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {formData.fundingStage}
                </Badge>
              )}
              {formData.projectStatus && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {formData.projectStatus}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Form actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Button type="button" variant="outline" onClick={() => router.push('/startup')}>
            Cancel
          </Button>
          <Button type="submit">
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
}
