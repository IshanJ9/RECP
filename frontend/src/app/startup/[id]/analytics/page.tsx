"use client"


import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    stats: {
      moneyRaisedData: [
        { month: 'Jan', amount: 15000 },
        { month: 'Feb', amount: 22000 },
        { month: 'Mar', amount: 18000 },
        { month: 'Apr', amount: 24000 },
        { month: 'May', amount: 20000 },
        { month: 'Jun', amount: 25000 },
        { month: 'Jul', amount: 21000 },
        { month: 'Aug', amount: 27000 },
        { month: 'Sep', amount: 24000 },
        { month: 'Oct', amount: 32000 },
        { month: 'Nov', amount: 35000 },
        { month: 'Dec', amount: 38000 }
      ],
      totalInvestors: 27,
      something: 3298,
      fundsRaised: {
        thisMonth: 3500.06,
        lastMonth: 3500.06
      },
      timeline: {
        expectedBy: "08/01/26",
        milestones: [
          { name: "Project Started", complete: true },
          { name: "Team Formed", complete: true },
          { name: "First MVP Released", complete: true },
          { name: "First Paying Customer", complete: true },
          { name: "Reached Break Even", complete: true },
          { name: "End", complete: false }
        ]
      },
      involvement: {
        totalInvested: 4000,
        eligibleCarbonCredits: 50,
        stake: 5.06,
        lastVoted: "12/01/25",
        borrowingRateAverage: 72,
        share: 5.06
      }
    }
  },
  // Add similar data structures for other startups...
];

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const startupId = Number(params.id || searchParams.get('id') || 1);
  
  // Find the selected startup
  const startup = startupsData.find(s => s.id === startupId) || startupsData[0];
  
  const [timeFilter, setTimeFilter] = useState("All time");
  const [peopleFilter, setpeopleFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");

  // Timeline calculation - assuming 6 milestones evenly spaced
  const totalMilestones = startup.stats.timeline.milestones.length;
  const completedMilestones = startup.stats.timeline.milestones.filter(m => m.complete).length;
  const progressPercentage = (completedMilestones / totalMilestones) * 100;
  
  const handleVoteNow = () => {
    router.push(`/startup/${startupId}/analytics/voting`);
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

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <div className="w-1/3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All time">All time</SelectItem>
              <SelectItem value="This year">This year</SelectItem>
              <SelectItem value="This month">This month</SelectItem>
              <SelectItem value="This week">This week</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/3">
          <Select value={peopleFilter} onValueChange={setpeopleFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="People" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Investors">Investors</SelectItem>
              <SelectItem value="Team">Team</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/3">
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Funding">Funding</SelectItem>
              <SelectItem value="Development">Development</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Money Raised Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Money Raised</h2>
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={startup.stats.moneyRaisedData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => `$${value/1000}k`}
                  />
                  <Tooltip formatter={(value: any) => [`$${value}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#4F7BDA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Total investors</div>
                <div className="text-2xl font-bold">{startup.stats.totalInvestors}</div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Something</div>
                <div className="text-2xl font-bold">{startup.stats.something.toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Av. Funds raised per month</div>
                <div className="text-2xl font-bold">${startup.stats.fundsRaised.thisMonth.toFixed(2)}</div>
              </div>
            </div>
            
            {/* Duplicate stats for demonstration */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Total investors</div>
                <div className="text-2xl font-bold">{startup.stats.totalInvestors}</div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Something</div>
                <div className="text-2xl font-bold">{startup.stats.something.toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Av. Funds raised per month</div>
                <div className="text-2xl font-bold">${startup.stats.fundsRaised.lastMonth.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Timeline</h2>
        <Card className="p-6">
          <CardContent className="p-0">
            {/* Timeline visualization */}
            <div className="relative py-6">
              {/* Timeline line */}
              <div className="absolute left-0 right-0 h-1 bg-gray-200 top-1/2 transform -translate-y-1/2"></div>
              {/* Progress line */}
              <div 
                className="absolute left-0 h-1 bg-blue-500 top-1/2 transform -translate-y-1/2"
                style={{ width: `${progressPercentage}%` }}
              ></div>
              <br></br>
              {/* Milestones */}
              <div className="flex justify-between relative">
                {startup.stats.timeline.milestones.map((milestone, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full z-10 ${milestone.complete ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <br></br>
                    <div className="text-xs mt-2 max-w-24 text-center">{milestone.name}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Expected by date */}
            <div className="flex justify-between items-center mt-8">
              <div className="text-sm">Expected by: {startup.stats.timeline.expectedBy}</div>
              <Badge variant="outline" className="bg-green-100 text-green-700 rounded-full px-3 py-1">
                On Time
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Involvement Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Your Involvement</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Invested</div>
            <div className="text-xl font-bold">${startup.stats.involvement.totalInvested}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500">Eligible Carbon Credits</div>
            <div className="text-xl font-bold">{startup.stats.involvement.eligibleCarbonCredits}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500">Stake</div>
            <div className="text-xl font-bold">{startup.stats.involvement.stake}%</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500">Last voted</div>
            <div className="text-xl font-bold">{startup.stats.involvement.lastVoted}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500">Borrowing rate average</div>
            <div className="text-xl font-bold">{startup.stats.involvement.borrowingRateAverage}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500">Share</div>
            <div className="text-xl font-bold">{startup.stats.involvement.share}%</div>
          </Card>
        </div>
      </div>

      {/* Voting Section */}
      <div className="mb-10">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Round 1 voting</h2>
            <Badge variant="outline" className="bg-red-100 text-red-700 rounded-full px-3 py-1">
              Live
            </Badge>
          </div>

          {/* Option 1 */}
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span>Option 1</span>
              <span className="font-semibold">48%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '48%' }}></div>
            </div>
          </div>

          {/* Option 2 */}
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span>Option 2</span>
              <span className="font-semibold">27%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '27%' }}></div>
            </div>
          </div>

          {/* Option 3 */}
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span>Option 3</span>
              <span className="font-semibold">25%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              className="px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors"
              onClick={handleVoteNow}
            >
              Vote Now
            </button>
          </div>
        </div>

        {/* Voting Guidelines */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Voting guidelines:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>The voting starts at 25 Jan 2025 8 A.M. and ends at 29 Jan 2025 8 P.M.</li>
            <li>Each member will receive 1000 tokens.</li>
            <li>Each option can have a minimum of 2000 tokens and maximum of 10,000 tokens.</li>
            <li>If a member fails to vote during the scheduled time, their participation in the voting round will not be considered.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}