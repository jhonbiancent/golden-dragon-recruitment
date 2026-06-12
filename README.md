# NextHire Recruitment & Applicant Tracking System

NextHire is a modern, web-based recruitment and applicant tracking system (ATS) built using Next.js App Router, Tailwind CSS v4, and TypeScript. It allows candidates to view open roles and apply, while giving recruiters an elegant, interactive dashboard to review candidates, change pipeline stages, and log assessment notes.

## Features

- **Candidate Portal**: Premium landing page, search/filter capabilities, and a responsive application form (fields: Name, Email, Phone, Experience, Resume Link, Portfolio, LinkedIn, Cover Letter, Notice Period).
- **Recruiter ATS Dashboard**: High-level metrics, advanced filtering/searching, a candidate detail fly-over panel, pipeline stage changer, and historic comment logs.
- **Local File Database**: Ready-to-go JSON database seeded with sample mock positions and candidate submissions (`data/applicants.json`).
- **Google Sheets Integration Interface**: Built-in api structure ready to connect to external webhook/Apps Script integrations.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open the application**:
   - Candidate Front-end: [http://localhost:3000](http://localhost:3000)
   - Recruiter ATS Portal: [http://localhost:3000/admin](http://localhost:3000/admin)

4. **Production Build**:
   ```bash
   npm run build
   ```
