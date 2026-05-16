import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CareerPlanning from "@/components/resources/CareerPlanning";
import JobSearch from "@/components/resources/JobSearch";

export default function Resources() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-800">Resources</h1>
        <p className="text-sm text-slate-500">Career planning tools and job search resources</p>
      </div>
      <div className="max-w-5xl mx-auto p-6">
        <Tabs defaultValue="career">
          <TabsList className="mb-6">
            <TabsTrigger value="career">Career Planning</TabsTrigger>
            <TabsTrigger value="jobs">Job Search</TabsTrigger>
          </TabsList>
          <TabsContent value="career">
            <CareerPlanning />
          </TabsContent>
          <TabsContent value="jobs">
            <JobSearch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}