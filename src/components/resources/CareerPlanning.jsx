import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export default function CareerPlanning() {
  const [mode, setMode] = useState(null); // "forward" | "reverse"
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Forward mode inputs
  const [jobType, setJobType] = useState("");
  const [location, setLocation] = useState("Alberta, Canada");

  // Reverse mode inputs
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");

  const runForward = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Canadian career counsellor. Given the job type "${jobType}" in ${location}, provide a detailed career profile including:
1. Typical job titles in this field
2. Required education (credentials, certificates, degrees)
3. Required/preferred experience
4. Key skills and competencies
5. Typical wage range (hourly and annual) in Alberta, Canada
6. Career progression pathway (entry → mid → senior level)
7. Suggested training plan for someone starting from scratch (step by step)
8. Relevant certifications or licenses required in Alberta

Be practical and specific. Format clearly with sections.`,
      response_json_schema: {
        type: "object",
        properties: {
          job_titles: { type: "array", items: { type: "string" } },
          education: { type: "array", items: { type: "string" } },
          experience: { type: "array", items: { type: "string" } },
          skills: { type: "array", items: { type: "string" } },
          wage_range: { type: "object", properties: { hourly_min: { type: "string" }, hourly_max: { type: "string" }, annual_min: { type: "string" }, annual_max: { type: "string" } } },
          career_progression: { type: "array", items: { type: "object", properties: { level: { type: "string" }, description: { type: "string" } } } },
          training_plan: { type: "array", items: { type: "object", properties: { step: { type: "number" }, action: { type: "string" }, duration: { type: "string" } } } },
          certifications: { type: "array", items: { type: "string" } }
        }
      }
    });
    setResult({ mode: "forward", data: res, jobType });
    setLoading(false);
  };

  const runReverse = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Canadian career counsellor. A client has the following background:
Education: ${education}
Work Experience: ${experience}
Skills: ${skills}
Location: Alberta, Canada

Based on this profile:
1. List job types/careers they currently qualify for (ready now)
2. List job types/careers within reach with some additional training (1-2 years)
3. List longer-term career goals that are achievable (3-5 years)
4. For each "within reach" career, provide a specific training plan to get there
5. Highlight any transferable skills that are particularly valuable

Be practical, encouraging, and specific to the Alberta labour market.`,
      response_json_schema: {
        type: "object",
        properties: {
          qualify_now: { type: "array", items: { type: "object", properties: { title: { type: "string" }, reason: { type: "string" } } } },
          within_reach: { type: "array", items: { type: "object", properties: { title: { type: "string" }, gap: { type: "string" }, training_plan: { type: "array", items: { type: "string" } } } } },
          long_term: { type: "array", items: { type: "object", properties: { title: { type: "string" }, path: { type: "string" } } } },
          transferable_skills: { type: "array", items: { type: "string" } }
        }
      }
    });
    setResult({ mode: "reverse", data: res });
    setLoading(false);
  };

  const reset = () => { setMode(null); setResult(null); setJobType(""); setEducation(""); setExperience(""); setSkills(""); };

  if (!mode) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">Choose how you want to explore career options:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-slate-400 transition-colors" onClick={() => setMode("forward")}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-600" /> Explore a Career Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">I know what job I want — show me what education, experience, and training I need to get there.</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-slate-400 transition-colors" onClick={() => setMode("reverse")}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeft className="w-5 h-5 text-green-600" /> Find Matching Careers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">I have experience and education — show me what careers I qualify for or can reach with training.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={reset} className="text-slate-500 gap-1">
        <ArrowLeft className="w-3 h-3" /> Back
      </Button>

      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {mode === "forward" ? "Explore a Career Path" : "Find Matching Careers"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "forward" ? (
              <>
                <div className="space-y-1.5">
                  <Label>Job Type / Career Goal</Label>
                  <Input placeholder="e.g. Dental Assistant, Warehouse Worker, Early Childhood Educator" value={jobType} onChange={e => setJobType(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <Button onClick={runForward} disabled={!jobType || loading} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Generating..." : "Generate Career Profile"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Education Background</Label>
                  <Textarea placeholder="e.g. High school diploma, LINC Level 5, ESL Certificate..." value={education} onChange={e => setEducation(e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Work Experience</Label>
                  <Textarea placeholder="e.g. 3 years food service in home country, 1 year cleaning in Canada..." value={experience} onChange={e => setExperience(e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Skills & Strengths</Label>
                  <Textarea placeholder="e.g. customer service, physical work, attention to detail, working with children..." value={skills} onChange={e => setSkills(e.target.value)} rows={2} />
                </div>
                <Button onClick={runReverse} disabled={!education && !experience || loading} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Analyzing..." : "Find My Career Options"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {result && result.mode === "forward" && (
        <ForwardResult data={result.data} jobType={result.jobType} onReset={reset} />
      )}
      {result && result.mode === "reverse" && (
        <ReverseResult data={result.data} onReset={reset} />
      )}
    </div>
  );
}

function ForwardResult({ data, jobType, onReset }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Career Profile: {jobType}</h2>
        <Button variant="outline" size="sm" onClick={onReset}>New Search</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultCard title="Job Titles in This Field">
          <ul className="space-y-1">{data.job_titles?.map((t, i) => <li key={i} className="text-sm text-slate-700">• {t}</li>)}</ul>
        </ResultCard>

        <ResultCard title="Wage Range (Alberta)">
          <p className="text-sm text-slate-700">Hourly: <strong>{data.wage_range?.hourly_min} – {data.wage_range?.hourly_max}</strong></p>
          <p className="text-sm text-slate-700">Annual: <strong>{data.wage_range?.annual_min} – {data.wage_range?.annual_max}</strong></p>
        </ResultCard>

        <ResultCard title="Education Required">
          <ul className="space-y-1">{data.education?.map((e, i) => <li key={i} className="text-sm text-slate-700">• {e}</li>)}</ul>
        </ResultCard>

        <ResultCard title="Experience & Skills">
          <ul className="space-y-1">{data.experience?.map((e, i) => <li key={i} className="text-sm text-slate-700">• {e}</li>)}</ul>
        </ResultCard>

        <ResultCard title="Certifications / Licenses">
          <ul className="space-y-1">{data.certifications?.map((c, i) => <li key={i} className="text-sm text-slate-700">• {c}</li>)}</ul>
        </ResultCard>

        <ResultCard title="Key Skills">
          <ul className="space-y-1">{data.skills?.map((s, i) => <li key={i} className="text-sm text-slate-700">• {s}</li>)}</ul>
        </ResultCard>
      </div>

      <ResultCard title="Career Progression">
        <div className="flex flex-wrap gap-2">
          {data.career_progression?.map((p, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="bg-slate-100 rounded px-2 py-1 text-xs font-semibold text-slate-700">{p.level}</span>
              <p className="text-xs text-slate-500">{p.description}</p>
              {i < data.career_progression.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
            </div>
          ))}
        </div>
      </ResultCard>

      <ResultCard title="Training Plan (Step by Step)">
        <ol className="space-y-2">
          {data.training_plan?.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="bg-slate-800 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">{s.step}</span>
              <div>
                <span className="text-slate-800 font-medium">{s.action}</span>
                {s.duration && <span className="text-slate-400 ml-2">({s.duration})</span>}
              </div>
            </li>
          ))}
        </ol>
      </ResultCard>
    </div>
  );
}

function ReverseResult({ data, onReset }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Your Career Options</h2>
        <Button variant="outline" size="sm" onClick={onReset}>New Search</Button>
      </div>

      {data.transferable_skills?.length > 0 && (
        <ResultCard title="Your Transferable Skills">
          <div className="flex flex-wrap gap-2">
            {data.transferable_skills.map((s, i) => (
              <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </ResultCard>
      )}

      <ResultCard title="✅ Ready Now — Careers You Qualify For">
        <ul className="space-y-2">
          {data.qualify_now?.map((j, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold text-slate-800">{j.title}</span>
              <span className="text-slate-500 ml-2">— {j.reason}</span>
            </li>
          ))}
        </ul>
      </ResultCard>

      <ResultCard title="🎯 Within Reach — With Some Training (1–2 Years)">
        <div className="space-y-4">
          {data.within_reach?.map((j, i) => (
            <div key={i} className="border-l-2 border-amber-400 pl-3">
              <p className="text-sm font-semibold text-slate-800">{j.title}</p>
              <p className="text-xs text-slate-500 mb-1">Gap: {j.gap}</p>
              <ul className="space-y-0.5">
                {j.training_plan?.map((step, si) => (
                  <li key={si} className="text-xs text-slate-600">→ {step}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ResultCard>

      <ResultCard title="🌟 Long-Term Goals (3–5 Years)">
        <ul className="space-y-2">
          {data.long_term?.map((j, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold text-slate-800">{j.title}</span>
              <span className="text-slate-500 ml-2">— {j.path}</span>
            </li>
          ))}
        </ul>
      </ResultCard>
    </div>
  );
}

function ResultCard({ title, children }) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">{children}</CardContent>
    </Card>
  );
}