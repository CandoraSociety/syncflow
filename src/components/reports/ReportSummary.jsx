import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingUp, DollarSign, Briefcase, BookOpen, Award, Printer, FileDown, Share2, PieChart as PieIcon } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SERVICE_LABELS = {
  direct_to_employment: "DEA (Direct to Employment)",
  pathways: "Pathways",
  casual: "Casual",
  internal_referral: "Internal Referral",
  external_referral: "External Referral",
  not_eligible: "Not Eligible",
};

const EMP_STATUS_LABELS = {
  "E-RF": "Employed – Related Field (E-RF)",
  "E-UF": "Employed – Unrelated Field (E-UF)",
  "E-PT": "Employed – Part Time (E-PT)",
  "UE": "Unemployed (UE)",
  "UE-LA": "Unemployed – Looking Actively (UE-LA)",
  "UE-S": "Unemployed – Student (UE-S)",
  "NA": "Not Applicable (NA)",
  "no_contact": "No Contact",
};

const PIE_COLORS = [
  "#1a237e", "#7c3aed", "#0369a1", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#9333ea", "#64748b", "#1d4ed8",
  "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6",
];

function StatCard({ title, value, sub, icon: Icon, color = "text-primary" }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs font-semibold text-slate-600 mt-0.5">{title}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniPie({ rows }) {
  const data = rows.map((r, i) => ({
    name: r.label,
    value: r.count,
    fill: r.color || PIE_COLORS[i % PIE_COLORS.length],
  }));

  const renderLabel = (entry) => {
    const RADIAN = Math.PI / 180;
    const radius = 80 * 0.65; // Position inside the pie
    const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
    const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);
    const percent = ((entry.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0);

    if (percent < 3) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="bold"
      >
        {`${percent}%`}
      </text>
    );
  };

  return (
    <div className="mt-4 pt-3 border-t border-slate-100 -mx-6 px-6 pb-4">
      <div className="flex justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => val} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BreakdownCard({ title, rows, children }) {
  const [showPie, setShowPie] = useState(false);
  const hasData = rows && rows.length > 0;
  const total = hasData ? rows.reduce((s, r) => s + r.count, 0) : 0;

  return (
    <Card className="print-break-inside-avoid">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          {hasData && total > 0 && (
            <button
              onClick={() => setShowPie(p => !p)}
              title={showPie ? "Hide pie chart" : "Show pie chart"}
              className={`p-1 rounded hover:bg-slate-100 transition-colors ${showPie ? "text-primary" : "text-slate-400"}`}
            >
              <PieIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
        {showPie && hasData && <MiniPie rows={rows} />}
      </CardContent>
    </Card>
  );
}

function BreakdownTable({ title, rows }) {
  if (!rows || rows.length === 0) return null;
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div>
      {title && <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</h4>}
      <div className="space-y-2">
        {rows.map((r, i) => {
          const color = r.color || PIE_COLORS[i % PIE_COLORS.length];
          return (
            <div key={r.label} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-slate-700 truncate">{r.label}</span>
                  <span className="text-xs font-semibold text-slate-800 ml-2 shrink-0">{r.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: total > 0 ? `${(r.count / total) * 100}%` : "0%",
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt$(n) {
  if (!n && n !== 0) return "$0.00";
  return "$" + Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Helper to format filter display - shows "All X" if all options are selected
function formatFilterDisplay(filterKey, filterValue, allLabel, allClients = [], demographicFilters = []) {
  if (!filterValue || filterValue === "" || (Array.isArray(filterValue) && filterValue.length === 0)) {
    return allLabel;
  }
  if (!Array.isArray(filterValue)) {
    return filterValue;
  }
  // Check if all available options are selected
  const filterDef = demographicFilters.find(f => f.key === filterKey);
  if (filterDef) {
    const rawOptions = filterDef.fixedOptions
      ? filterDef.fixedOptions
      : allClients.map(c => c[filterKey]).filter(Boolean);
    const uniqueOptions = filterDef.fixedOptions ? rawOptions : [...new Set(rawOptions)];
    if (filterValue.length >= uniqueOptions.length) {
      return allLabel;
    }
  }
  return filterValue.join(', ');
}

export default function ReportSummary({ results, financialRecords, selectedSections = [], demographicOptions = [], onClear, onExportCSV, dateRange, appliedFilters, allClients, demographicFilters }) {
  const reportRef = useRef(null);

  // Helper to check if all options for a filter are selected
  const getAllFilterOptions = (key) => {
    const filter = demographicFilters.find(f => f.key === key);
    if (!filter) return [];
    if (filter.fixedOptions) return filter.fixedOptions.map(o => o.value);
    return [...new Set(allClients.map(c => c[key]).filter(Boolean))].sort();
  };

  const formatFilterDisplay = (key, value, allLabel) => {
    if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
      return allLabel || 'All';
    }
    const allOptions = getAllFilterOptions(key);
    if (Array.isArray(value) && allOptions.length > 0 && value.length === allOptions.length) {
      return allLabel || 'All';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  const formatSimpleFilter = (value, allLabel) => {
    if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
      return allLabel;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  const formatMultiSelectFilter = (key, value, allLabel) => {
    if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
      return allLabel;
    }
    const allOptions = getAllFilterOptions(key);
    // Check if all available options are selected
    if (Array.isArray(value) && allOptions.length > 0 && value.length === allOptions.length) {
      return allLabel;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  const handlePrint = () => window.print();

  const printStyles = `
    @media print {
      @page {
        margin: 20mm 15mm 20mm 15mm;
        size: A4 portrait;
      }
      
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .no-print {
        display: none !important;
      }
      
      .print-break-inside-avoid {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      
      .print-break-before {
        break-before: page;
        page-break-before: always;
      }
      
      /* Add page breaks between major sections */
      .print-section-break {
        break-before: page;
        page-break-before: always;
        margin-top: 20px;
      }
    }
  `;

  const handleSavePDF = async () => {
    const { jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    if (!reportRef.current) return;
    toast("Generating PDF…");
    try {
      // Capture the report with high quality
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, 
        useCORS: true,
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true,
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Margins (in mm)
      const marginLeft = 15;
      const marginRight = 15;
      const marginTop = 15;
      const marginBottom = 15;
      const availableWidth = pageWidth - marginLeft - marginRight;
      const availablePageHeight = pageHeight - marginTop - marginBottom;
      
      // Scale image to fit page width while maintaining aspect ratio
      const scale = availableWidth / imgWidth;
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      
      // Slice the image across multiple pages
      let sourceY = 0; // Position in the source image (in scaled mm)
      let pageNum = 0;
      
      while (sourceY < scaledHeight) {
        if (pageNum > 0) {
          pdf.addPage();
        }
        
        // Calculate how much of the image to show on this page
        const remainingHeight = scaledHeight - sourceY;
        const drawHeight = Math.min(remainingHeight, availablePageHeight);
        
        // Convert source Y from mm to pixels for clipping
        const sourceYPixels = (sourceY / scale);
        const drawHeightPixels = (drawHeight / scale);
        
        // Add clipped image slice to PDF
        // jsPDF addImage supports: image, format, x, y, w, h, undefined, compression, rotation, srcX, srcY, srcW, srcH
        pdf.addImage(
          imgData, 
          "PNG", 
          marginLeft, 
          marginTop, 
          scaledWidth, 
          drawHeight,
          undefined,
          'FAST',
          0,
          sourceYPixels,
          imgWidth,
          drawHeightPixels
        );
        
        // Move to next page section
        sourceY += drawHeight;
        pageNum++;
      }
      
      pdf.save(`report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF saved!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Client Report", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const stats = useMemo(() => {
    if (!results || results.length === 0) return null;

    const total = results.length;

    const streamCounts = {};
    results.forEach(c => {
      const s = c.service_type || "unknown";
      streamCounts[s] = (streamCounts[s] || 0) + 1;
    });
    const streamRows = Object.entries(streamCounts).map(([k, v]) => ({
      label: SERVICE_LABELS[k] || k,
      count: v,
      color: k === "direct_to_employment" ? "#1a237e" : k === "pathways" ? "#7c3aed" : k === "casual" ? "#0369a1" : "#64748b",
    })).sort((a, b) => b.count - a.count);

    const deaClients = results.filter(c => c.service_type === "direct_to_employment");
    const pathwaysClients = results.filter(c => c.service_type === "pathways");
    const deaStarters = deaClients.filter(c => c.service_start_date).length;
    const deaCompleters = deaClients.filter(c => c.program_status === "complete").length;
    const pathwaysStarters = pathwaysClients.filter(c => c.service_start_date).length;
    const pathwaysCompleters = pathwaysClients.filter(c => c.program_status === "complete").length;

    const employed = results.filter(c =>
      c.post_completion_employment_status && ["E-RF", "E-UF", "E-PT"].includes(c.post_completion_employment_status)
    ).length;
    const followup90Employed = results.filter(c =>
      c.followup_90day_status && ["E-RF", "E-UF", "E-PT"].includes(c.followup_90day_status)
    ).length;

    const intakeEmpCounts = {};
    results.forEach(c => {
      const s = c.employment_status || "unknown";
      intakeEmpCounts[s] = (intakeEmpCounts[s] || 0) + 1;
    });
    const intakeEmpRows = Object.entries(intakeEmpCounts)
      .map(([k, v]) => ({ label: EMP_STATUS_LABELS[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);

    const postEmpCounts = {};
    results.filter(c => c.post_completion_employment_status).forEach(c => {
      postEmpCounts[c.post_completion_employment_status] = (postEmpCounts[c.post_completion_employment_status] || 0) + 1;
    });
    const postEmpRows = Object.entries(postEmpCounts)
      .map(([k, v]) => ({ label: EMP_STATUS_LABELS[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);

    const fu90Counts = {};
    results.filter(c => c.followup_90day_status).forEach(c => {
      fu90Counts[c.followup_90day_status] = (fu90Counts[c.followup_90day_status] || 0) + 1;
    });
    const fu90Rows = Object.entries(fu90Counts)
      .map(([k, v]) => ({ label: EMP_STATUS_LABELS[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);

    const caseStatusCounts = {};
    results.forEach(c => {
      const s = c.status || "unknown";
      caseStatusCounts[s] = (caseStatusCounts[s] || 0) + 1;
    });
    const caseStatusRows = Object.entries(caseStatusCounts)
      .map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), count: v }))
      .sort((a, b) => b.count - a.count);

    const programStatusCounts = {};
    results.forEach(c => {
      if (!c.program_status) return;
      programStatusCounts[c.program_status] = (programStatusCounts[c.program_status] || 0) + 1;
    });
    const programStatusRows = Object.entries(programStatusCounts)
      .map(([k, v]) => ({ label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), count: v }))
      .sort((a, b) => b.count - a.count);

    const referralCounts = {};
    results.forEach(c => {
      if (!c.referral_source) return;
      referralCounts[c.referral_source] = (referralCounts[c.referral_source] || 0) + 1;
    });
    const referralRows = Object.entries(referralCounts)
      .map(([k, v]) => ({ label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), count: v }))
      .sort((a, b) => b.count - a.count);

    const clientIds = new Set(results.map(c => c.id));
    const relevantFinancials = financialRecords.filter(r => clientIds.has(r.client_id));
    const exposureRecords = relevantFinancials.filter(r => r.record_type === "exposure_course");
    const placementRecords = relevantFinancials.filter(r => r.record_type === "paid_external_placement");
    const supportsRecords = relevantFinancials.filter(r => r.record_type === "employment_supports");
    const totalExposure = exposureRecords.reduce((s, r) => s + (r.amount || 0), 0);
    const totalPlacement = placementRecords.reduce((s, r) => s + (r.amount || 0), 0);
    const totalSupports = supportsRecords.reduce((s, r) => s + (r.amount || 0), 0);

    const barrierCounts = {};
    results.forEach(c => {
      [c.barrier_1, c.barrier_2, c.barrier_3].filter(Boolean).forEach(b => {
        barrierCounts[b] = (barrierCounts[b] || 0) + 1;
      });
    });
    const barrierRows = Object.entries(barrierCounts)
      .map(([k, v]) => ({ label: k, count: v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Client demographics breakdown
    const ageGroups = {};
    const today = new Date();
    results.forEach(c => {
      if (!c.date_of_birth) return;
      const birthDate = new Date(c.date_of_birth);
      const age = today.getFullYear() - birthDate.getFullYear() - (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);
      const group = age < 25 ? "Under 25" : age < 35 ? "25-34" : age < 45 ? "35-44" : age < 55 ? "45-54" : age < 65 ? "55-64" : "65+";
      ageGroups[group] = (ageGroups[group] || 0) + 1;
    });
    const ageRows = Object.entries(ageGroups)
      .map(([k, v]) => ({ label: k, count: v }))
      .sort((a, b) => {
        const order = ["Under 25", "25-34", "35-44", "45-54", "55-64", "65+"];
        return order.indexOf(a.label) - order.indexOf(b.label);
      });

    const residencyCounts = {};
    results.forEach(c => {
      if (!c.residency_status) return;
      residencyCounts[c.residency_status] = (residencyCounts[c.residency_status] || 0) + 1;
    });
    const residencyRows = Object.entries(residencyCounts)
      .map(([k, v]) => ({ label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), count: v }))
      .sort((a, b) => b.count - a.count);

    const cityCounts = {};
    results.forEach(c => {
      if (!c.city) return;
      cityCounts[c.city] = (cityCounts[c.city] || 0) + 1;
    });
    const cityRows = Object.entries(cityCounts)
      .map(([k, v]) => ({ label: k, count: v }))
      .sort((a, b) => b.count - a.count);

    // Postal code distribution (FSA - first 3 characters)
    const postalCounts = {};
    results.forEach(c => {
      if (!c.zip) return;
      const fsa = c.zip.replace(/\s/g, "").slice(0, 3).toUpperCase();
      if (fsa.length === 3 && fsa.match(/^[A-Z][0-9][A-Z]$/)) {
        postalCounts[fsa] = (postalCounts[fsa] || 0) + 1;
      }
    });
    const postalRows = Object.entries(postalCounts)
      .map(([k, v]) => ({ label: k, count: v }))
      .sort((a, b) => b.count - a.count);

    const genderCounts = {};
    results.forEach(c => {
      // Note: gender field may not exist, adjust if needed
      if (c.gender) genderCounts[c.gender] = (genderCounts[c.gender] || 0) + 1;
    });
    const genderRows = Object.entries(genderCounts)
      .map(([k, v]) => ({ label: k, count: v }))
      .sort((a, b) => b.count - a.count);

    // Financial rows for pie
    const financialRows = [
      { label: "Exposure Courses", count: exposureRecords.length, color: "#f59e0b" },
      { label: "Paid Placements", count: placementRecords.length, color: "#10b981" },
      { label: "Employment Supports", count: supportsRecords.length, color: "#6366f1" },
    ].filter(r => r.count > 0);

    return {
      total,
      streamRows,
      deaStarters, deaCompleters,
      pathwaysStarters, pathwaysCompleters,
      employed, followup90Employed,
      intakeEmpRows, postEmpRows, fu90Rows,
      caseStatusRows, programStatusRows,
      referralRows, barrierRows, financialRows,
      exposureCount: exposureRecords.length,
      placementCount: placementRecords.length,
      supportsCount: supportsRecords.length,
      totalExposure, totalPlacement, totalSupports,
      totalDirect: totalExposure + totalPlacement + totalSupports,
      ageRows,
      residencyRows,
      cityRows,
      postalRows,
      genderRows,
    };
  }, [results, financialRecords]);

  if (!stats) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No clients match the selected filters.
      </div>
    );
  }

  const show = (key) => {
    if (selectedSections.length === 0) return true;
    if (!selectedSections.includes(key)) return false;
    // For client_demographics, check individual sub-options
    if (key === "client_demographics") return true;
    return true;
  };

  const showDemographic = (key) => {
    if (!selectedSections.includes("client_demographics")) return false;
    return demographicOptions.includes(key);
  };

  return (
    <div className="space-y-6">
      <style>{printStyles}</style>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{stats.total} Client{stats.total !== 1 ? "s" : ""} in Report</h2>
          <p className="text-xs text-slate-500">Aggregated summary across filtered clients</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportCSV}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSavePDF}>
            <FileDown className="w-3.5 h-3.5" /> Save as PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
        </div>
      </div>

      <div ref={reportRef} className="print-break-inside-avoid">
        {/* Print/PDF Header */}
        <div className="mb-6 pb-6 border-b-2 border-slate-200 bg-white print-break-inside-avoid">
          <div className="flex items-center gap-4 mb-4">
            <img src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/bf0d54770_Candoracirclelogo_noanniversary.png" alt="Candora" className="h-16 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Pathways Summary Report</h1>
              <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          {/* Report Scope Section */}
          <div className="bg-slate-50 rounded-lg p-4 text-xs space-y-2">
            <p className="font-semibold text-slate-700 uppercase tracking-wide">Report Scope</p>
            <div className="grid grid-cols-4 gap-x-3 gap-y-2">
              {/* Date Range - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Date Range</p>
                <p className="text-slate-600">
                  {dateRange.from || 'All time'} → {dateRange.from ? dateRange.to : new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              
              {/* Service Streams - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Service Streams</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('service_type', appliedFilters.service_type, 'All streams')}>
                  {formatMultiSelectFilter('service_type', appliedFilters.service_type, 'All streams')}
                </p>
              </div>
              
              {/* Case Status - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Case Status</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('status', appliedFilters.status, 'All statuses')}>
                  {formatMultiSelectFilter('status', appliedFilters.status, 'All statuses')}
                </p>
              </div>
              
              {/* Program Status - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Program Status</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('program_status', appliedFilters.program_status, 'All statuses')}>
                  {formatMultiSelectFilter('program_status', appliedFilters.program_status, 'All statuses')}
                </p>
              </div>
              
              {/* Residency Status - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Residency Status</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('residency_status', appliedFilters.residency_status, 'All statuses')}>
                  {formatMultiSelectFilter('residency_status', appliedFilters.residency_status, 'All statuses')}
                </p>
              </div>
              
              {/* CLB Level - always shown */}
              <div>
                <p className="font-semibold text-slate-700">CLB Level</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('clb_level', appliedFilters.clb_level, 'All levels')}>
                  {formatMultiSelectFilter('clb_level', appliedFilters.clb_level, 'All levels')}
                </p>
              </div>
              
              {/* Employment Status - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Employment Status</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('employment_status', appliedFilters.employment_status, 'All statuses')}>
                  {formatMultiSelectFilter('employment_status', appliedFilters.employment_status, 'All statuses')}
                </p>
              </div>
              
              {/* Referral Source - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Referral Source</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('referral_source', appliedFilters.referral_source, 'All sources')}>
                  {formatMultiSelectFilter('referral_source', appliedFilters.referral_source, 'All sources')}
                </p>
              </div>
              
              {/* Career Counsellor - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Career Counsellor</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('assigned_worker_name', appliedFilters.assigned_worker_name, 'All counsellors')}>
                  {formatMultiSelectFilter('assigned_worker_name', appliedFilters.assigned_worker_name, 'All counsellors')}
                </p>
              </div>
              
              {/* Barrier Type - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Barrier Type</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('barrier_1', appliedFilters.barrier_1, 'All types')}>
                  {formatMultiSelectFilter('barrier_1', appliedFilters.barrier_1, 'All types')}
                </p>
              </div>
              
              {/* Has Vehicle - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Has Vehicle</p>
                <p className="text-slate-600 truncate" title={formatSimpleFilter(appliedFilters.has_vehicle, 'All')}>
                  {formatSimpleFilter(appliedFilters.has_vehicle, 'All')}
                </p>
              </div>
              
              {/* City - always shown */}
              <div>
                <p className="font-semibold text-slate-700">City</p>
                <p className="text-slate-600 truncate" title={formatSimpleFilter(appliedFilters.city, 'All cities')}>
                  {formatSimpleFilter(appliedFilters.city, 'All cities')}
                </p>
              </div>
              
              {/* Close Reason - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Close Reason</p>
                <p className="text-slate-600 truncate" title={formatMultiSelectFilter('closed_reason', appliedFilters.closed_reason, 'All reasons')}>
                  {formatMultiSelectFilter('closed_reason', appliedFilters.closed_reason, 'All reasons')}
                </p>
              </div>
              
              {/* Compass Verified - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Compass Verified</p>
                <p className="text-slate-600 truncate" title={formatSimpleFilter(appliedFilters.compass_verified, 'All')}>
                  {formatSimpleFilter(appliedFilters.compass_verified, 'All')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top stats - Page 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 print-break-inside-avoid">
          <StatCard title="Total Clients" value={stats.total} icon={Users} color="text-primary" />
          {show("starters_completers") && (
            <StatCard title="Employment Outcomes" value={stats.employed} sub="post-completion employed" icon={Briefcase} color="text-green-600" />
          )}
          {show("employment_90day") && (
            <StatCard title="90-Day Sustained" value={stats.followup90Employed} sub="employed at follow-up" icon={Award} color="text-purple-600" />
          )}
          {show("financial_summary") && (
            <StatCard title="Total Direct Costs" value={fmt$(stats.totalDirect)} sub="courses + placements + supports" icon={DollarSign} color="text-amber-600" />
          )}
        </div>

        {/* Program outcomes - Page 2 */}
        {show("starters_completers") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print-break-inside-avoid print-section-break">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Program Starters & Completers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "DEA Starters", value: stats.deaStarters, color: "bg-blue-50 border-blue-200 text-blue-800" },
                    { label: "DEA Completers", value: stats.deaCompleters, color: "bg-blue-100 border-blue-300 text-blue-900" },
                    { label: "Pathways Starters", value: stats.pathwaysStarters, color: "bg-purple-50 border-purple-200 text-purple-800" },
                    { label: "Pathways Completers", value: stats.pathwaysCompleters, color: "bg-purple-100 border-purple-300 text-purple-900" },
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg border p-3 ${item.color}`}>
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-xs font-medium mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {show("financial_summary") && (
              <BreakdownCard title="Financial Summary" rows={stats.financialRows}>
                <div className="space-y-3">
                  {[
                    { label: "Exposure Courses", count: stats.exposureCount, total: stats.totalExposure, color: "#f59e0b" },
                    { label: "Paid External Placements", count: stats.placementCount, total: stats.totalPlacement, color: "#10b981" },
                    { label: "Employment Supports", count: stats.supportsCount, total: stats.totalSupports, color: "#6366f1" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-slate-700">{item.label}</span>
                        <span className="text-xs text-slate-400">({item.count} records)</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{fmt$(item.total)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-700">Total</span>
                    <span className="text-sm font-bold text-slate-900">{fmt$(stats.totalDirect)}</span>
                  </div>
                </div>
              </BreakdownCard>
            )}
          </div>
        )}

        {/* Breakdowns grid - Page 2/3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print-break-inside-avoid print-section-break">
          {show("service_stream") && (
            <BreakdownCard title="Service Stream" rows={stats.streamRows}>
              <BreakdownTable rows={stats.streamRows} />
            </BreakdownCard>
          )}

          {show("case_program_status") && (
            <>
              <BreakdownCard title="Case Status" rows={stats.caseStatusRows}>
                <BreakdownTable rows={stats.caseStatusRows} />
              </BreakdownCard>
              {stats.programStatusRows.length > 0 && (
                <BreakdownCard title="Program Status" rows={stats.programStatusRows}>
                  <BreakdownTable rows={stats.programStatusRows} />
                </BreakdownCard>
              )}
            </>
          )}

          {show("referral_source") && (
            <BreakdownCard title="Referral Source" rows={stats.referralRows}>
              <BreakdownTable rows={stats.referralRows} />
            </BreakdownCard>
          )}

          {show("employment_intake") && (
            <BreakdownCard title="Employment Status at Intake" rows={stats.intakeEmpRows}>
              <BreakdownTable rows={stats.intakeEmpRows} />
            </BreakdownCard>
          )}

          {show("employment_post") && stats.postEmpRows.length > 0 && (
            <BreakdownCard title="Post-Completion Employment Status" rows={stats.postEmpRows}>
              <BreakdownTable rows={stats.postEmpRows} />
            </BreakdownCard>
          )}

          {show("employment_90day") && stats.fu90Rows.length > 0 && (
            <BreakdownCard title="90-Day Follow-Up Status" rows={stats.fu90Rows}>
              <BreakdownTable rows={stats.fu90Rows} />
            </BreakdownCard>
          )}

          {show("barriers") && stats.barrierRows.length > 0 && (
            <BreakdownCard title="Top Barriers Identified" rows={stats.barrierRows}>
              <BreakdownTable rows={stats.barrierRows} />
            </BreakdownCard>
          )}

          {show("client_demographics") && (
            <>
              <div className="md:col-span-2 lg:col-span-3">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Client Demographics</h4>
              </div>
              {showDemographic("age_distribution") && stats.ageRows && stats.ageRows.length > 0 && (
                <BreakdownCard title="Age Distribution" rows={stats.ageRows}>
                  <BreakdownTable rows={stats.ageRows} />
                </BreakdownCard>
              )}
              {showDemographic("residency_status") && stats.residencyRows && stats.residencyRows.length > 0 && (
                <BreakdownCard title="Residency Status" rows={stats.residencyRows}>
                  <BreakdownTable rows={stats.residencyRows} />
                </BreakdownCard>
              )}
              {showDemographic("city_distribution") && stats.cityRows && stats.cityRows.length > 0 && (
                <BreakdownCard title="City Distribution" rows={stats.cityRows}>
                  <BreakdownTable rows={stats.cityRows} />
                </BreakdownCard>
              )}
              {showDemographic("postal_code_distribution") && stats.postalRows && stats.postalRows.length > 0 && (
                <BreakdownCard title="Postal Code Distribution (FSA)" rows={stats.postalRows}>
                  <BreakdownTable rows={stats.postalRows} />
                </BreakdownCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}