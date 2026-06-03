/**
 * Compass Task Generator
 * Call createCompassTask() whenever a Compass-relevant change is saved.
 * Deduplication: if a pending task of the same type+client already exists, it will be replaced.
 */
import { base44 } from "@/api/base44Client";

/**
 * @param {object} params
 * @param {string} params.client_id
 * @param {string} params.client_name
 * @param {string} [params.compass_hsid]
 * @param {string} params.task_type  - unique key per trigger (e.g. "new_client", "service_type_change")
 * @param {string} params.title
 * @param {string} params.instructions
 */
export async function createCompassTask({ client_id, client_name, compass_hsid, task_type, title, instructions }) {
  try {
    // Check for existing pending task of same type for same client — replace it
    const existing = await base44.entities.CompassTask.filter({
      client_id,
      task_type,
      status: "pending",
    });
    for (const t of existing) {
      await base44.entities.CompassTask.delete(t.id);
    }

    let triggered_by = "";
    let triggered_by_name = "";
    try {
      const me = await base44.auth.me();
      triggered_by = me?.email || "";
      triggered_by_name = me?.full_name || me?.email || "";
    } catch (_) {}

    await base44.entities.CompassTask.create({
      client_id,
      client_name,
      compass_hsid: compass_hsid || "",
      task_type,
      title,
      instructions,
      triggered_by,
      triggered_by_name,
      status: "pending",
    });
  } catch (err) {
    console.error("Failed to create Compass task:", err);
  }
}

// ─── Task definitions per trigger ───────────────────────────────────────────

export function taskNewClient(client) {
  return {
    task_type: "new_client",
    title: `New client intake: ${client.first_name} ${client.last_name}`,
    instructions:
      `A new client has been added to the system.\n\n` +
      `Action: Create a new client file in Compass.\n\n` +
      `Client details:\n` +
      `• Name: ${client.first_name} ${client.last_name}\n` +
      `• DOB: ${client.date_of_birth || "not set"}\n` +
      `• Residency Status: ${client.residency_status?.replace(/_/g, " ") || "not set"}\n` +
      `• Service Element: ${client.service_type?.replace(/_/g, " ") || "not set"}\n` +
      `• Intake Date: ${client.intake_date || "not set"}\n\n` +
      `Enter all demographic and intake information into Compass and record the HSID# back in this app.`,
  };
}

export function taskStreamSwitch(client, fromStream, toStream, reason) {
  return {
    task_type: "stream_switch",
    title: `Program stream switched: ${client.first_name} ${client.last_name}`,
    instructions:
      `This client's program stream has been switched.\n\n` +
      `From: ${fromStream?.replace(/_/g, " ")}\n` +
      `To: ${toStream?.replace(/_/g, " ")}\n` +
      `Reason: ${reason?.replace(/_/g, " ")}\n\n` +
      `Action: Update the service element / stream in Compass to "${toStream?.replace(/_/g, " ")}".\n` +
      `Client HSID#: ${client.compass_hsid || "unknown — check client profile"}`,
  };
}

export function taskServiceTypeChange(client, newType) {
  return {
    task_type: "service_type_change",
    title: `Service element updated: ${client.first_name} ${client.last_name}`,
    instructions:
      `The Service Element (stream) for this client has been changed.\n\n` +
      `New Service Element: ${newType?.replace(/_/g, " ")}\n\n` +
      `Action: Update the service element / stream in Compass to reflect this change.\n` +
      `Client HSID#: ${client.compass_hsid || "unknown — check client profile"}`,
  };
}

export function taskStatusChange(client, newStatus) {
  return {
    task_type: "program_status_change",
    title: `Program status changed: ${client.first_name} ${client.last_name}`,
    instructions:
      `The program status for this client has been updated.\n\n` +
      `New Status: ${newStatus?.replace(/_/g, " ")}\n\n` +
      `Action: Update the program/file status in Compass accordingly.\n` +
      `• If "Complete" — record completion date: ${client.completion_date || "not set"}\n` +
      `• If "Incomplete" or "Cancelled" — record termination reason\n` +
      `Client HSID#: ${client.compass_hsid || "unknown — check client profile"}`,
  };
}

export function taskEmploymentOutcome(client, employmentStatus) {
  const employed = ["E-RF", "E-UF", "E-PT"].includes(employmentStatus);
  return {
    task_type: "employment_outcome",
    title: `Employment outcome recorded: ${client.first_name} ${client.last_name}`,
    instructions:
      `An employment outcome has been recorded for this client.\n\n` +
      `Employment Status: ${employmentStatus}\n` +
      (employed
        ? `Employer: ${client.employer_name || "not set"}\n` +
          `Job Title: ${client.job_title || "not set"}\n` +
          `Start Date: ${client.job_start_date || client.employment_start_date || "not set"}\n\n`
        : "\n") +
      `Action: Record the employment outcome in Compass, including employer and start date if applicable.\n` +
      `Client HSID#: ${client.compass_hsid || "unknown — check client profile"}`,
  };
}

export function taskPostCompletionEmployment(client, status) {
  return {
    task_type: "post_completion_employment",
    title: `Post-completion employment updated: ${client.first_name} ${client.last_name}`,
    instructions:
      `Post-program completion employment status has been recorded.\n\n` +
      `Status: ${status}\n` +
      `Date: ${client.post_completion_employment_date || "not set"}\n\n` +
      `Action: Enter post-completion follow-up employment data into Compass.\n` +
      `Client HSID#: ${client.compass_hsid || "unknown — check client profile"}`,
  };
}

export function task90DayFollowup(client, status) {
  return {
    task_type: "followup_90day",
    title: `90-day follow-up recorded: ${client.first_name} ${client.last_name}`,
    instructions:
      `A 90-day follow-up has been completed for this client.\n\n` +
      `Follow-Up Status: ${status}\n` +
      `Follow-Up Date: ${client.followup_90day_date || "not set"}\n\n` +
      `Action: Enter the 90-day employment outcome into Compass.\n` +
      `Client HSID#: ${client.compass_hsid || "unknown — check client profile"}`,
  };
}

export function taskFileClosed(client) {
  return {
    task_type: "file_closed",
    title: `File closed: ${client.first_name} ${client.last_name}`,
    instructions:
      `This client file has been closed in the system.\n\n` +
      `Reason: ${client.closed_reason?.replace(/_/g, " ") || "not specified"}\n` +
      `Date Closed: ${client.closed_date || "not set"}\n` +
      `Notes: ${client.closed_notes || "none"}\n\n` +
      `Action: Close or update the client file in Compass to reflect this closure.\n` +
      `Client HSID#: ${client.compass_hsid || "unknown — check client profile"}`,
  };
}

export function taskServiceNavigation(client) {
  return {
    task_type: "service_navigation",
    title: `Service navigation supports: ${client.first_name} ${client.last_name}`,
    instructions:
      `Service navigation supports have been recorded for this client.\n\n` +
      `Date: ${client.service_navigation_date || "not set"}\n\n` +
      `Action: Record the service navigation activity in Compass.\n` +
      `Client HSID#: ${client.compass_hsid || "unknown — check client profile"}`,
  };
}

export function taskBarriersIdentified(client) {
  const barriers = [client.barrier_1, client.barrier_2, client.barrier_3].filter(Boolean);
  return {
    task_type: "barriers_identified",
    title: `Barriers identified: ${client.first_name} ${client.last_name}`,
    instructions:
      `Employment barriers have been identified for this client and need to be recorded in Compass.\n\n` +
      `Barriers:\n${barriers.map(b => `• ${b}`).join("\n") || "• (see service plan)"}\n\n` +
      `Action: Enter barrier information in the client's Compass profile under the relevant service plan section.\n` +
      `Client HSID#: ${client.compass_hsid || "unknown — check client profile"}`,
  };
}