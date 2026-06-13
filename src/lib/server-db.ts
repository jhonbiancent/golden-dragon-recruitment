import fs from "fs";
import path from "path";
import { Applicant } from "./db";

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICANTS_FILE = path.join(DATA_DIR, "applicants.json");

// Local File Fallback System
export function initLocalDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(APPLICANTS_FILE)) {
    fs.writeFileSync(APPLICANTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getLocalApplicants(): Applicant[] {
  initLocalDB();
  try {
    const data = fs.readFileSync(APPLICANTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export function saveLocalApplicants(applicants: Applicant[]) {
  initLocalDB();
  try {
    fs.writeFileSync(APPLICANTS_FILE, JSON.stringify(applicants, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local DB:", err);
  }
}
