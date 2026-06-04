import { jsPDF } from "jspdf";

/**
 * Generates a PDF of the BIT assessment and triggers download.
 *
 * @param {object} client - Client record
 * @param {object} barrierState - { [barrierKey]: { confirmed, selectedChallenges, challengeOthers, selectedActions, actionOthers, notes } }
 * @param {object} actionPlan - { recommendations, checkin_frequency, followup_methods, review_dates, progress, additional_notes }
 * @param {string} assessorName
 */
export function exportBitPdf(client, barrierState, actionPlan, assessorName) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;
  let y = 15;

  const LINE_H = 6;
  const SECTION_GAP = 5;

  function checkPage(needed = 10) {
    if (y + needed > pageH - 15) {
      doc.addPage();
      y = 15;
    }
  }

  function heading(text, size = 13) {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(26, 35, 126); // navy
    doc.text(text, marginL, y);
    y += size * 0.5;
    doc.setDrawColor(26, 35, 126);
    doc.setLineWidth(0.4);
    doc.line(marginL, y, pageW - marginR, y);
    y += 4;
    doc.setTextColor(30, 30, 30);
  }

  function subheading(text) {
    checkPage(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(text, marginL, y);
    y += LINE_H;
    doc.setTextColor(30, 30, 30);
  }

  function bodyText(text, indent = 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, contentW - indent);
    lines.forEach(line => {
      checkPage(LINE_H);
      doc.text(line, marginL + indent, y);
      y += LINE_H;
    });
  }

  function labelValue(label, value, indent = 0) {
    checkPage(LINE_H);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(label + ":", marginL + indent, y);
    doc.setFont("helvetica", "normal");
    const labelW = doc.getTextWidth(label + ": ");
    const val = value || "—";
    const lines = doc.splitTextToSize(val, contentW - indent - labelW);
    lines.forEach((line, i) => {
      checkPage(LINE_H);
      doc.text(line, marginL + indent + labelW, y);
      if (i < lines.length - 1) y += LINE_H;
    });
    y += LINE_H;
  }

  function pill(text, x, bgR, bgG, bgB) {
    doc.setFillColor(bgR, bgG, bgB);
    doc.setDrawColor(bgR - 20, bgG - 20, bgB - 20);
    const tw = doc.getTextWidth(text);
    doc.roundedRect(x, y - 4, tw + 6, 5.5, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(text, x + 3, y);
    return tw + 10;
  }

  // ── HEADER ──────────────────────────────────────────────────────────
  doc.setFillColor(26, 35, 126);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("Barrier Identification Tool (BIT)", marginL, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Candora Pathways Program", marginL, 17);
  doc.setTextColor(30, 30, 30);
  y = 28;

  // ── PARTICIPANT INFO ─────────────────────────────────────────────────
  heading("Participant Information", 11);
  const clientName = `${client?.first_name || ""} ${client?.last_name || ""}`.trim();
  const today = new Date().toLocaleDateString("en-CA");

  // Info grid: 3 columns
  const col1 = marginL, col2 = marginL + contentW / 3, col3 = marginL + (contentW * 2) / 3;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold"); doc.text("Participant Name", col1, y);
  doc.setFont("helvetica", "normal"); doc.text(clientName || "—", col1, y + 5);
  doc.setFont("helvetica", "bold"); doc.text("Date of Assessment", col2, y);
  doc.setFont("helvetica", "normal"); doc.text(today, col2, y + 5);
  doc.setFont("helvetica", "bold"); doc.text("Assessor", col3, y);
  doc.setFont("helvetica", "normal"); doc.text(assessorName || "—", col3, y + 5);
  y += 14;

  if (client?.compass_hsid) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold"); doc.text("Compass HSID#", col1, y);
    doc.setFont("helvetica", "normal"); doc.text(client.compass_hsid, col1, y + 5);
    y += 10;
  }

  y += SECTION_GAP;

  // ── BARRIER ASSESSMENT TABLE ──────────────────────────────────────────
  heading("Barrier Assessment Results", 11);

  const confirmedBarriers = Object.entries(barrierState)
    .filter(([, s]) => s.confirmed === true)
    .map(([key]) => key);

  if (confirmedBarriers.length === 0) {
    bodyText("No barriers identified.");
  } else {
    confirmedBarriers.forEach((barrierKey, idx) => {
      const state = barrierState[barrierKey];
      checkPage(20);

      // Barrier header row
      doc.setFillColor(240, 244, 255);
      doc.roundedRect(marginL, y - 4, contentW, 8, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(26, 35, 126);
      doc.text(`${idx + 1}. ${barrierKey}`, marginL + 3, y);
      doc.setTextColor(30, 30, 30);
      y += 8;

      // Challenges
      const challenges = [
        ...(state.selectedChallenges || []),
        ...(state.challengeOthers || []).filter(v => v.trim()),
      ];
      if (challenges.length > 0) {
        bodyText("Challenges identified:", 4);
        challenges.forEach(c => bodyText(`• ${c}`, 8));
      }

      // Actions
      const actions = [
        ...(state.selectedActions || []),
        ...(state.actionOthers || []).filter(v => v.trim()),
      ];
      if (actions.length > 0) {
        bodyText("Recommended actions:", 4);
        actions.forEach(a => bodyText(`• ${a}`, 8));
      }

      // Notes
      if (state.notes) {
        bodyText("Notes: " + state.notes, 4);
      }

      y += 3;
    });
  }

  y += SECTION_GAP;

  // ── ACTION PLAN SUMMARY ───────────────────────────────────────────────
  heading("Action Plan Summary", 11);

  if (actionPlan.recommendations) {
    subheading("Action Plan Recommendations");
    bodyText(actionPlan.recommendations, 4);
    y += 2;
  }

  if (actionPlan.checkin_frequency) {
    labelValue("Check-in Frequency", actionPlan.checkin_frequency);
  }

  if (actionPlan.followup_methods?.length > 0) {
    labelValue("Follow-Up Method(s)", actionPlan.followup_methods.join(", "));
  }

  const reviewDates = (actionPlan.review_dates || []).filter(Boolean);
  if (reviewDates.length > 0) {
    subheading("Scheduled Review Dates");
    reviewDates.forEach((d, i) => bodyText(`Review ${i + 1}: ${d}`, 4));
    y += 2;
  }

  if (actionPlan.progress) {
    labelValue("Progress Status", actionPlan.progress);
  }

  if (actionPlan.additional_notes) {
    subheading("Additional Notes");
    bodyText(actionPlan.additional_notes, 4);
  }

  y += SECTION_GAP;

  // ── SIGNATURE BLOCK ───────────────────────────────────────────────────
  checkPage(30);
  heading("Signatures", 11);
  const sigY = y;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  // Participant
  doc.line(marginL, sigY + 10, marginL + contentW / 2 - 5, sigY + 10);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
  doc.text("Participant Signature", marginL, sigY + 15);
  doc.text("Date: _______________", marginL, sigY + 20);
  // Assessor
  doc.line(marginL + contentW / 2 + 5, sigY + 10, pageW - marginR, sigY + 10);
  doc.text("Assessor Signature", marginL + contentW / 2 + 5, sigY + 15);
  doc.text("Date: _______________", marginL + contentW / 2 + 5, sigY + 20);
  y = sigY + 28;

  // ── FOOTER on all pages ───────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`Candora Pathways — BIT Assessment — ${clientName} — ${today}`, marginL, pageH - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageW - marginR - 18, pageH - 8);
  }

  const safeName = clientName.replace(/[^a-z0-9]/gi, "_") || "client";
  doc.save(`BIT_${safeName}_${today}.pdf`);
}