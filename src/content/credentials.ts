export type Education = {
  institution: string;
  degree: string;
  field: string;
  gpa: string;
  date: string;
  status: "in-progress" | "completed";
  location: string;
  url: string;
  logo: { light: string; dark: string; width: number; height: number; alt: string };
  notes: string[];
};

export const education: Education[] = [
  {
    institution: "Northeastern University",
    degree: "Master of Science",
    field: "Data Analytics Engineering",
    gpa: "3.95 / 4.0",
    date: "Expected December 2026",
    status: "in-progress",
    location: "Boston, Massachusetts",
    url: "https://www.northeastern.edu",
    logo: {
      light: "/logos/neu-black.png",
      dark: "/logos/neu-white.png",
      width: 800,
      height: 71,
      alt: "Northeastern University wordmark",
    },
    notes: [
      "Graduate study in data engineering, analytics and machine learning systems.",
      "Coursework labs in MLOps published on GitHub: Airflow, Docker, Streamlit, data labelling and experiment tracking.",
    ],
  },
  {
    institution: "Anna University",
    degree: "Bachelor of Engineering",
    field: "Electronics and Communication Engineering",
    gpa: "3.5 / 4.0",
    date: "Completed May 2024",
    status: "completed",
    location: "Chennai, India",
    url: "https://www.annauniv.edu",
    logo: {
      light: "/logos/anna-university.png",
      dark: "/logos/anna-university.png",
      width: 631,
      height: 78,
      alt: "Anna University, Chennai logo",
    },
    notes: [
      "Undergraduate engineering in electronics, signals and communication systems.",
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
};

export const certifications: Certification[] = [
  {
    name: "Google Data Analytics Professional Certificate",
    issuer: "Google",
    kind: "Professional certificate",
    verifyUrl: "https://drive.google.com/file/d/1sF5mPbxL7W--bid7-71LwjQE3Nz3JFLP/view?usp=sharing",
    verifyLabel: "View certificate (PDF)",
    issuerMark: "G",
  },
  {
    name: "Data Analytics Essentials",
    issuer: "Cisco Networking Academy",
    kind: "Course certificate",
    verifyUrl: "https://drive.google.com/file/d/1D6gsMpZ5aSsYVwvO5OmXpDWg4nN4AgyA/view?usp=sharing",
    verifyLabel: "View certificate (PDF)",
    issuerMark: "C",
  },
  {
    name: "AWS Cloud Practitioner Essentials",
    issuer: "Amazon Web Services (via edX)",
    kind: "Training",
    note: "Completion of AWS's foundational training course. This is not the AWS Certified Cloud Practitioner exam credential.",
    verifyUrl: "https://drive.google.com/file/d/18PYah5Fp-fCwIiDXDmiKgSs3xLvFiMWW/view?usp=sharing",
    verifyLabel: "View course certificate (PDF)",
    issuerMark: "A",
  },
];

export type Achievement = {
  slug: string;
  event: string;
  result: string;
  rank: { place: number; suffix: string; field?: string };
  project: string;
  summary: string;
  details: string[];
  stack: string[];
  evidence: { label: string; href?: string; note: string }[];
};

export const achievements: Achievement[] = [
  {
    slug: "sauvc",
    event: "Singapore AUV Challenge",
    result: "6th place globally",
    rank: { place: 6, suffix: "th", field: "320+ teams" },
    project: "Autonomous underwater vehicle",
    summary:
      "An international student competition in which autonomous underwater vehicles complete navigation and manipulation tasks in a pool without human control.",
    details: [
      "Built autonomous navigation and object detection for the vehicle while at the Sri Sairam Techno Incubator Foundation.",
      "Trained YOLOv5 detectors with OpenCV for real-time underwater perception.",
      "Developed reinforcement-learning control on ROS, validated in Gazebo and in physical pool tests with a 92% success rate on obstacle avoidance, gate traversal and object recovery.",
    ],
    stack: ["YOLOv5", "OpenCV", "Reinforcement learning", "ROS", "Gazebo"],
    evidence: [
      { label: "Official competition site", href: "https://sauvc.org", note: "sauvc.org" },
      { label: "Resume", href: "/Sreevarshan-Sathiyamurthy-Resume.pdf", note: "Listed under Machine Learning Engineer, 2022" },
    ],
  },
  {
    slug: "google-mlops-expo",
    event: "Google MLOps Expo",
    result: "3rd place",
    rank: { place: 3, suffix: "rd" },
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
      { label: "Resume", href: "/Sreevarshan-Sathiyamurthy-Resume.pdf", note: "Listed under Projects" },
      { label: "Repository", href: "https://github.com/Sreevarshann/Charlir-MBTA", note: "Placeholder repository; source code is not yet published" },
    ],
  },
];
