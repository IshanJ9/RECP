"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useParams, useSearchParams } from 'next/navigation';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Sample data
const startupsData = [
  {
    id: 1,
    name: "EcoTech Solutions",
    founderName: "Adrian Hajdin",
    twitterHandle: "adrianhajdin",
    category: "CleanTech",
    energyStatus: "Wind Energy",
    projectStatus: "On Time",
  },
  // Add similar data structures for other startups...
];

export default function VotingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const startupId = Number(params.id || searchParams.get('id') || 1);
  
  // Find the selected startup
  const startup = startupsData.find(s => s.id === startupId) || startupsData[0];
  
  const [tokenCount, setTokenCount] = useState("0");
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: false
  });

  const handleOptionSelect = (optionNumber: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionNumber]: !prev[optionNumber]
    }));
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header with founder info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
            <Image src="https://placehold.co/48x48" width={48} height={48} alt="Founder avatar" unoptimized />
          </div>
          <div>
            <h2 className="font-bold">{startup.founderName} - {startup.name}</h2>
            <div className="text-sm text-gray-500">@{startup.twitterHandle}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-pink-100 text-pink-700 rounded-full px-3 py-1">
            {startup.energyStatus}
          </Badge>
          <Badge variant="outline" className="bg-green-100 text-green-700 rounded-full px-3 py-1">
            {startup.projectStatus}
          </Badge>
        </div>
      </div>

      {/* Voting Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Round 1 voting</h2>
          <Badge variant="outline" className="bg-red-100 text-red-700 rounded-full px-3 py-1">
            Live
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Option 1 */}
          <div>
            <div className="flex justify-between mb-1">
              <span>Option 1 48%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '48%' }}></div>
            </div>
          </div>

          {/* Option 2 */}
          <div>
            <div className="flex justify-between mb-1">
              <span>Option 2 27%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full" style={{ width: '27%' }}></div>
            </div>
          </div>

          {/* Option 3 */}
          <div>
            <div className="flex justify-between mb-1">
              <span>Option 3 25%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-300 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Share Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Token share:</h3>
        <div className="flex items-center justify-between mb-6">
          <div className="w-1/3">
            <Select value={tokenCount} onValueChange={setTokenCount}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose number of tokens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 tokens</SelectItem>
                <SelectItem value="500">500 tokens</SelectItem>
                <SelectItem value="1000">1000 tokens</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-500">
            Remaining tokens: 1000
          </div>
        </div>

        {/* Question and Options */}
        <div className="mb-6">
          <p className="font-medium mb-2">Question: To what proposal should we allocate the miscellaneous extra budget from the last phase?</p>
          <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
            <li>Additional investment in research and development (40,700$)</li>
            <li>Appointment of a Project Manager for Phase 2 (35,700$)</li>
            <li>Security optimization (55,700$)</li>
          </ol>
        </div>

        {/* Option Selection */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <div>Option 1:</div>
            <Button 
              variant={selectedOptions[1] ? "default" : "outline"}
              className={`rounded-full px-6 ${selectedOptions[1] ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600'}`}
              onClick={() => handleOptionSelect(1)}
            >
              Select
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div>Option 2:</div>
            <Button 
              variant={selectedOptions[2] ? "default" : "outline"}
              className={`rounded-full px-6 ${selectedOptions[2] ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600'}`}
              onClick={() => handleOptionSelect(2)}
            >
              Select
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div>Option 3:</div>
            <Button 
              variant={selectedOptions[3] ? "default" : "outline"}
              className={`rounded-full px-6 ${selectedOptions[3] ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600'}`}
              onClick={() => handleOptionSelect(3)}
            >
              Select
            </Button>
          </div>
        </div>

        {/* Cast Vote Button */}
        <div className="flex justify-center mb-4">
          <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8">
            Cast vote
          </Button>
        </div>
      </div>

      {/* Voting Guidelines */}
      <div className="mb-10 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Voting guidelines:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>The voting starts at 25 Jan 2025 8 A.M. and ends at 29 Jan 2025 8 P.M.</li>
          <li>Each member will receive 1000 tokens.</li>
          <li>Each option can have a minimum of 2000 tokens and maximum of 10,000 tokens.</li>
          <li>If a member fails to vote during the scheduled time, their participation in the voting round will not be considered.</li>
        </ul>
      </div>
    </div>
  );
}
