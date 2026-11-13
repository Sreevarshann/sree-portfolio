export type Experience = {
  slug: string;
  company: string;
  role: string;
  start: string;
  end: string;
  period: string;
  location: string;
  url?: string;
  /** `display` is the rendered height in px (logos have very different proportions). */
  logo?: { light: string; dark: string; width: number; height: number; display: number };
  monogram: string;
  /** One-line framing written for the portfolio. */
  summary: string;
  highlights: string[];
  outcomes: { value: string; label: string }[];
  stack: string[];
  /** Visual motif used by the role illustration. */
  motif: "agents" | "pipeline" | "sonar";
};

export const experience: Experience[] = [
  {
    slug: "rightrev",
    company: "RightRev",
    role: "Software & Data Engineer Intern",
    start: "2026-01",
    end: "2026-07",
    period: "Jan 2026 – Jul 2026",
    location: "USA",
    url: "https://www.rightrev.com",
    logo: {
      light: "/logos/rightrev-light-bg.svg",
      dark: "/logos/rightrev-dark-bg.svg",
      width: 232,
      height: 50,
      display: 24,
    },
    monogram: "RR",
    summary:
      "AI agents on Snowflake that turn revenue data into answers business teams can use without manual analysis.",
    highlights: [
      "Developed Snowflake Cortex AI agents, SQL stored procedures and Model Context Protocol (MCP) integrations for financial revenue insights.",
      "Migrated 18 AI agents to production and audited 200+ Snowflake views along the way.",
      "Investigated and fixed a tenant isolation defect during the migration; used OAuth and role-based access control (RBAC) to protect customer data.",
      "Integrated Salesforce CRM APIs with five AI agents.",
      "Automated SQL and JSON validation tests to catch data errors before they reached financial reports.",
      "Built frontend features and backend API integrations with senior engineers, incorporating code review feedback to improve usability and maintainability.",
    ],
    outcomes: [
      { value: "18", label: "AI agents migrated to production" },
      { value: "200+", label: "Snowflake views audited" },
      { value: "5", label: "agents integrated with Salesforce CRM" },
    ],
    stack: ["Snowflake Cortex", "SQL", "Stored procedures", "MCP", "OAuth", "RBAC", "Salesforce APIs", "REST APIs"],
    motif: "agents",
  },
  {
    slug: "flare-innovation",
    company: "Flare Innovation",
    role: "Data Analyst & Engineer",
    start: "2024-01",
    end: "2024-08",
    period: "Jan 2024 – Aug 2024",
    location: "Chennai, India",
    logo: { light: "/logos/flare-innovations-light-bg.png", dark: "/logos/flare-innovations-dark-bg.png", width: 900, height: 490, display: 64 },
    monogram: "FI",
    summary:
      "Pipelines and dashboards for IoT operations data, with quality checks that stopped bad records before reporting.",
    highlights: [
      "Built Power BI dashboards on PostgreSQL and Airtable APIs to track operational KPIs, cutting reporting latency by 30%.",
      "Automated extraction with Python ETL pipelines for 1M+ IoT records in PostgreSQL and Airtable, with schema checks that catch bad data before reporting.",
      "Improved device reliability by 25% by detecting sensor anomalies in Python and preparing data with SQL transformations; benchmarked PySpark at scale.",
      "Supported the full lifecycle of Python data workflows, from development and automated testing to GitHub Actions CI/CD and Docker packaging.",
    ],
    outcomes: [
      { value: "1M+", label: "IoT records through Python ETL" },
      { value: "30%", label: "lower reporting latency" },
      { value: "25%", label: "improvement in device reliability" },
    ],
    stack: ["Python", "SQL", "PostgreSQL", "Airtable API", "Power BI", "PySpark", "Docker", "GitHub Actions"],
    motif: "pipeline",
  },
  {
    slug: "sri-sairam-techno-incubator",
    company: "Sri Sairam Techno Incubator Foundation",
    role: "Machine Learning Engineer",
    start: "2022-06",
    end: "2022-10",
    period: "Jun 2022 – Oct 2022",
    location: "Chennai, India",
    logo: { light: "/logos/sri-sairam-light-bg.png", dark: "/logos/sri-sairam-dark-bg.png", width: 170, height: 172, display: 80 },
    monogram: "SS",
    summary:
      "Perception and control for an autonomous underwater vehicle, from simulation to the pool.",
    highlights: [
      "Developed autonomous underwater navigation and object detection for the team's AUV, contributing to a 6th-place global finish among 320+ teams at the Singapore AUV Challenge.",
      "Trained and integrated YOLOv5 models with OpenCV for real-time underwater object detection.",
      "Developed reinforcement-learning control integrated with the Robot Operating System (ROS), reaching a 92% success rate on obstacle avoidance, gate traversal and object recovery across Gazebo simulations and real pool tests.",
    ],
    outcomes: [
      { value: "6th", label: "of 320+ teams, Singapore AUV Challenge" },
      { value: "92%", label: "success rate in sim and pool tests" },
    ],
    stack: ["Python", "YOLOv5", "OpenCV", "Reinforcement learning", "ROS", "Gazebo"],
    motif: "sonar",
  },
];
