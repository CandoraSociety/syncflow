import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for clients with follow-ups due in 7 days, 3 days, or today
  const alertDays = [7, 3, 0];

  const clients = await base44.asServiceRole.entities.Client.list();

  const results = [];

  for (const client of clients) {
    if (!client.followup_90day_date) continue;
    // Skip if already completed
    if (client.followup_90day_status && client.followup_90day_status !== 'no_contact') continue;
    if (client.status === 'closed') continue;

    const followupDate = new Date(client.followup_90day_date);
    followupDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((followupDate - today) / (1000 * 60 * 60 * 24));

    if (!alertDays.includes(daysUntil)) continue;

    const workerEmail = client.assigned_worker;
    if (!workerEmail) continue;

    const clientName = `${client.first_name} ${client.last_name}`;
    const dueDateStr = followupDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

    let subject, urgency;
    if (daysUntil === 0) {
      urgency = "TODAY";
      subject = `[Action Required] 90-Day Follow-Up Due TODAY — ${clientName}`;
    } else {
      urgency = `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
      subject = `Reminder: 90-Day Follow-Up Due in ${daysUntil} Days — ${clientName}`;
    }

    const body = `
Hello,

This is a reminder that the 90-day employment follow-up for the following client is due ${urgency}:

Client: ${clientName}
Follow-Up Due Date: ${dueDateStr}
Service Stream: ${client.service_type || 'N/A'}
Current Employment Status: ${client.employment_status || 'Not recorded'}

Please contact the client and record their current employment status in the system as soon as possible.

You can update this record by visiting the client's profile in the case management system.

---
This is an automated reminder. Please do not reply to this email.
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: workerEmail,
      subject,
      body,
    });

    results.push({ client: clientName, worker: workerEmail, daysUntil });
  }

  return Response.json({
    message: `Processed ${clients.length} clients. Sent ${results.length} reminder(s).`,
    reminders: results,
  });
});