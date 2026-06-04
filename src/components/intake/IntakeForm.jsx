import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Upload, X, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SERVICE_TYPES = [
  { value: "direct_to_employment", label: "Direct to Employment (DEA)" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
  { value: "external_referral", label: "External Referral" },
  { value: "internal_referral", label: "Internal Referral (non-employment)" },
  { value: "not_eligible", label: "Not eligible/no referral" },
];

const REFERRAL_SOURCES = [
  { value: "self", label: "Self" },
  { value: "family_friend", label: "Family / Friend" },
  { value: "school", label: "School" },
  { value: "employer", label: "Employer" },
  { value: "external_agency", label: "External Agency" },
  { value: "alberta_works", label: "Alberta Works (Income Support)" },
  { value: "other", label: "Other" },
];

const RESIDENCY_STATUSES = [
  { value: "canadian_citizen", label: "Canadian Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "protected_person", label: "Protected Person" },
  { value: "convention_refugee", label: "Convention Refugee" },
  { value: "refugee_claimant", label: "Refugee Claimant / Asylum Seeker" },
  { value: "temporary_resident", label: "Temporary Resident" },
  { value: "work_permit", label: "Work Permit Holder" },
  { value: "study_permit", label: "Study Permit Holder" },
  { value: "visitor", label: "Visitor" },
  { value: "other", label: "Other" },
];

const CLB_LEVELS = [
  { value: "clb_1", label: "CLB 1" },
  { value: "clb_2", label: "CLB 2" },
  { value: "clb_3", label: "CLB 3" },
  { value: "clb_4", label: "CLB 4" },
  { value: "clb_5", label: "CLB 5" },
  { value: "clb_6", label: "CLB 6" },
  { value: "clb_7", label: "CLB 7" },
  { value: "clb_8", label: "CLB 8" },
  { value: "clb_9", label: "CLB 9" },
  { value: "clb_10", label: "CLB 10" },
  { value: "clb_11", label: "CLB 11" },
  { value: "clb_12", label: "CLB 12" },
  { value: "native_english_french", label: "Native English / French Speaker" },
];

const EMPLOYMENT_STATUSES = [
  { value: "employed", label: "Employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "underemployed", label: "Underemployed" },
];

const CAREER_PRESETS = [
  "Administrative / Clerical", "Agriculture / Farming", "Automotive / Trades",
  "Childcare / Early Education", "Construction / Labourer", "Customer Service / Retail",
  "Driving / Transportation", "Food Service / Hospitality", "Healthcare / Personal Support",
  "Housekeeping / Cleaning", "IT / Technology", "Landscaping / Grounds",
  "Manufacturing / Warehouse", "Oil & Gas / Energy", "Security / Safety",
  "Social Services / Nonprofit", "Skilled Trades / Apprenticeship", "Teaching / Tutoring",
];

const EMPLOYMENT_JOB_TYPES = [
  "Full-time", "Part-time", "Temporary", "Contract", "Seasonal", "Internship", "Volunteer", "Self-employed"
];

const EMPLOYMENT_JOB_TITLES = [
  "Retail Sales Associate", "Customer Service Representative", "Warehouse Worker",
  "Food Service Worker", "Administrative Assistant", "General Labourer",
  "Cashier", "Server / Waiter", "Kitchen Helper", "Housekeeper",
  "Caregiver / Personal Support Worker", "Security Guard", "Janitor / Cleaner",
  "Delivery Driver", "Construction Labourer", "Farm Worker",
  "Childcare Worker", "Landscaping Worker", "Production Line Worker",
  "Receptionist", "Data Entry Clerk", "Office Clerk", "Stock Clerk",
  "Cook", "Barista", "Dishwasher", "Baker", "Food Prep Worker",
  "Nanny", "Elder Care Companion", "Disability Support Worker",
  "Retail Manager", "Shift Supervisor", "Team Lead", "Foreman",
  "Machine Operator", "Assembly Line Worker", "Quality Control Inspector",
  "Driver", "Courier", "Bus Driver", "Taxi Driver",
  "Hair Stylist", "Esthetician", "Massage Therapist",
  "Other"
];

const EMPLOYMENT_INDUSTRIES = [
  "Retail / Wholesale Trade",
  "Food Service / Hospitality",
  "Healthcare / Social Assistance",
  "Construction / Trades",
  "Manufacturing / Production",
  "Agriculture / Farming",
  "Transportation / Warehousing",
  "Administrative / Office Support",
  "Customer Service / Call Centre",
  "Cleaning / Janitorial Services",
  "Security / Safety Services",
  "Childcare / Early Learning",
  "IT / Technology",
  "Finance / Banking",
  "Education / Training",
  "Oil & Gas / Energy",
  "Nonprofit / Community Services",
  "Arts / Culture / Recreation",
  "Personal Services (salon, spa, etc.)",
  "Other"
];

const EDUCATION_TYPES = [
  "High School Diploma", "GED / Adult Learning Certificate",
  "College Diploma", "College Certificate", "Bachelor's Degree", "Master's Degree", "Doctorate",
  "Trade Certificate", "Apprenticeship", "Professional Certification",
  "ESL / LINC Training", "Workshop", "Short Course", "On-the-Job Training",
];

const VEHICLE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no_has_license", label: "No (has driver's license)" },
  { value: "no_no_license", label: "No (no driver's license)" },
];

const STATUSES = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
];

export default function IntakeForm({ client, users, onSave, onCancel }) {
  const [form, setForm] = useState({
    first_name: client?.first_name || "",
    last_name: client?.last_name || "",
    date_of_birth: client?.date_of_birth || "",
    phone: client?.phone || "",
    email: client?.email || "",
    address: client?.address || "",
    city: client?.city || "",
    state: client?.state || "",
    zip: client?.zip || "",
    referral_source: client?.referral_source || "",
    service_type: client?.service_type || "",
    assigned_worker: client?.assigned_worker || "",
    assigned_worker_name: client?.assigned_worker_name || "",
    status: client?.status || "new",
    intake_notes: client?.intake_notes || "",
    compass_hsid: client?.compass_hsid || "",
    residency_status: client?.residency_status || "",
    clb_level: client?.clb_level || "",
    employment_status: client?.employment_status || "",
    has_vehicle: client?.has_vehicle || "",
    career_objectives: client?.career_objectives || "",
    employment_history_entries: client?.employment_history_entries || [],
    education_entries: client?.education_entries || [],
    resume_urls: client?.resume_urls || [],
  });

  const [employmentEntries, setEmploymentEntries] = useState(client?.employment_history_entries || []);
  const [educationEntries, setEducationEntries] = useState(client?.education_entries || []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const addEmploymentEntry = () => {
    setEmploymentEntries([...employmentEntries, { company: "", job_title: "", job_title_other: "", industry: "", job_type: "", start_date: "", end_date: "", responsibilities: "" }]);
  };

  const updateEmploymentEntry = (index, field, value) => {
    const updated = [...employmentEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEmploymentEntries(updated);
  };

  const removeEmploymentEntry = (index) => {
    setEmploymentEntries(employmentEntries.filter((_, i) => i !== index));
  };

  const addEducationEntry = () => {
    setEducationEntries([...educationEntries, { institution: "", education_type: "", field_of_study: "", start_date: "", end_date: "", description: "" }]);
  };

  const updateEducationEntry = (index, field, value) => {
    const updated = [...educationEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEducationEntries(updated);
  };

  const removeEducationEntry = (index) => {
    setEducationEntries(educationEntries.filter((_, i) => i !== index));
  };

  const validate = (data) => {
    const errs = {};
    if (!data.first_name?.trim()) errs.first_name = "First name is required.";
    if (!data.last_name?.trim()) errs.last_name = "Last name is required.";
    if (data.phone) {
      const digits = data.phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 11) errs.phone = "Phone must be 10 digits (or 11 with country code).";
    }
    if (data.zip) {
      const postal = data.zip.replace(/\s/g, "").toUpperCase();
      if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postal)) errs.zip = "Postal code must be in format A1A 1A1.";
    }
    if (data.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Enter a valid email address.";
    }
    return errs;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("resume_urls", [...(form.resume_urls || []), file_url]);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeResume = (url) => {
    set("resume_urls", form.resume_urls.filter(u => u !== url));
  };

  const handleWorkerSelect = (email) => {
    const worker = users.find(u => u.email === email);
    set("assigned_worker", email);
    set("assigned_worker_name", worker?.full_name || email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave({ ...form, employment_history_entries: employmentEntries, education_entries: educationEntries });
  };

  const workerUsers = [
    { email: "priscilla@candorasociety.com", full_name: "Priscilla" },
    { email: "lola@candorasociety.com", full_name: "Lola" },
    { email: "john@candorasociety.com", full_name: "John" },
    { email: "Dawn.williston@candorasociety.com", full_name: "Dawn" },
    { email: "olena@candorasociety.com", full_name: "Olena" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold text-slate-800">
          {client ? "Edit Client" : "New Client Intake"}
        </h2>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>First Name *</Label>
            <Input value={form.first_name} onChange={e => { set("first_name", e.target.value); setErrors(p => ({...p, first_name: ""})); }} className={errors.first_name ? "border-red-400" : ""} />
            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
          </div>
          <div className="space-y-1">
            <Label>Last Name *</Label>
            <Input value={form.last_name} onChange={e => { set("last_name", e.target.value); setErrors(p => ({...p, last_name: ""})); }} className={errors.last_name ? "border-red-400" : ""} />
            {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
          </div>
          <div className="space-y-1">
            <Label>Date of Birth</Label>
            <Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => { set("phone", e.target.value); setErrors(p => ({...p, phone: ""})); }} placeholder="(555) 555-5555" className={errors.phone ? "border-red-400" : ""} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={form.email} onChange={e => { set("email", e.target.value); setErrors(p => ({...p, email: ""})); }} className={errors.email ? "border-red-400" : ""} />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-1">
            <Label>Compass HSID#</Label>
            <Input value={form.compass_hsid} onChange={e => set("compass_hsid", e.target.value)} placeholder="Government of Alberta HSID number" />
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Input value={form.address} onChange={e => set("address", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>City</Label>
            <Input value={form.city} onChange={e => set("city", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Province</Label>
              <Select value={form.state} onValueChange={v => set("state", v)}>
                <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                <SelectContent>
                  {["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Postal Code</Label>
              <Input value={form.zip} onChange={e => { set("zip", e.target.value); setErrors(p => ({...p, zip: ""})); }} maxLength={7} placeholder="A1A 1A1" className={errors.zip ? "border-red-400" : ""} />
              {errors.zip && <p className="text-xs text-red-500">{errors.zip}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Case & Service Info</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Referral Source</Label>
            <Select value={form.referral_source} onValueChange={v => set("referral_source", v)}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {REFERRAL_SOURCES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Service Element (Stream)</Label>
            <Select value={form.service_type} onValueChange={v => set("service_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Assign to Worker</Label>
            <Select value={form.assigned_worker} onValueChange={handleWorkerSelect}>
              <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
              <SelectContent>
                {workerUsers.map(u => (
                  <SelectItem key={u.email} value={u.email}>{u.full_name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Residency Status</Label>
            <Select value={form.residency_status} onValueChange={v => set("residency_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {RESIDENCY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>CLB Level</Label>
            <Select value={form.clb_level} onValueChange={v => set("clb_level", v)}>
              <SelectTrigger><SelectValue placeholder="Select CLB level" /></SelectTrigger>
              <SelectContent>
                {CLB_LEVELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Employment Status</Label>
            <Select value={form.employment_status} onValueChange={v => set("employment_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select employment status" /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_STATUSES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Has Vehicle</Label>
            <Select value={form.has_vehicle} onValueChange={v => set("has_vehicle", v)}>
              <SelectTrigger><SelectValue placeholder="Select vehicle status" /></SelectTrigger>
              <SelectContent>
                {VEHICLE_OPTIONS.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Career / Employment Objectives</Label>
            <Textarea
              value={form.career_objectives}
              onChange={e => set("career_objectives", e.target.value)}
              rows={4}
              placeholder="Describe the client's career goals and employment objectives..."
            />
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1.5">Quick add career type:</p>
              <div className="flex flex-wrap gap-1.5">
                {CAREER_PRESETS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, career_objectives: prev.career_objectives ? `${prev.career_objectives}\n${preset}` : preset }))}
                    className="text-xs px-2 py-1 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Employment History</Label>
            <div className="space-y-3">
              {employmentEntries.map((entry, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-700">Position {index + 1}</h4>
                    <button type="button" onClick={() => removeEmploymentEntry(index)} className="text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Company / Employer</Label>
                      <Input value={entry.company} onChange={e => updateEmploymentEntry(index, "company", e.target.value)} placeholder="Company name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Industry</Label>
                      <Select value={entry.industry} onValueChange={v => updateEmploymentEntry(index, "industry", v)}>
                        <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_INDUSTRIES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Job Title</Label>
                      <Select value={entry.job_title} onValueChange={v => updateEmploymentEntry(index, "job_title", v)}>
                        <SelectTrigger><SelectValue placeholder="Select job title" /></SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_JOB_TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {entry.job_title === "Other" && (
                        <Input
                          value={entry.job_title_other || ""}
                          onChange={e => updateEmploymentEntry(index, "job_title_other", e.target.value)}
                          placeholder="Specify job title"
                          className="mt-1"
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Job Type</Label>
                      <Select value={entry.job_type} onValueChange={v => updateEmploymentEntry(index, "job_type", v)}>
                        <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Start Date</Label>
                        <Input type="date" value={entry.start_date} onChange={e => updateEmploymentEntry(index, "start_date", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Date</Label>
                        <Input type="date" value={entry.end_date} onChange={e => updateEmploymentEntry(index, "end_date", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Responsibilities</Label>
                      <Textarea value={entry.responsibilities} onChange={e => updateEmploymentEntry(index, "responsibilities", e.target.value)} rows={2} placeholder="Key duties and responsibilities..." />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addEmploymentEntry} className="w-full">
                + Add Position
              </Button>
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Education & Training</Label>
            <div className="space-y-3">
              {educationEntries.map((entry, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-700">Education {index + 1}</h4>
                    <button type="button" onClick={() => removeEducationEntry(index)} className="text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Institution / School</Label>
                      <Input value={entry.institution} onChange={e => updateEducationEntry(index, "institution", e.target.value)} placeholder="School or institution name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Education Type</Label>
                      <Select value={entry.education_type} onValueChange={v => updateEducationEntry(index, "education_type", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {EDUCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Field of Study / Program</Label>
                      <Input value={entry.field_of_study} onChange={e => updateEducationEntry(index, "field_of_study", e.target.value)} placeholder="e.g. Business Administration, Healthcare Assistant..." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Start Date</Label>
                        <Input type="date" value={entry.start_date} onChange={e => updateEducationEntry(index, "start_date", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Date / Expected</Label>
                        <Input type="date" value={entry.end_date} onChange={e => updateEducationEntry(index, "end_date", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Description / Achievements</Label>
                      <Textarea value={entry.description} onChange={e => updateEducationEntry(index, "description", e.target.value)} rows={2} placeholder="Relevant coursework, honors, certifications..." />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addEducationEntry} className="w-full">
                + Add Education / Training
              </Button>
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Resumes & Documents</Label>
            <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-sm text-slate-500">
                  {uploading ? "Uploading..." : "Click to upload resume or document (PDF, image, Word)"}
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {form.resume_urls?.length > 0 && (
              <div className="mt-2 space-y-2">
                {form.resume_urls.map((url, i) => (
                  <div key={url} className="flex items-center gap-2 bg-white border border-slate-200 rounded px-3 py-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">
                      Document {i + 1}
                    </a>
                    <button type="button" onClick={() => removeResume(url)} className="text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Intake Notes</Label>
            <Textarea
              value={form.intake_notes}
              onChange={e => set("intake_notes", e.target.value)}
              rows={4}
              placeholder="Additional notes about the client..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="gap-2">
          <Save className="w-4 h-4" /> {client ? "Save Changes" : "Save Client"}
        </Button>
      </div>
    </form>
  );
}