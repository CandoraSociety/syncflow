export const PLACEMENT_LABELS = {
  cleaning_arc: "Cleaning Services (ARC)",
  food_services_onsite: "Food Services (Onsite)",
  food_services_offsite: "Food Services (Offsite)",
  reception: "Reception",
  childcare: "Childcare",
};

export const TRANSPORTATION_OPTIONS = [
  { value: "has_own_vehicle", label: "Has own vehicle" },
  { value: "no_vehicle_willing_to_bus", label: "No vehicle — willing to bus to location" },
  { value: "no_vehicle_not_willing_to_bus", label: "No vehicle — not willing to bus to location" },
  { value: "transit_pass_provided", label: "Transit pass will be / has been provided" },
  { value: "requires_transportation_support", label: "Requires transportation support (to be arranged)" },
  { value: "offsite_not_applicable", label: "N/A — placement is onsite" },
];

export const EVAL_OPTIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "satisfactory", label: "Satisfactory" },
  { value: "needs_improvement", label: "Needs Improvement" },
  { value: "unsatisfactory", label: "Unsatisfactory" },
];

export const WOULD_HIRE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "yes_with_conditions", label: "Yes, with conditions" },
  { value: "no", label: "No" },
  { value: "not_applicable", label: "Not applicable" },
];

// Standardized training plan items per placement type
// Each item can be toggled as a focus area for an individual client
export const STANDARD_PLAN_ITEMS = {
  cleaning_arc: [
    { id: "safety_equipment", label: "Proper use of safety equipment & PPE" },
    { id: "cleaning_chemicals", label: "Handling and storing cleaning chemicals" },
    { id: "cleaning_techniques", label: "Standard cleaning techniques & protocols" },
    { id: "time_management", label: "Time management and task scheduling" },
    { id: "workplace_communication", label: "Workplace communication & professionalism" },
    { id: "equipment_operation", label: "Operation and maintenance of cleaning equipment" },
    { id: "health_hygiene", label: "Health and hygiene standards" },
  ],
  food_services_onsite: [
    { id: "food_safety", label: "Food safety and WHMIS" },
    { id: "hygiene_standards", label: "Personal hygiene standards" },
    { id: "food_prep", label: "Food preparation techniques" },
    { id: "kitchen_equipment", label: "Kitchen equipment operation" },
    { id: "customer_service", label: "Customer service / front-of-house interactions" },
    { id: "inventory", label: "Inventory and portioning basics" },
    { id: "teamwork", label: "Teamwork in a fast-paced kitchen environment" },
  ],
  food_services_offsite: [
    { id: "food_safety", label: "Food safety and WHMIS" },
    { id: "hygiene_standards", label: "Personal hygiene standards" },
    { id: "food_prep", label: "Food preparation techniques" },
    { id: "kitchen_equipment", label: "Kitchen equipment operation" },
    { id: "customer_service", label: "Customer service / front-of-house interactions" },
    { id: "inventory", label: "Inventory and portioning basics" },
    { id: "teamwork", label: "Teamwork in a fast-paced kitchen environment" },
    { id: "transportation_readiness", label: "Transportation readiness for offsite location" },
  ],
  reception: [
    { id: "phone_etiquette", label: "Phone etiquette and call handling" },
    { id: "scheduling", label: "Scheduling and appointment management" },
    { id: "computer_skills", label: "Basic computer and software skills" },
    { id: "filing", label: "Filing and records management" },
    { id: "professional_communication", label: "Professional written and verbal communication" },
    { id: "customer_greeting", label: "Client/visitor greeting and front desk procedures" },
    { id: "confidentiality", label: "Confidentiality and information handling" },
  ],
  childcare: [
    { id: "child_development", label: "Child development fundamentals" },
    { id: "safety_supervision", label: "Child safety and supervision practices" },
    { id: "activity_planning", label: "Age-appropriate activity planning" },
    { id: "behaviour_guidance", label: "Positive behaviour guidance strategies" },
    { id: "communication_families", label: "Communication with families" },
    { id: "documentation", label: "Documentation and daily records" },
    { id: "first_aid", label: "First aid / emergency procedures" },
  ],
};