# AI-Based Human Resource Decision Support System

A web-based recruitment decision support system developed for UWC Berhad. The system centralizes job creation, candidate applications, resume evaluation, candidate rankin and recruitment communication in one platform.

It is designed to reduce repetitive screening work while keeping the recruitment process transparent. The system supports HR decisions but does not make the final hiring decision automatically.

## Project highlights

* Supports 3 primary user roles: HR Staff, Hiring Manager, and Candidate
* Processes 2 document types: PDF resumes and PDF job descriptions
* Uses 2 parsing approaches: rule-based parsing and model-based parsing
* Applies 3 extraction techniques: Regex, taxonomy matching, and local NLP extraction
* Uses 1 unique application link for each published job
* Supports 7 candidate statuses: New, Reviewed, Shortlisted, Interview, Interviewed, Rejected and Filtered Out
* Produces a weighted score breakdown for every evaluated candidate
* Keeps the final hiring decision under human control

## Problem

Manual resume screening can take a large amount of time when HR staff receive many applications. Evaluation may also become inconsistent when different reviewers use different criteria.

Job descriptions and resumes usually contain unstructured text. Important information such as skills, education, work experience, projects, and job requirements must be identified before candidates can be compared fairly.

This project addresses these issues by providing a structured recruitment workflow with:

* Job description processing
* Candidate self-submission
* Configurable screening criteria
* Weighted candidate scoring
* Evidence-based score explanations
* Candidate ranking
* Human review and decision support

## Main workflow

```mermaid
flowchart TD
    A[HR uploads PDF job description] --> B[System extracts job information]
    B --> C[HR reviews job details]
    C --> D[HR sets criteria, eligibility filters and weights]
    D --> E[System publishes job and generates application link]
    E --> F[Candidate opens application link]
    F --> G[Candidate submits personal details and PDF resume]
    G --> H[System parses and structures resume data]
    H --> I[Eligibility filters are applied]
    I --> J[Weighted scoring engine calculates candidate score]
    J --> K[Evidence-based score breakdown is generated]
    K --> L[Candidates are ranked]
    L --> M[HR reviews, shortlists, interviews or rejects]
```

## Core features

### 1. Job management

HR staff can:

* Create and manage job posts
* Upload PDF job descriptions
* Review extracted job information
* Edit job titles, descriptions, skills, and requirements
* Set eligibility filters
* Define screening criteria and weights
* Publish or close job posts
* Generate an application link for each job

### 2. Candidate career portal

The system provides a complete career portal for UWC candidates instead of a single resume submission page.

Candidates can:

* Browse available job openings
* Open detailed job information
* Register and log in to a candidate account
* Apply for different job positions
* Upload a PDF resume and supporting documents
* View all submitted applications in one account
* Check the current status of each application
* Review previous application records and submission dates
* Receive clear submission confirmation, validation and error messages

Each application is stored as a separate record and linked to the correct job post. The candidate dashboard allows users to track their application history and view status updates such as New, Reviewed, Shortlisted, Interview, Rejected or Filtered Out.


### 3. Resume and JD parsing

The planned parsing service uses Python FastAPI to process PDF resumes and job descriptions.

The document processing pipeline includes:

* PyMuPDF for text extraction from text-based PDFs
* Tesseract OCR as a fallback for scanned or low-text PDFs
* Regex for deterministic fields
* Taxonomy matching for known technical terms
* A local NLP model for more complex information
* Pydantic and JSON Schema for output validation

#### Rule-based parsing

Rule-based parsing is used for fields with clearer patterns, including:

* Email address
* Phone number
* LinkedIn profile
* GitHub profile
* CGPA
* Dates
* Notice period

Taxonomy matching is used for:

* Technical skills
* Programming languages
* Spoken languages
* Certifications

#### Model-based parsing

A local NLP model is planned for information that is harder to extract using fixed patterns, including:

* Education details
* Work experience
* Project information
* Responsibilities
* Job requirements

The final output is converted into structured JSON before it is passed to the scoring engine.

Example output:

```json
{
  "candidate": {
    "name": "Candidate Name",
    "email": "candidate@example.com",
    "phone": "0123456789",
    "cgpa": 3.45,
    "notice_period": "1 month"
  },
  "education": [],
  "experience": [],
  "projects": [],
  "skills": [],
  "languages": [],
  "certifications": []
}
```

## Weighted scoring and explainability

The system uses a rule-based weighted scoring engine.

HR staff define:

* Screening criteria
* Weight for each criterion
* Minimum eligibility requirements
* Job-specific expectations

The scoring engine compares structured candidate data against the HR-defined criteria.

```text
Weighted Criteria Score = Criteria Score x Criterion Weight
```

The candidate's final score is calculated from the total weighted criteria scores.

The explanation component records:

* Matched requirements
* Missing requirements
* Evidence found in the resume
* Score for each criterion
* Weight assigned by HR
* Contribution of each criterion to the final score

Example:

```text
Technical Skills
Matched: React, TypeScript and MySQL
Missing: Docker
Criteria Score: 75
Weight: 40%
Weighted Score: 30
```

This allows HR staff to understand why a candidate received a particular score instead of viewing only a final number.

## Eligibility filtering

Eligibility filters are separate from weighted scoring.

Examples include:

* Minimum CGPA
* Required education level
* Maximum notice period
* Mandatory qualification

A candidate who does not meet a mandatory requirement can be labelled as `Filtered Out`.

The candidate's evaluation details may still be stored for transparency but the candidate is excluded from the main ranked list.

## Candidate status workflow

```mermaid
stateDiagram-v2
    [*] --> New
    New --> Reviewed
    Reviewed --> Shortlisted
    Shortlisted --> Interview
    Interview --> Interviewed
    New --> Rejected
    Reviewed --> Rejected
    Interview --> Rejected
    Interviewed --> Rejected
    Shortlisted --> Rejected
    New --> FilteredOut
```

Supported statuses:

| Status       | Meaning                                               |
| ------------ | ----------------------------------------------------- |
| New          | A new application has been submitted                  |
| Reviewed     | HR has opened and reviewed the candidate details      |
| Shortlisted  | The candidate has been selected for further review    |
| Interview    | An interview invitation has been sent                 |
| Interviewed  | After interview complete                              |
| Rejected     | The candidate has been rejected                       |
| Filtered Out | The candidate did not meet an eligibility requirement |

## Recruitment communication

The system supports recruitment communication through:

* Interview invitation emails
* Rejection emails
* Reusable email templates
* Email logs
* Notification history
* Supporting file attachments
* HR action history

These functions allow HR staff to manage candidate communication from the same system.

## Dashboard and analytics

The dashboard provides recruitment information such as:

* Total applicants
* Active jobs
* Candidate status distribution
* Recent applications
* Average candidate score
* Recruitment activity

The project also includes HR workflow analytics and activity tracking.

Attendance analytics is treated as an optional feature and is not part of the core AI resume screening scope.

## User roles

### HR Staff

HR Staff can:

* Create, edit and manage job posts
* Configure eligibility filters, screening criteria and weights
* Generate and manage job application links
* Review candidate applications, rankings and score breakdowns
* Shortlist candidates
* Schedule interviews
* Send interview and rejection emails
* Update candidate application statuses
* Review recruitment notifications and communication logs

### Hiring Manager

Hiring Managers can:

* Review HR processing information
* Monitor recruitment activity and efficiency
* View HR performance and processing-time analytics
* Review recruitment workflow records
* Create and manage internal HR user accounts
* Assign internal user roles
* Activate or deactivate internal accounts

### Candidate

Candidates can:

* Register and log in to the UWC career portal
* Browse available job openings
* View job descriptions and requirements
* Apply for different job positions
* Enter personal and contact information
* Upload PDF resumes and supporting documents
* View submitted applications
* Track the current status of each application
* Review previous application records and submission dates


## System architecture

```mermaid
flowchart LR
    A[React and TypeScript Frontend] --> B[PHP REST API]
    B --> C[MariaDB Database]
    B --> D[Python FastAPI Parsing Service]
    D --> E[PyMuPDF]
    D --> F[Tesseract OCR]
    D --> G[Regex and Taxonomy Rules]
    D --> H[Local NLP Model]
    D --> I[Pydantic Validation]
    I --> B
```

The architecture separates the system into 4 main technical areas:

1. Frontend interface
2. Core REST API
3. AI document parsing service
4. Database and persistent storage

## Technology stack

### Frontend

* React 19
* TypeScript 5.8
* Vite 6
* Tailwind CSS 4
* Radix UI
* React Router 7
* Recharts
* Lucide React

### Backend

* Native PHP REST API
* PHP 8.2
* Python FastAPI parsing service

### AI and document processing

* PyMuPDF
* Tesseract OCR
* Regex
* Keyword taxonomy matching
* Local NLP model
* Pydantic
* JSON Schema

### Database

* MariaDB
* MySQLi
* phpMyAdmin

### Development tools

* Visual Studio Code
* XAMPP
* GitHub
* Figma

## Project status

| Area                                              | Status                          |
| ------------------------------------------------- | ------------------------------- |
| React and TypeScript interface                    | Implemented                     |
| PHP REST API integration                          | Implemented                     |
| MariaDB database integration                      | Implemented                     |
| Job and candidate management pages                | Implemented                     |
| Candidate application submission workflow         | Implemented                     |
| Candidate career website                          | In development                  |
| Candidate registration and login                  | In development                  |
| Candidate job browsing and job details            | In development                  |
| Candidate application history                     | In development                  |
| Candidate application status tracking             | In development                  |
| Candidate status actions for HR                   | Implemented                     |
| Interview and rejection email workflow            | Implemented                     |
| Notifications and email logs                      | Implemented                     |
| HR activity and efficiency analytics              | Implemented                     |
| Real JD information extraction                    | In development                  |
| Real resume field extraction                      | In development                  |
| FastAPI parsing service                           | In development                  |
| OCR fallback pipeline                             | Planned for parsing integration |
| Local NLP extraction                              | Planned for parsing integration |
| Production-ready authentication and authorization | In development                  |
| Formal parsing accuracy evaluation                | Not started                     |
| Report export                                     | Planned                         |


## Current scope

The current AI scope focuses on:

* PDF resumes
* PDF job descriptions
* Text-based PDFs
* Scanned PDFs
* Low-text PDFs
* Hybrid rule-based and model-based parsing
* Structured JSON output
* HR-defined weighted scoring
* Evidence-based explanations
* Candidate ranking
* Human-controlled recruitment decisions

## Limitations

* Only PDF resumes and job descriptions are supported in the current scope.
* Parsing quality may depend on document quality, writing style, and layout.
* Scanned documents require OCR and may contain recognition errors.
* The system does not guarantee correct extraction from every resume layout.
* No parsing accuracy claim is made before formal evaluation.
* The scoring engine depends on criteria and weights configured by HR.
* The system does not make autonomous hiring decisions.
* The current project is an advanced academic prototype rather than a full commercial recruitment platform.

## Future improvements

* Complete the FastAPI parsing service
* Add confidence scores for extracted fields
* Add source text evidence for every extracted field
* Evaluate parsing performance using an annotated dataset
* Improve multi-column resume reading order
* Add layout-aware document processing
* Add secure password hashing and server-side role authorization
* Add model and scoring rule version tracking
* Add HR correction feedback for parsed information
* Add production deployment, HTTPS, backups, and monitoring

## Decision support principle

This project follows a human-in-the-loop approach.

The system can:

* Extract information
* Apply HR-defined rules
* Calculate scores
* Rank candidates
* Present evidence
* Support review

The system cannot:

* Hire a candidate automatically
* Reject a candidate without HR action
* Replace professional HR judgment

The final recruitment decision remains with authorized HR staff and hiring managers.

## Project information

| Item             | Details                                         |
| ---------------- | ----------------------------------------------- |
| Project          | AI-Based Human Resource Decision Support System |
| Type             | Final Year Project                              |
| Industry partner | UWC Berhad                                      |
| Programme        | Bachelor of Computer Science                    |
| Institution      | University of Wollongong Malaysia Penang        |
| Supervisor       | Dr. Wong Khang Siang                            |

## License

This repository is developed for academic and educational purposes. Project content, data, and source code should not be reused for commercial purposes without permission.
