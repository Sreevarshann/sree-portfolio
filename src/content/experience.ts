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
    period: "Jan 2026 - Jul 2026",
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
      "Developed Snowflake Cortex AI agents, SQL stored procedures and Model Context Protocol (MCP) integrations to automate financial reporting, so teams retrieve accurate revenue insights without manual data analysis.",
      "Migrated 18 AI agents to production and audited 200+ Snowflake views.",
      "Implemented OAuth, role-based access control (RBAC) and REST APIs to protect customer data and keep reporting secure and reliable.",
      "Integrated Salesforce CRM APIs with five AI agents.",
      "Built automated SQL and JSON validation tests to verify data accuracy, troubleshoot integration failures and keep financial reporting reliable.",
      "Built frontend features and REST API integrations for financial reporting, working with senior engineers to review changes and resolve integration issues.",
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
    period: "Jan 2024 - Aug 2024",
    location: "Chennai, India",
    logo: { light: "/logos/flare-innovations-light-bg.png", dark: "/logos/flare-innovations-dark-bg.png", width: 900, height: 490, display: 64 },
    monogram: "FI",
    summary:
      "Pipelines and dashboards for IoT operations data, with quality checks that stopped bad records before reporting.",
    highlights: [
      "Developed Power BI dashboards integrating PostgreSQL and Airtable APIs to track operational KPIs and improve reporting efficiency for engineering and business teams.",
      "Engineered Python ETL pipelines processing 1M+ IoT records using PostgreSQL and Airtable, with automated PyTest schema validation to improve data quality.",
      "Improved device reliability through Python-based sensor anomaly detection and SQL transformations, using PySpark to optimize large-scale data processing.",
      "Implemented GitHub Actions CI/CD pipelines for automated testing and builds, containerizing data workflows with Docker for consistent, reliable deployments.",
    ],
    outcomes: [
      { value: "1M+", label: "IoT records through Python ETL" },
    ],
    stack: ["Python", "SQL", "PostgreSQL", "Airtable API", "Power BI", "PySpark", "PyTest", "Docker", "GitHub Actions"],
    motif: "pipeline",
  },
  {
    slug: "sri-sairam-techno-incubator",
    company: "Sri Sairam Techno Incubator Foundation",
    role: "Machine Learning Engineer",
    start: "2022-06",
    end: "2022-10",
    period: "Jun 2022 - Oct 2022",
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
