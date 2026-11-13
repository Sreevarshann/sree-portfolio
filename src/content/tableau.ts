import { profile } from "./profile";

/**
 * Public vizzes on Sree's Tableau Public profile (checked on the live profile;
 * titles exactly as published there). Linked, not embedded: no third-party
 * iframe loads until a visitor chooses to open one.
 */
export const tableauProfile = profile.links.tableau;

const BASE = "https://public.tableau.com/app/profile/sreevarshan.sathiyamurthy/viz";

export const tableauVizzes = [
  { title: "Sales & Customer Dashboards", href: `${BASE}/SalesCustomerDashboards_17387817772510/SalesDashboard` },
  { title: "HR Dashboard", href: `${BASE}/HRDashboard_17600352521370/HRSummary` },
  { title: "tesla supercharger 2022", href: `${BASE}/teslasupercharger2022/Dashboard1` },
] as const;
