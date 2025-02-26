"use client"

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';

// This would eventually come from an API or database
const startupsData = [
  {
    id: 1,
    name: "EcoTech Solutions",
    description: "Sustainable energy solutions for homes and businesses. Focusing on renewable energy integration and smart grid technologies for a greener future.",
    category: "CleanTech",
    fundingStage: "Series A",
    location: "San Francisco",
    founded: "2022",
    budget: "$5.2M",
    averageProjectTime: "6-9 months",
    founderName: "Sarah Chen",
    tagline: "is an innovative clean energy platform designed for eco-conscious customers looking to make a positive environmental impact with their energy choices.",
    detailText: "We connect users with local renewable energy providers that offer eco-friendly, sustainable solutions across categories like solar, wind, and geothermal energy.\n\nBy partnering with small and medium-sized enterprises committed to sustainability, we aim to reduce carbon footprints and promote greener consumer choices.",
    features: [
      "Ethically sourced and environmentally responsible products",
      "Carbon offset tracking",
      "Green certifications",
      "Personalized sustainability goals"
    ],
    mission: "Our mission is simple: Power better, live better, and create a greener world—one purchase at a time.",
    energyStatus: "Wind Energy",
    projectStatus: "On Time"
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
    averageProjectTime: "3-6 months",
    founderName: "Michael Lee",
    tagline: "is an AI-powered diagnostics platform designed for healthcare professionals looking to enhance patient outcomes through technology.",
    detailText: "We connect doctors with cutting-edge diagnostic tools that offer accurate, timely insights across specialties like cardiology, neurology, and oncology.\n\nBy leveraging machine learning and vast medical datasets, we aim to improve diagnostic accuracy and promote personalized medicine approaches.",
    features: [
      "AI-powered diagnostic suggestions",
      "Patient history analysis",
      "Treatment recommendation engine",
      "Outcome prediction models"
    ],
    mission: "Our mission is simple: Diagnose better, treat better, and create a healthier world—one patient at a time.",
    energyStatus: "High Priority",
    projectStatus: "In Progress"
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
    averageProjectTime: "9-12 months",
    founderName: "Jessica Morgan",
    tagline: "is a next-gen financial platform designed for small businesses looking to streamline their payment operations.",
    detailText: "We connect businesses with innovative payment solutions that offer secure, fast, and transparent transactions across both traditional and cryptocurrency channels.\n\nBy implementing blockchain technology and smart contracts, we aim to reduce transaction costs and promote financial inclusion for all businesses.",
    features: [
      "Secure blockchain transactions",
      "Smart contract automation",
      "Cross-border payment optimization",
      "Detailed financial analytics"
    ],
    mission: "Our mission is simple: Pay better, grow better, and create a more financially inclusive world—one transaction at a time.",
    energyStatus: "High Volume",
    projectStatus: "On Time"
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
    averageProjectTime: "6-8 months",
    founderName: "Alex Wilson",
    tagline: "is an enterprise analytics platform designed for businesses looking to transform their data into actionable insights.",
    detailText: "We connect organizations with powerful analytical tools that offer deep insights across departments like marketing, operations, and finance.\n\nBy harnessing the power of machine learning and predictive analytics, we aim to uncover hidden patterns and promote data-driven decision making.",
    features: [
      "Real-time data visualization",
      "Predictive analytics models",
      "Automated insight generation",
      "Custom reporting solutions"
    ],
    mission: "Our mission is simple: Analyze better, decide better, and create a more data-driven world—one insight at a time.",
    energyStatus: "Moderate Use",
    projectStatus: "Ahead of Schedule"
  }
];

export default function StartupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const startupId = Number(params.id);
  
  // Find the selected startup
  const startup = startupsData.find(s => s.id === startupId);
  
  if (!startup) {
    return <div className="p-8">Startup not found</div>;
  }

  const handleViewDetails = (id: number) => {
    router.push(`/startup/${id}`);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">

      {/* Founder info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
        <Image src="/placeholder-avatar.png" width={48} height={48} alt="Founder avatar" />
        </div>
        <div>
          <h2 className="font-bold">{startup.founderName} - {startup.name}</h2>
          <div className="text-sm text-gray-500">@{startup.founderName.toLowerCase().replace(' ', '')}</div>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex gap-2 mb-6">
        <Badge variant="outline" className="bg-gray-100 text-gray-700 rounded-full px-3 py-1">
          {startup.energyStatus}
        </Badge>
        <Badge variant="outline" className="bg-green-100 text-green-700 rounded-full px-3 py-1">
          {startup.projectStatus}
        </Badge>
      </div>

      {/* Project details */}
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-4">Project details</h1>
        <p className="mb-2">
          <span className="font-bold">{startup.name}</span> {startup.tagline}
        </p>
        
        <div className="my-4 whitespace-pre-line">
          {startup.detailText}
        </div>
        
        <div className="space-y-2 my-4">
          <p>Our platform not only helps users find <span className="font-bold">ethically</span> sourced and environmentally responsible products but also offers features like carbon offset tracking, <span className="font-bold">green certifications</span>, and personalized sustainability goals.</p>
          
          <p>{startup.name} is built to <span className="font-bold">encourage mindful shopping</span>, making it easier for people to reduce waste, support local communities, and contribute to a more <span className="font-bold">sustainable</span> future.</p>
        </div>
        
        <p className="mt-4">{startup.mission}</p>
      </div>

      {/* Resources section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Resources</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100">
            Click here to view
          </Button>
          <Button variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
            Join Discord
          </Button>
          <Button variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" onClick={() => router.push(`/startup/${startup.id}/analytics`)}>
            View Analytics
          </Button>
        </div>
      </div>

      {/* Similar startups */}
      <div>
        <h2 className="text-xl font-bold mb-4">Similar startups</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {startupsData
            .filter(s => s.id !== startupId ) //s.category === startup.category
            .slice(0, 3)
            .map(similarStartup => (
              <div key={similarStartup.id} className="border rounded-lg overflow-hidden">
                <div className="p-3 border-b">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">30 May, 2023</div>
                    <button className="text-gray-400">
                     
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    
                    <div className="text-sm">Steven Smith</div>
                  </div>
                  <div className="font-bold mt-1">{similarStartup.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                    A mobile app that helps users track and reduce their carbon footprint through daily activities.
                  </div>
                </div>

              
                <div className="p-3 flex justify-between">
                  <button className="text-sm">Compare</button>
                  <button 
                    className="bg-black text-white text-sm px-3 py-1 rounded"
                    onClick={() => handleViewDetails(similarStartup.id)}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}