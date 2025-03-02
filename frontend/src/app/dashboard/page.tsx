"use client"
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const StartupsPage = () => {
  const router = useRouter();
  const startups = [
    {
      id: 1,
      name: "EcoTech Solutions",
      description: "Sustainable energy solutions for homes and businesses. Focusing on renewable energy integration and smart grid technologies for a greener future.",
      category: "CleanTech",
      fundingStage: "Series A",
      location: "San Francisco",
      founded: "2022",
      budget: "$5.2M",
      averageProjectTime: "6-9 months"
    },
    {
      id: 2,
      name: "HealthAI",
      description: "AI-powered healthcare diagnostics platform. Leveraging machine learning to provide accurate medical diagnostics and personalized treatment recommendations.",
      category: "HealthTech",
      fundingStage: "Seed",
      location: "Boston",
      founded: "2023",
      budget: "$1.8M",
      averageProjectTime: "3-6 months"
    },
    {
      id: 3,
      name: "FinFlow",
      description: "Next-gen payment processing for small businesses. Streamlining financial operations with innovative blockchain technology and smart contracts.",
      category: "FinTech",
      fundingStage: "Series B",
      location: "New York",
      founded: "2021",
      budget: "$12.5M",
      averageProjectTime: "9-12 months"
    },
    {
      id: 4,
      name: "DataMind",
      description: "Enterprise data analytics platform. Transforming big data into actionable insights through advanced visualization and predictive modeling.",
      category: "Enterprise",
      fundingStage: "Series A",
      location: "Austin",
      founded: "2022",
      budget: "$7.3M",
      averageProjectTime: "6-8 months"
    }
  ];

  const categories = ["All", "CleanTech", "HealthTech", "FinTech", "Enterprise"];
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  

  const filteredStartups = startups.filter(startup => {
    const categoryMatch = selectedCategory === "All" || startup.category === selectedCategory;
    return categoryMatch ;
  });

  const handleViewDetails = (startupId: number) => {
    router.push(`/startup/${startupId}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Innovative Startups</h1>
      
      {/* Filters */}
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
        
      {/* Startup Cards Grid - Modified for vertical layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {filteredStartups.map(startup => (
          <Card key={startup.id} className="hover:shadow-lg transition-shadow flex flex-col h-auto min-h-[300px] w-full">
            <CardHeader className="flex-none">
              <div className="space-y-2">
                <CardTitle className="text-xl font-bold">{startup.name}</CardTitle>
                <Badge variant="secondary">{startup.fundingStage}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div className="space-y-2 mt-2">
                <CardDescription className="text-sm">{startup.description}</CardDescription>
                <Badge variant="outline">{startup.category}</Badge>
              <div className="text-sm text-gray-500">
                  Budget: {startup.budget}
                </div>
                <div className="text-sm text-gray-500">
                  Estimated Time: {startup.averageProjectTime}
                </div>
                {/* <div className="text-sm text-gray-500">
                  Location: {startup.location}
                </div>
                <div className="text-sm text-gray-500">
                  Founded: {startup.founded}
                </div> */}
              </div>
              <Button 
                className="w-full mt-4 bg-black text-white font-bold hover:bg-gray-800"
                variant="outline"
                onClick={() => handleViewDetails(startup.id)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StartupsPage;