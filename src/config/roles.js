/**
 * Role Definitions, Permissions Matrix, and Organization Memberships
 * Defines the 7 distinct enterprise roles and their permission boundaries.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  NGO_ADMIN: "ngo_admin",
  FINANCE_OFFICER: "finance_officer",
  PROJECT_MANAGER: "project_manager",
  AUDITOR: "auditor",
  DONOR: "donor",
  VIEWER: "viewer",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Platform Super Admin",
  [ROLES.NGO_ADMIN]: "NGO Administrator",
  [ROLES.FINANCE_OFFICER]: "Finance Officer",
  [ROLES.PROJECT_MANAGER]: "Project Manager",
  [ROLES.AUDITOR]: "Independent Auditor",
  [ROLES.DONOR]: "Verified Donor",
  [ROLES.VIEWER]: "Read-Only Viewer",
};

export const PERMISSIONS = {
  PLATFORM_ADMIN: "platform:admin",
  NGO_MANAGE_TEAM: "ngo:manage_team",
  NGO_MANAGE_PROFILE: "ngo:manage_profile",
  TREASURY_PROPOSE: "treasury:propose",
  TREASURY_APPROVE: "treasury:approve",
  TREASURY_EXECUTE: "treasury:execute",
  PROJECT_CREATE: "project:create",
  PROJECT_EDIT: "project:edit",
  PROJECT_SUBMIT_PROOF: "project:submit_proof",
  AUDIT_REVIEW: "audit:review",
  AUDIT_SUBMIT_FINDING: "audit:submit_finding",
  DONOR_VIEW_PERSONAL: "donor:view_personal",
  DONOR_MANAGE_SUBSCRIPTIONS: "donor:manage_subscriptions",
  RISK_VIEW_ALERTS: "risk:view_alerts",
  DATA_EXPORT_CSV: "data:export_csv",
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.PLATFORM_ADMIN,
    PERMISSIONS.RISK_VIEW_ALERTS,
    PERMISSIONS.DATA_EXPORT_CSV,
    PERMISSIONS.AUDIT_REVIEW,
  ],
  [ROLES.NGO_ADMIN]: [
    PERMISSIONS.NGO_MANAGE_TEAM,
    PERMISSIONS.NGO_MANAGE_PROFILE,
    PERMISSIONS.TREASURY_PROPOSE,
    PERMISSIONS.TREASURY_APPROVE,
    PERMISSIONS.TREASURY_EXECUTE,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.RISK_VIEW_ALERTS,
    PERMISSIONS.DATA_EXPORT_CSV,
  ],
  [ROLES.FINANCE_OFFICER]: [
    PERMISSIONS.TREASURY_PROPOSE,
    PERMISSIONS.TREASURY_APPROVE,
    PERMISSIONS.TREASURY_EXECUTE,
    PERMISSIONS.RISK_VIEW_ALERTS,
    PERMISSIONS.DATA_EXPORT_CSV,
  ],
  [ROLES.PROJECT_MANAGER]: [
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_SUBMIT_PROOF,
    PERMISSIONS.DATA_EXPORT_CSV,
  ],
  [ROLES.AUDITOR]: [
    PERMISSIONS.AUDIT_REVIEW,
    PERMISSIONS.AUDIT_SUBMIT_FINDING,
    PERMISSIONS.RISK_VIEW_ALERTS,
    PERMISSIONS.DATA_EXPORT_CSV,
  ],
  [ROLES.DONOR]: [
    PERMISSIONS.DONOR_VIEW_PERSONAL,
    PERMISSIONS.DONOR_MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.DATA_EXPORT_CSV,
  ],
  [ROLES.VIEWER]: [],
};

/**
 * Checks whether a given role holds a specific permission.
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

/**
 * Pre-configured Enterprise Demo Profiles for rapid role-testing and switching
 */
export const DEMO_PROFILES = [
  {
    id: "user-super-admin",
    name: "Elena Rostova",
    email: "elena.admin@trustdonate.org",
    wallet: "0xFE39a4892c90823F4619C038a812b4e72d93e114",
    role: ROLES.SUPER_ADMIN,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    organizations: [],
  },
  {
    id: "user-ngo-admin",
    name: "Dr. Alok Verma",
    email: "alok.verma@ashafoundation.org",
    wallet: "0x7a3B19D412bF249f7b189Ec24A00518774f2E31A",
    role: ROLES.NGO_ADMIN,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    organizations: [
      { id: "ngo-1", name: "Asha Foundation", category: "Rural Empowerment", role: ROLES.NGO_ADMIN },
      { id: "ngo-2", name: "Green Canopy Initiative", category: "Environment", role: ROLES.NGO_ADMIN },
    ],
  },
  {
    id: "user-finance-officer",
    name: "Ramesh Kothari",
    email: "ramesh.cfo@ashafoundation.org",
    wallet: "0x51E2b43538446c761eA8196AfC88Fe0a91Da304B",
    role: ROLES.FINANCE_OFFICER,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    organizations: [
      { id: "ngo-1", name: "Asha Foundation", category: "Rural Empowerment", role: ROLES.FINANCE_OFFICER },
    ],
  },
  {
    id: "user-project-manager",
    name: "Dr. Sunita Menon",
    email: "sunita.pm@ashafoundation.org",
    wallet: "0x3A2190B74dE865103AbF992E3c467B1028919a3B",
    role: ROLES.PROJECT_MANAGER,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80",
    organizations: [
      { id: "ngo-1", name: "Asha Foundation", category: "Rural Empowerment", role: ROLES.PROJECT_MANAGER },
    ],
  },
  {
    id: "user-auditor",
    name: "Justice R. S. Nariman",
    email: "audit.nariman@socialaudit.org",
    wallet: "0x91F5B612E0987c320dE51A186B1095d315682C89",
    role: ROLES.AUDITOR,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
    organizations: [
      { id: "ngo-1", name: "Asha Foundation", category: "Rural Empowerment", role: ROLES.AUDITOR },
      { id: "ngo-2", name: "Green Canopy Initiative", category: "Environment", role: ROLES.AUDITOR },
      { id: "ngo-3", name: "CleanWater Labs", category: "Healthcare", role: ROLES.AUDITOR },
    ],
  },
  {
    id: "user-donor",
    name: "Meera Subramanian",
    email: "meera.subramanian@gmail.com",
    wallet: "0x3A2190B74dE865103AbF992E3c467B1028919a3B",
    role: ROLES.DONOR,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    organizations: [],
  },
  {
    id: "user-viewer",
    name: "Public Citizen Observer",
    email: "public.guest@transparency.net",
    wallet: "0x000000000000000000000000000000000000dEaD",
    role: ROLES.VIEWER,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    organizations: [],
  },
];

export const ROLE_DEFAULT_DASHBOARDS = {
  [ROLES.SUPER_ADMIN]: "/admin",
  [ROLES.AUDITOR]: "/auditor",
  [ROLES.FINANCE_OFFICER]: "/finance",
  [ROLES.PROJECT_MANAGER]: "/projects",
  [ROLES.DONOR]: "/donor/dashboard",
  [ROLES.NGO_ADMIN]: "/ngo/dashboard",
  [ROLES.VIEWER]: "/ngo/dashboard",
};

/**
 * Returns the default authorized dashboard path for a given role.
 */
export function getDefaultDashboardForRole(role) {
  return ROLE_DEFAULT_DASHBOARDS[role] || "/ngo/dashboard";
}

/**
 * Resolves context-aware fallback route when history stack has no prior in-app entry.
 */
export function resolveFallbackRoute(currentPath = "") {
  if (
    currentPath.startsWith("/ngo") ||
    currentPath.startsWith("/finance") ||
    currentPath.startsWith("/projects") ||
    currentPath.startsWith("/approvals") ||
    currentPath.startsWith("/risk") ||
    currentPath.startsWith("/analytics") ||
    currentPath.startsWith("/documents")
  ) {
    return "/ngo/dashboard";
  }
  if (currentPath.startsWith("/admin")) {
    return "/admin";
  }
  if (currentPath.startsWith("/auditor")) {
    return "/auditor";
  }
  if (currentPath.startsWith("/donor")) {
    return "/donor/dashboard";
  }
  return "/";
}

/**
 * Role-Specific Authorized Navigation Items & Workspaces
 */
export const ROLE_NAV_ITEMS = {
  [ROLES.DONOR]: [
    { label: "My Donations", badge: "80G", targetTab: "Donor Portal", donorSubTab: "history", path: "/donor/dashboard" },
    { label: "Impact Milestones", targetTab: "Donor Portal", donorSubTab: "impact", path: "/donor/dashboard" },
    { label: "Recurring Pledges", targetTab: "Donor Portal", donorSubTab: "recurring", path: "/donor/dashboard" },
    { label: "Profile & Wallet", targetTab: "Donor Portal", donorSubTab: "profile", path: "/donor/profile" },
    { label: "Tax & Settings", targetTab: "Donor Portal", donorSubTab: "settings", path: "/donor/settings" },
    { label: "Public Ledger", badge: "Amoy", targetTab: "Transactions" },
    { label: "Notifications", targetTab: "Notifications" },
    { label: "Explore Causes", isExternalLink: true, path: "/" },
  ],
  [ROLES.FINANCE_OFFICER]: [
    { label: "Finance Workspace", badge: "Treasury", targetTab: "Finance", path: "/finance" },
    { label: "Approvals", badge: "Multi-Sig", targetTab: "Approvals", path: "/approvals" },
    { label: "Fund Allocation", targetTab: "Fund Allocation" },
    { label: "Transactions Ledger", targetTab: "Transactions" },
    { label: "Documents & Vault", targetTab: "Documents" },
    { label: "Risk Alerts", targetTab: "Risk Alerts", path: "/risk" },
    { label: "Treasury Analytics", targetTab: "Analytics" },
    { label: "Notifications", targetTab: "Notifications" },
  ],
  [ROLES.PROJECT_MANAGER]: [
    { label: "Projects & Milestones", badge: "Field", targetTab: "Projects", path: "/projects" },
    { label: "Deliverables & Proofs", badge: "IPFS", targetTab: "Documents" },
    { label: "Impact Reports", targetTab: "Impact Reports" },
    { label: "Fund Allocation", targetTab: "Fund Allocation" },
    { label: "Notifications", targetTab: "Notifications" },
  ],
  [ROLES.AUDITOR]: [
    { label: "Auditor Portal", badge: "Audits", targetTab: "Auditor", path: "/auditor" },
    { label: "Compliance Vault", badge: "IPFS", targetTab: "Documents" },
    { label: "Impact Reports", targetTab: "Impact Reports" },
    { label: "On-Chain Ledger", badge: "Ledger", targetTab: "Transactions" },
    { label: "Risk Alerts", targetTab: "Risk Alerts", path: "/risk" },
    { label: "Notifications", targetTab: "Notifications" },
  ],
  [ROLES.SUPER_ADMIN]: [
    { label: "Super Admin", badge: "Gov", targetTab: "Super Admin", path: "/admin" },
    { label: "Auditor Portal", targetTab: "Auditor", path: "/auditor" },
    { label: "Risk Alerts", badge: "Alerts", targetTab: "Risk Alerts", path: "/risk" },
    { label: "Platform Analytics", targetTab: "Analytics" },
    { label: "Documents & IPFS", targetTab: "Documents" },
    { label: "Transactions", targetTab: "Transactions" },
    { label: "Notifications", targetTab: "Notifications" },
    { label: "Settings", targetTab: "Settings" },
  ],
  [ROLES.VIEWER]: [
    { label: "Public Ledger", badge: "Live", targetTab: "Transactions" },
    { label: "Impact Reports", targetTab: "Impact Reports" },
    { label: "Analytics", targetTab: "Analytics" },
    { label: "Explore NGOs", isExternalLink: true, path: "/" },
  ],
  [ROLES.NGO_ADMIN]: [
    { label: "Dashboard", targetTab: "Dashboard", path: "/ngo/dashboard" },
    { label: "Approvals", badge: "Multi-Sig", targetTab: "Approvals", path: "/approvals" },
    { label: "Finance", targetTab: "Finance", path: "/finance" },
    { label: "Projects", targetTab: "Projects", path: "/projects" },
    { label: "Fund Allocation", targetTab: "Fund Allocation" },
    { label: "Team Management", badge: "Staff", targetTab: "Team" },
    { label: "Documents & Vault", targetTab: "Documents" },
    { label: "Donations Ledger", targetTab: "Donations" },
    { label: "Donor Directory", targetTab: "Donors" },
    { label: "Transactions", targetTab: "Transactions" },
    { label: "Impact Reports", targetTab: "Impact Reports" },
    { label: "Analytics", targetTab: "Analytics" },
    { label: "Risk Alerts", targetTab: "Risk Alerts", path: "/risk" },
    { label: "Notifications", targetTab: "Notifications" },
    { label: "NGO Settings", targetTab: "Settings" },
  ],
};

export function getRoleNavItems(role) {
  return ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS[ROLES.NGO_ADMIN];
}

