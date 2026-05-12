import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, Search } from "lucide-react";

const JOB_BOARDS = [
  {
    name: "Indeed Canada",
    color: "bg-blue-600",
    getUrl: (query, location) =>
      `https://ca.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`,
  },
  {
    name: "ZipRecruiter",
    color: "bg-orange-500",
    getUrl: (query, location) =>
      `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
  },
  {
    name: "Government of Canada Job Bank",
    color: "bg-red-700",
    getUrl: (query, location) =>
      `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=${encodeURIComponent(query)}&locationstring=${encodeURIComponent(location)}`,
  },
];

export default function JobSearch() {
  const [jobType, setJobType] = useState("");
  const [location, setLocation] = useState("Edmonton, Alberta");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const search = async () => {
    setLoading(true);
    setResults(null);
    setError(null);
    try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are helping a job seeker in Alberta, Canada find employment. They are looking for: "${jobType}" near ${location}.

Generate a list of 10 specific, realistic job search queries they should use on job boards. For each query:
- Provide the exact search term to use
- A brief note on what type of role it targets
- The NOC (National Occupational Classification) code if applicable

Also suggest 5 related job titles they might not have considered that use similar skills.

Keep results practical and relevant to the Alberta labour market.`,
      response_json_schema: {
        type: "object",
        properties: {
          search_queries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                query: { type: "string" },
                description: { type: "string" },
                noc_code: { type: "string" }
              }
            }
          },
          related_titles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });
    setResults(res);
    } catch (err) {
      setError("Failed to fetch job search results. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Job Type / Career</Label>
              <Input
                placeholder="e.g. Early Childhood Educator, Welder, Food Service Worker"
                value={jobType}
                onChange={e => setJobType(e.target.value)}
                onKeyDown={e => e.key === "Enter" && jobType && search()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>}
          <Button onClick={search} disabled={!jobType || loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Searching..." : "Find Jobs"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Direct job board links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Search on Job Boards</h3>
            <div className="flex flex-wrap gap-3">
              {JOB_BOARDS.map(board => (
                <a
                  key={board.name}
                  href={board.getUrl(jobType, location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${board.color} text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity`}
                >
                  {board.name} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* AI-suggested search queries */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Recommended Search Terms</h3>
            <div className="space-y-2">
              {results.search_queries?.map((item, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-800">{item.query}</span>
                      {item.noc_code && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">NOC {item.noc_code}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {JOB_BOARDS.map(board => (
                      <a
                        key={board.name}
                        href={board.getUrl(item.query, location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Search on ${board.name}`}
                        className="text-xs text-slate-400 hover:text-slate-700 underline"
                      >
                        {board.name === "Government of Canada Job Bank" ? "Job Bank" : board.name.split(" ")[0]}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related titles */}
          {results.related_titles?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Related Roles to Consider</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {results.related_titles.map((item, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                    <div className="flex gap-2 mt-2">
                      {JOB_BOARDS.map(board => (
                        <a
                          key={board.name}
                          href={board.getUrl(item.title, location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {board.name === "Government of Canada Job Bank" ? "Job Bank" : board.name.split(" ")[0]}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}