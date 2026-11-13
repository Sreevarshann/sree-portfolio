export type InstitutionLogo = {
  light: string;
  dark: string;
  width: number;
  height: number;
  alt: string;
  url: string;
  /** Rendered height in px. */
  h: number;
  /** Full-colour logos that rely on a white ground sit on a white plate in both themes. */
  plate?: boolean;
  /** Which layouts show this logo: "wide" ≥ 640px, "compact" < 640px. */
  show: "all" | "wide" | "compact";
  /** Optional caption above the logo, e.g. "Affiliated college". */
  label?: string;
};

export type Education = {
  institution: string;
  /** Affiliated college where the degree was studied, when the university awards it. */
  college?: string;
  degree: string;
  field: string;
  /** "value / scale", e.g. "3.95 / 4.0" or "8.7 / 10". */
  gpa: string;
  /** How the grade is named on the transcript: "GPA" or "CGPA". */
  gpaLabel: "GPA" | "CGPA";
  date: string;
  status: "in-progress" | "completed";
  location: string;
  url: string;
  logos: InstitutionLogo[];
  notes: string[];
};

export const education: Education[] = [
  {
    institution: "Northeastern University",
    degree: "Master of Science",
    field: "Data Analytics Engineering",
    gpa: "3.95 / 4.0",
    gpaLabel: "GPA",
    date: "Expected December 2026",
    status: "in-progress",
    location: "Boston, Massachusetts",
    url: "https://www.northeastern.edu",
    logos: [
      { light: "/logos/northeastern-light-bg.png", dark: "/logos/northeastern-dark-bg.png", width: 1200, height: 389, alt: "Northeastern University logo", url: "https://www.northeastern.edu", h: 76, show: "wide" },
      { light: "/logos/northeastern-seal.png", dark: "/logos/northeastern-seal-dark-bg.png", width: 480, height: 480, alt: "Northeastern University seal", url: "https://www.northeastern.edu", h: 104, show: "compact" },
    ],
    notes: [
      "Graduate study in data engineering, analytics and machine learning systems.",
      "Coursework labs in MLOps published on GitHub: Airflow, Docker, Streamlit, data labelling and experiment tracking.",
    ],
  },
  {
    institution: "Anna University",
    college: "Sri Sairam Engineering College",
    degree: "Bachelor of Engineering",
    field: "Electronics and Communication Engineering",
    gpa: "8.7 / 10",
    gpaLabel: "CGPA",
    date: "Completed May 2024",
    status: "completed",
    location: "West Tambaram, Chennai, India",
    url: "https://www.annauniv.edu",
    logos: [
      { light: "/logos/anna-university.png", dark: "/logos/anna-university.png", width: 631, height: 78, alt: "Anna University, Chennai logo", url: "https://www.annauniv.edu", h: 36, plate: true, show: "all" },
      { light: "/logos/sairam-college-wide.png", dark: "/logos/sairam-college-wide.png", width: 1000, height: 317, alt: "Sri Sairam Engineering College logo", url: "https://www.sairam.edu.in", h: 64, plate: true, show: "wide", label: "Affiliated college" },
      { light: "/logos/sairam-college-stacked.png", dark: "/logos/sairam-college-stacked.png", width: 383, height: 359, alt: "Sri Sairam Engineering College logo", url: "https://www.sairam.edu.in", h: 112, plate: true, show: "compact", label: "Affiliated college" },
    ],
    notes: [
      "Undergraduate engineering in electronics, signals and communication systems at Sri Sairam Engineering College, an affiliated college of Anna University.",
      "Applied it to autonomous underwater vehicle perception and control (Singapore AUV Challenge, 6th of 320+ teams).",
    ],
  },
];

export type Certification = {
  name: string;
  issuer: string;
  kind: "Professional certificate" | "Course certificate" | "Training";
  note?: string;
  verifyUrl: string;
  verifyLabel: string;
  issuerMark: string;
  /** Simple Icons slug for the issuer, when a licensed mark exists. */
  issuerIcon?: string;
};

export const certifications: Certification[] = [
  {
    name: "Google Data Analytics Professional Certificate",
    issuer: "Google",
    kind: "Professional certificate",
    verifyUrl: "https://drive.google.com/file/d/1sF5mPbxL7W--bid7-71LwjQE3Nz3JFLP/view?usp=sharing",
    verifyLabel: "View certificate (PDF)",
    issuerMark: "G",
    issuerIcon: "google",
  },
  {
    name: "Data Analytics Essentials",
    issuer: "Cisco Networking Academy",
    kind: "Course certificate",
    verifyUrl: "https://drive.google.com/file/d/1D6gsMpZ5aSsYVwvO5OmXpDWg4nN4AgyA/view?usp=sharing",
    verifyLabel: "View certificate (PDF)",
    issuerMark: "C",
    issuerIcon: "cisco",
  },
  {
    name: "AWS Cloud Practitioner Essentials",
    issuer: "Amazon Web Services (via edX)",
    kind: "Training",
    note: "Completion of AWS's foundational training course. This is not the AWS Certified Cloud Practitioner exam credential.",
    verifyUrl: "https://drive.google.com/file/d/18PYah5Fp-fCwIiDXDmiKgSs3xLvFiMWW/view?usp=sharing",
    verifyLabel: "View course certificate (PDF)",
    issuerMark: "aws",
  },
];

export type Achievement = {
  slug: string;
  event: string;
  result: string;
  rank: { place: number; suffix: string; field?: string };
  /** Competition funnel, widest first (shown as a graphic and a list). */
  stages?: { value: string; label: string }[];
  /** Sree's own LinkedIn post about the result, linked as proof. */
  proof?: { href: string; label: string };
  project: string;
  summary: string;
  details: string[];
  stack: string[];
  evidence: { label: string; href?: string; note: string; kind?: "linkedin" }[];
};

export const achievements: Achievement[] = [
  {
    slug: "sauvc",
    event: "Singapore AUV Challenge",
    result: "6th place globally",
    rank: { place: 6, suffix: "th", field: "320+ teams" },
    stages: [
      { value: "320+", label: "teams entered" },
      { value: "130+", label: "teams qualified" },
      { value: "20", label: "teams shortlisted" },
      { value: "6th", label: "final placing" },
    ],
    proof: {
      href: "https://www.linkedin.com/posts/sreevarshansathiyamurthy_sauvc2022-throwback-teamvaruna-ugcPost-7244625106197512192-ilNL/",
      label: "SAUVC result post on LinkedIn",
    },
    project: "Autonomous underwater vehicle",
    summary:
      "An international student competition in which autonomous underwater vehicles complete navigation and manipulation tasks in a pool without human control.",
    details: [
      "From a field of 320+ teams, the team was among 130+ that qualified and 20 that were shortlisted, finishing 6th overall.",
      "Built autonomous navigation and object detection for the vehicle while at the Sri Sairam Techno Incubator Foundation.",
      "Trained YOLOv5 detectors with OpenCV for real-time underwater perception.",
      "Developed reinforcement-learning control on ROS, validated in Gazebo and in physical pool tests with a 92% success rate on obstacle avoidance, gate traversal and object recovery.",
    ],
    stack: ["YOLOv5", "OpenCV", "Reinforcement learning", "ROS", "Gazebo"],
    evidence: [
      { label: "LinkedIn post", href: "https://www.linkedin.com/posts/sreevarshansathiyamurthy_sauvc2022-throwback-teamvaruna-ugcPost-7244625106197512192-ilNL/", note: "Sree's post about the result", kind: "linkedin" },
      { label: "Official competition site", href: "https://sauvc.org", note: "sauvc.org" },
      { label: "Resume", href: "/Sreevarshan-Sathiyamurthy-Resume.pdf", note: "Listed under Machine Learning Engineer, 2022" },
    ],
  },
  {
    slug: "google-mlops-expo",
    event: "Google MLOps Expo",
    result: "3rd place",
    rank: { place: 3, suffix: "rd" },
    proof: {
      href: "https://www.linkedin.com/posts/sreevarshansathiyamurthy_mlops-machinelearning-dataengineering-ugcPost-7408534309613031425-L_Bj/",
      label: "Google MLOps Expo result post on LinkedIn",
    },
    project: "Charlie — MBTA Real-Time Chatbot",
    summary:
      "Charlie answers live Boston transit questions by combining real-time MBTA data pipelines, delay-prediction features and a retrieval-augmented assistant.",
    details: [
      "Real-time ETL with Python, Apache Airflow, PySpark and Azure turns live MBTA data into features for transit delay prediction.",
      "Dockerized Azure ML services with autoscaling and automated retraining; Prometheus and Slack alerts surface service failures.",
      "A GPT-powered RAG assistant answers live transit queries; retrieval evaluation reached 92% precision on route and schedule questions.",
    ],
    stack: ["Python", "Apache Airflow", "PySpark", "Azure ML", "Docker", "Prometheus", "RAG"],
    evidence: [
      { label: "LinkedIn post", href: "https://www.linkedin.com/posts/sreevarshansathiyamurthy_mlops-machinelearning-dataengineering-ugcPost-7408534309613031425-L_Bj/", note: "Sree's post about the 3rd-place finish", kind: "linkedin" },
      { label: "Resume", href: "/Sreevarshan-Sathiyamurthy-Resume.pdf", note: "Listed under Projects" },
      { label: "Repository", href: "https://github.com/Sreevarshann/Charlir-MBTA", note: "Placeholder repository; source code is not yet published" },
    ],
  },
];
