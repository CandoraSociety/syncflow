import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, X, ChevronUp, ChevronDown } from "lucide-react";
import { differenceInMonths } from "date-fns";

export const SORT_OPTIONS = [
  { value: "last_name_asc", label: "Name (A → Z)" },
  { value: "last_name_desc", label: "Name (Z → A)" },
  { value: "intake_date_desc", label: "Intake Date (newest)" },
  { value: "intake_date_asc", label: "Intake Date (oldest)" },
  { value: "service_start_date_desc", label: "Program Start (newest)" },
  { value: "service_start_date_asc", label: "Program Start (oldest)" },
  { value: "completion_date_desc", label: "Completion Date (newest)" },
  { value: "completion_date_asc", label: "Completion Date (oldest)" },
  { value: "assigned_worker_name_asc", label: "Career Counsellor (A → Z)" },
  { value: "assigned_worker_name_desc", label: "Career Counsellor (Z → A)" },
];

const SERVICE_OPTIONS = [
  { value: "direct_to_employment", label: "Direct to Employment (DEA)" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
  { value: "external_referral", label: "External Referral" },
  { value: "internal_referral", label: "Internal Referral" },
  { value: "not_eligible", label: "Not Eligible" },
];

const PROGRAM_STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
  { value: "cancelled", label: "Cancelled" },
];

const EMP_STATUS_OPTIONS = ["E-RF", "E-UF", "E-PT", "UE", "UE-LA", "UE-S", "NA"];

const CLB_OPTIONS = [
  { value: "clb_1", label: "CLB 1" }, { value: "clb_2", label: "CLB 2" },
  { value: "clb_3", label: "CLB 3" }, { value: "clb_4", label: "CLB 4" },
  { value: "clb_5", label: "CLB 5" }, { value: "clb_6", label: "CLB 6" },
  { value: "clb_7", label: "CLB 7" }, { value: "clb_8", label: "CLB 8" },
  { value: "clb_9", label: "CLB 9" }, { value: "clb_10", label: "CLB 10" },
  { value: "clb_11", label: "CLB 11" }, { value: "clb_12", label: "CLB 12" },
  { value: "native_english_french", label: "Native" },
];

const NONE = "";

function FilterSelect({ label, value, onChange, options, placeholder = "Any" }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      <Select value={value || "__any__"} onValueChange={v => onChange(v === "__any__" ? "" : v)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__any__">{placeholder}</SelectItem>
          {options.map(o => (
            <SelectItem key={o.value || o} value={o.value || o}>
              {o.label || o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function applyFiltersAndSort(clients, search, filters, sortKey) {
  let result = [...clients];

  // Search
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(c =>
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.compass_hsid?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.assigned_worker_name?.toLowerCase().includes(q)
    );
  }

  // Filters
  if (filters.service_type) result = result.filter(c => c.service_type === filters.service_type);
  if (filters.program_status) result = result.filter(c => c.program_status === filters.program_status);
  if (filters.employment_status) result = result.filter(c => c.employment_status === filters.employment_status);
  if (filters.clb_level) result = result.filter(c => c.clb_level === filters.clb_level);
  if (filters.assigned_worker) result = result.filter(c => c.assigned_worker_name?.toLowerCase().includes(filters.assigned_worker.toLowerCase()));

  // Age range
  if (filters.age_min || filters.age_max) {
    const now = new Date();
    result = result.filter(c => {
      if (!c.date_of_birth) return false;
      const age = Math.floor((now - new Date(c.date_of_birth)) / (365.25 * 24 * 3600 * 1000));
      if (filters.age_min && age < Number(filters.age_min)) return false;
      if (filters.age_max && age > Number(filters.age_max)) return false;
      return true;
    });
  }

  // Duration in program (months from service_start_date)
  if (filters.duration_min || filters.duration_max) {
    const now = new Date();
    result = result.filter(c => {
      if (!c.service_start_date) return false;
      const months = differenceInMonths(now, new Date(c.service_start_date));
      if (filters.duration_min && months < Number(filters.duration_min)) return false;
      if (filters.duration_max && months > Number(filters.duration_max)) return false;
      return true;
    });
  }

  // Sort
  const [field, dir] = (sortKey || "intake_date_desc").split(/_(?=[^_]+$)/);
  const fieldMap = {
    last_name: "last_name",
    intake_date: "intake_date",
    service_start_date: "service_start_date",
    completion_date: "completion_date",
    assigned_worker_name: "assigned_worker_name",
  };
  const f = fieldMap[field] || "intake_date";
  result.sort((a, b) => {
    const av = a[f] || "";
    const bv = b[f] || "";
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });

  return result;
}

export default function ClientListControls({ search, onSearch, filters, onFilters, sortKey, onSort, workers = [] }) {
  const [open, setOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(v => v !== "" && v !== undefined).length;

  const clearAll = () => onFilters({
    service_type: "", program_status: "", employment_status: "",
    clb_level: "", assigned_worker: "", age_min: "", age_max: "",
    duration_min: "", duration_max: "",
  });

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input className="pl-9 h-9" placeholder="Search name, HSID#, phone, email..." value={search} onChange={e => onSearch(e.target.value)} />
        </div>

        {/* Sort */}
        <div className="w-56">
          <Select value={sortKey} onValueChange={onSort}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter toggle */}
        <Button
          variant={activeFilterCount > 0 ? "default" : "outline"}
          size="sm"
          className="gap-2 h-9"
          onClick={() => setOpen(v => !v)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white text-slate-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="gap-1 text-slate-500 h-9" onClick={clearAll}>
            <X className="w-3 h-3" /> Clear filters
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {open && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <FilterSelect
            label="Service Stream"
            value={filters.service_type}
            onChange={v => onFilters({ ...filters, service_type: v })}
            options={SERVICE_OPTIONS}
          />
          <FilterSelect
            label="Program Status"
            value={filters.program_status}
            onChange={v => onFilters({ ...filters, program_status: v })}
            options={PROGRAM_STATUS_OPTIONS}
          />
          <FilterSelect
            label="Employment Status"
            value={filters.employment_status}
            onChange={v => onFilters({ ...filters, employment_status: v })}
            options={EMP_STATUS_OPTIONS}
          />
          <FilterSelect
            label="CLB Level"
            value={filters.clb_level}
            onChange={v => onFilters({ ...filters, clb_level: v })}
            options={CLB_OPTIONS}
          />

          {/* Career counsellor */}
          {workers.length > 0 ? (
            <FilterSelect
              label="Career Counsellor"
              value={filters.assigned_worker}
              onChange={v => onFilters({ ...filters, assigned_worker: v })}
              options={workers.map(w => ({ value: w, label: w }))}
            />
          ) : (
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1 block">Career Counsellor</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Filter by name..."
                value={filters.assigned_worker}
                onChange={e => onFilters({ ...filters, assigned_worker: e.target.value })}
              />
            </div>
          )}

          {/* Age range */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Age Min</Label>
            <Input
              type="number" min={0} max={120}
              className="h-8 text-xs"
              placeholder="e.g. 18"
              value={filters.age_min}
              onChange={e => onFilters({ ...filters, age_min: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Age Max</Label>
            <Input
              type="number" min={0} max={120}
              className="h-8 text-xs"
              placeholder="e.g. 65"
              value={filters.age_max}
              onChange={e => onFilters({ ...filters, age_max: e.target.value })}
            />
          </div>

          {/* Duration in program */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Min Months in Program</Label>
            <Input
              type="number" min={0}
              className="h-8 text-xs"
              placeholder="e.g. 3"
              value={filters.duration_min}
              onChange={e => onFilters({ ...filters, duration_min: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Max Months in Program</Label>
            <Input
              type="number" min={0}
              className="h-8 text-xs"
              placeholder="e.g. 12"
              value={filters.duration_max}
              onChange={e => onFilters({ ...filters, duration_max: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}