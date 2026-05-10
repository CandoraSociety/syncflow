import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Placement → staff email mapping (update as needed)
const INTERNAL_PLACEMENT_EMAILS = {
  cleaning_arc: "priscilla@candorasociety.com",
  food_services_onsite: "priscilla@candorasociety.com",
  food_services_offsite: "priscilla@candorasociety.com",
  reception: "priscilla@candorasociety.com",
  childcare: "priscilla@candorasociety.com",
};

// Internal referral → staff email mapping
const INTERNAL_REFERRAL_EMAILS = {
  ell: "priscilla@candorasociety.com",
  empoweru: "priscilla@candorasociety.com",
  digital_literacy: "priscilla@candorasociety.com",
  family_programs: "priscilla@candorasociety.com",
};

// External referral → email mapping
const EXTERNAL_REFERRAL_EMAILS = {
  christcity_lighthouse: "priscilla@candorasociety.com",
};

// Service navigator (barriers) email
const SERVICE_NAVIGATOR_EMAIL = "Dawn.williston@candorasociety.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alert_type, client_name, client_id, placement, referrals, barriers } = await req.json();

    const emailsToSend = [];

    if (alert_type === 'internal_placement' && placement && INTERNAL_PLACEMENT_EMAILS[placement]) {
      emailsToSend.push({
        to: INTERNAL_PLACEMENT_EMAILS[placement],
        subject: `New Internal Placement: ${client_name}`,
        body: `A client has been assigned to an internal placement.\n\nClient: ${client_name}\nPlacement: ${placement.replace(/_/g, ' ')}\nClient ID: ${client_id}\n\nPlease log in to the system to view the full client file.`
      });
    }

    if (alert_type === 'internal_referrals' && referrals?.length > 0) {
      for (const ref of referrals) {
        const email = INTERNAL_REFERRAL_EMAILS[ref];
        if (email) {
          emailsToSend.push({
            to: email,
            subject: `New Internal Referral: ${client_name}`,
            body: `A client has been referred to your program.\n\nClient: ${client_name}\nReferral: ${ref.replace(/_/g, ' ')}\nClient ID: ${client_id}\n\nPlease log in to the system to view the full client file.`
          });
        }
      }
    }

    if (alert_type === 'external_referrals' && referrals?.length > 0) {
      for (const ref of referrals) {
        const email = EXTERNAL_REFERRAL_EMAILS[ref];
        if (email) {
          emailsToSend.push({
            to: email,
            subject: `New External Referral: ${client_name}`,
            body: `A client has been referred to your organization.\n\nClient: ${client_name}\nReferral: ${ref.replace(/_/g, ' ')}\nClient ID: ${client_id}\n\nPlease contact the referring agency for more details.`
          });
        }
      }
    }

    if (alert_type === 'barriers' && barriers?.length > 0) {
      emailsToSend.push({
        to: SERVICE_NAVIGATOR_EMAIL,
        subject: `Barriers Identified – Client Needs Service Navigation: ${client_name}`,
        body: `A client has been flagged for service navigation support.\n\nClient: ${client_name}\nClient ID: ${client_id}\nBarriers identified: ${barriers.filter(Boolean).join(', ')}\n\nPlease log in to the system to view the full client file and coordinate support.`
      });
    }

    // Send all emails
    for (const emailData of emailsToSend) {
      await base44.integrations.Core.SendEmail({
        from_name: "Candora Society – Case Management",
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
      });
    }

    return Response.json({ sent: emailsToSend.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});