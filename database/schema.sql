CREATE DATABASE IF NOT EXISTS uwc_hr_decision_support
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE uwc_hr_decision_support;

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id TINYINT UNSIGNED NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  department VARCHAR(120) NULL,
  phone VARCHAR(40) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jobs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_code VARCHAR(30) NOT NULL UNIQUE,
  created_by_user_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  department VARCHAR(120) NOT NULL,
  location VARCHAR(180) NULL,
  salary_range VARCHAR(120) NULL,
  employment_type VARCHAR(80) NULL,
  description TEXT NULL,
  required_qualification VARCHAR(255) NULL,
  required_experience VARCHAR(120) NULL,
  status ENUM('draft', 'active', 'closed', 'archived') NOT NULL DEFAULT 'draft',
  jd_file_name VARCHAR(255) NULL,
  jd_file_path VARCHAR(500) NULL,
  published_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_responsibilities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id INT UNSIGNED NOT NULL,
  responsibility TEXT NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_job_responsibilities_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE KEY uq_job_responsibilities_order (job_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_required_skills (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id INT UNSIGNED NOT NULL,
  skill_name VARCHAR(120) NOT NULL,
  skill_type ENUM('technical', 'soft', 'language', 'tool', 'other') NOT NULL DEFAULT 'technical',
  importance ENUM('required', 'preferred') NOT NULL DEFAULT 'required',
  CONSTRAINT fk_job_required_skills_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE KEY uq_job_required_skills_name (job_id, skill_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_criteria (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id INT UNSIGNED NOT NULL,
  criteria_name VARCHAR(150) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_job_criteria_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_job_criteria_job (job_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS criteria_requirements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  criteria_id INT UNSIGNED NOT NULL,
  requirement_text VARCHAR(255) NOT NULL,
  requirement_type ENUM('skill', 'experience', 'education', 'language', 'certification', 'other') NOT NULL DEFAULT 'skill',
  match_rule ENUM('required', 'preferred', 'related_allowed') NOT NULL DEFAULT 'required',
  CONSTRAINT fk_criteria_requirements_criteria FOREIGN KEY (criteria_id) REFERENCES job_criteria(id) ON DELETE CASCADE,
  UNIQUE KEY uq_criteria_requirements_text (criteria_id, requirement_text)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS eligibility_filters (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id INT UNSIGNED NOT NULL,
  min_cgpa DECIMAL(3,2) NULL,
  min_years_experience DECIMAL(4,1) NULL,
  internship_accepted TINYINT(1) NOT NULL DEFAULT 0,
  required_qualification VARCHAR(255) NULL,
  required_language VARCHAR(180) NULL,
  required_location VARCHAR(180) NULL,
  max_notice_period_days INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_eligibility_filters_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE KEY uq_eligibility_filters_job (job_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS application_links (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id INT UNSIGNED NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  public_path VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('active', 'disabled', 'expired') NOT NULL DEFAULT 'active',
  expires_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_application_links_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE KEY uq_application_links_job (job_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS candidates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NULL,
  current_cgpa DECIMAL(3,2) NULL,
  years_experience DECIMAL(4,1) NULL,
  notice_period_days INT UNSIGNED NULL,
  current_location VARCHAR(180) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_candidates_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id INT UNSIGNED NOT NULL,
  candidate_id INT UNSIGNED NOT NULL,
  application_link_id INT UNSIGNED NULL,
  application_status ENUM('new', 'reviewed', 'shortlisted', 'interview', 'rejected', 'filtered_out') NOT NULL DEFAULT 'new',
  is_shortlisted TINYINT(1) NOT NULL DEFAULT 0,
  interview_sent_at DATETIME NULL,
  eligibility_status ENUM('eligible', 'filtered_out', 'pending') NOT NULL DEFAULT 'pending',
  total_score DECIMAL(5,2) NULL,
  rank_no INT UNSIGNED NULL,
  ai_summary TEXT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_link FOREIGN KEY (application_link_id) REFERENCES application_links(id) ON DELETE SET NULL,
  UNIQUE KEY uq_applications_job_candidate (job_id, candidate_id),
  INDEX idx_applications_job_status (job_id, application_status),
  INDEX idx_applications_ranking (job_id, eligibility_status, total_score)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resumes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  stored_file_path VARCHAR(500) NOT NULL,
  file_mime_type VARCHAR(120) NOT NULL DEFAULT 'application/pdf',
  file_size_bytes INT UNSIGNED NOT NULL,
  parsed_text MEDIUMTEXT NULL,
  parsing_status ENUM('pending', 'parsed', 'failed') NOT NULL DEFAULT 'pending',
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resumes_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  UNIQUE KEY uq_resumes_application (application_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS candidate_scores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  total_raw_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_weighted_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  scoring_method VARCHAR(120) NOT NULL DEFAULT 'nlp_rule_based_weighted_scoring',
  evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_candidate_scores_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  UNIQUE KEY uq_candidate_scores_application (application_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS score_breakdowns (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  candidate_score_id INT UNSIGNED NOT NULL,
  criteria_id INT UNSIGNED NOT NULL,
  raw_score DECIMAL(5,2) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  weighted_score DECIMAL(5,2) NOT NULL,
  explanation TEXT NULL,
  CONSTRAINT fk_score_breakdowns_score FOREIGN KEY (candidate_score_id) REFERENCES candidate_scores(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_breakdowns_criteria FOREIGN KEY (criteria_id) REFERENCES job_criteria(id) ON DELETE CASCADE,
  UNIQUE KEY uq_score_breakdowns_score_criteria (candidate_score_id, criteria_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS score_breakdown_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  score_breakdown_id INT UNSIGNED NOT NULL,
  requirement_text VARCHAR(255) NOT NULL,
  match_status ENUM('matched', 'partial', 'missing') NOT NULL,
  evidence_text TEXT NULL,
  item_score DECIMAL(5,2) NULL,
  CONSTRAINT fk_score_breakdown_items_breakdown FOREIGN KEY (score_breakdown_id) REFERENCES score_breakdowns(id) ON DELETE CASCADE,
  UNIQUE KEY uq_score_breakdown_items_requirement (score_breakdown_id, requirement_text)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS application_submission_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT UNSIGNED NOT NULL,
  application_id INT UNSIGNED NOT NULL,
  job_id INT UNSIGNED NOT NULL,
  submission_no INT UNSIGNED NOT NULL,
  previous_application_status ENUM('new', 'reviewed', 'shortlisted', 'interview', 'rejected', 'filtered_out') NOT NULL,
  previous_eligibility_status ENUM('eligible', 'filtered_out', 'pending') NOT NULL,
  previous_score DECIMAL(5,2) NULL,
  previous_rank_no INT UNSIGNED NULL,
  previous_resume_file_name VARCHAR(255) NULL,
  previous_resume_url VARCHAR(500) NULL,
  previous_ai_summary TEXT NULL,
  original_submitted_at DATETIME NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_submission_history_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_history_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_history_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_submission_history_application (application_id, recorded_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_key VARCHAR(80) NOT NULL UNIQUE,
  template_name VARCHAR(150) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  attachment_path VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_templates_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  sent_by_user_id INT UNSIGNED NOT NULL,
  template_id INT UNSIGNED NULL,
  email_type ENUM('interview', 'reject', 'general') NOT NULL,
  recipient_email VARCHAR(180) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  scheduled_interview_at DATETIME NULL,
  status ENUM('draft', 'sent', 'failed') NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_logs_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_email_logs_sent_by FOREIGN KEY (sent_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_email_logs_template FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  notification_type VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendance_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present', 'late', 'absent', 'leave') NOT NULL,
  check_in_time TIME NULL,
  check_out_time TIME NULL,
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_records_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_attendance_user_date (user_id, attendance_date)
) ENGINE=InnoDB;

INSERT INTO roles (id, role_name, description) VALUES
  (1, 'HR Staff', 'Can create jobs, manage applications, shortlist candidates, and send interview or reject decisions.'),
  (2, 'Hiring Manager', 'Can review shortlisted candidates, view scoring details, and manage internal users.')
ON DUPLICATE KEY UPDATE
  role_name = VALUES(role_name),
  description = VALUES(description);

INSERT INTO users (id, role_id, full_name, email, password_hash, department, phone, status) VALUES
  (2, 1, 'HR Staff Demo', 'hr@uwc.com.my', '$2y$10$demo.hash.for.prototype.only', 'Human Resources', '+604-0000001', 'active'),
  (3, 2, 'Hiring Manager Demo', 'manager@uwc.com.my', '$2y$10$demo.hash.for.prototype.only', 'Engineering', '+604-0000002', 'active')
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  full_name = VALUES(full_name),
  department = VALUES(department),
  phone = VALUES(phone),
  status = VALUES(status);

INSERT INTO jobs (
  id, job_code, created_by_user_id, title, department, location, salary_range,
  employment_type, description, required_qualification, required_experience,
  status, jd_file_name, jd_file_path, published_at
) VALUES
  (
    1, 'JOB001', 2, 'Senior Frontend Developer', 'Engineering', 'Batu Kawan, Penang',
    'RM 4,500 - RM 6,500', 'Full-time',
    'Build and maintain frontend web applications, collaborate with backend teams, and improve UI quality.',
    'Bachelor Degree in Computer Science or related field', '3 years',
    'active', 'senior-frontend-developer.pdf', '/uploads/jd/senior-frontend-developer.pdf', NOW()
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  department = VALUES(department),
  location = VALUES(location),
  salary_range = VALUES(salary_range),
  employment_type = VALUES(employment_type),
  description = VALUES(description),
  required_qualification = VALUES(required_qualification),
  required_experience = VALUES(required_experience),
  status = VALUES(status);

INSERT INTO job_responsibilities (job_id, responsibility, sort_order) VALUES
  (1, 'Develop responsive frontend features using React and TypeScript.', 1),
  (1, 'Collaborate with backend engineers to integrate APIs.', 2),
  (1, 'Improve usability, accessibility, and interface quality.', 3)
ON DUPLICATE KEY UPDATE
  responsibility = VALUES(responsibility);

INSERT INTO job_required_skills (job_id, skill_name, skill_type, importance) VALUES
  (1, 'React', 'technical', 'required'),
  (1, 'TypeScript', 'technical', 'required'),
  (1, 'Node.js', 'technical', 'preferred'),
  (1, 'AWS', 'tool', 'preferred'),
  (1, 'English', 'language', 'required'),
  (1, 'Bahasa Malaysia', 'language', 'preferred')
ON DUPLICATE KEY UPDATE
  skill_type = VALUES(skill_type),
  importance = VALUES(importance);

INSERT INTO job_criteria (id, job_id, criteria_name, weight, description, sort_order) VALUES
  (1, 1, 'Technical Skills', 40.00, 'Match against required frontend and platform skills.', 1),
  (2, 1, 'Experience', 25.00, 'Relevant software development and frontend project experience.', 2),
  (3, 1, 'Education', 20.00, 'Relevant academic qualification and CGPA.', 3),
  (4, 1, 'Soft Skills', 15.00, 'Communication, teamwork, and collaboration indicators.', 4)
ON DUPLICATE KEY UPDATE
  criteria_name = VALUES(criteria_name),
  weight = VALUES(weight),
  description = VALUES(description),
  sort_order = VALUES(sort_order);

INSERT INTO criteria_requirements (criteria_id, requirement_text, requirement_type, match_rule) VALUES
  (1, 'React', 'skill', 'required'),
  (1, 'TypeScript', 'skill', 'required'),
  (1, 'Node.js', 'skill', 'preferred'),
  (1, 'AWS', 'skill', 'preferred'),
  (2, '3 years frontend development experience', 'experience', 'required'),
  (3, 'Bachelor Degree in Computer Science or related field', 'education', 'required'),
  (4, 'Team collaboration', 'other', 'preferred'),
  (4, 'Communication skills', 'other', 'preferred')
ON DUPLICATE KEY UPDATE
  requirement_type = VALUES(requirement_type),
  match_rule = VALUES(match_rule);

INSERT INTO eligibility_filters (
  job_id, min_cgpa, min_years_experience, internship_accepted,
  required_qualification, required_language, required_location, max_notice_period_days
) VALUES
  (1, 3.00, 2.0, 0, 'Bachelor Degree', 'English', 'Malaysia', 60)
ON DUPLICATE KEY UPDATE
  min_cgpa = VALUES(min_cgpa),
  min_years_experience = VALUES(min_years_experience),
  internship_accepted = VALUES(internship_accepted),
  required_qualification = VALUES(required_qualification),
  required_language = VALUES(required_language),
  required_location = VALUES(required_location),
  max_notice_period_days = VALUES(max_notice_period_days);

INSERT INTO application_links (job_id, token, public_path, status) VALUES
  (1, 'JOB001-DEMO-LINK', '/apply/JOB001', 'active')
ON DUPLICATE KEY UPDATE
  token = VALUES(token),
  public_path = VALUES(public_path),
  status = VALUES(status);

INSERT INTO candidates (id, full_name, email, phone, current_cgpa, years_experience, notice_period_days, current_location) VALUES
  (1, 'Alice Chen', 'alice.chen@example.com', '+6012-1111111', 3.92, 8.0, 30, 'Penang'),
  (2, 'Daniel Tan', 'daniel.tan@example.com', '+6012-2222222', 2.85, 2.0, 45, 'Kuala Lumpur')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  phone = VALUES(phone),
  current_cgpa = VALUES(current_cgpa),
  years_experience = VALUES(years_experience),
  notice_period_days = VALUES(notice_period_days),
  current_location = VALUES(current_location);

INSERT INTO applications (
  id, job_id, candidate_id, application_link_id, application_status,
  eligibility_status, total_score, rank_no, ai_summary
) VALUES
  (
    1, 1, 1, (SELECT id FROM application_links WHERE job_id = 1), 'shortlisted',
    'eligible',
    88.50, 1,
    'Alice Chen is a highly ranked frontend candidate with strong React, TypeScript, Node.js and AWS experience. She is suitable for HR review.'
  ),
  (
    2, 1, 2, (SELECT id FROM application_links WHERE job_id = 1), 'filtered_out',
    'filtered_out',
    67.00, NULL,
    'Daniel Tan has relevant frontend exposure and can be reviewed through the score breakdown.'
  )
ON DUPLICATE KEY UPDATE
  application_status = VALUES(application_status),
  eligibility_status = VALUES(eligibility_status),
  total_score = VALUES(total_score),
  rank_no = VALUES(rank_no),
  ai_summary = VALUES(ai_summary);

INSERT INTO resumes (application_id, original_file_name, stored_file_path, file_mime_type, file_size_bytes, parsing_status) VALUES
  (1, 'alice-chen-resume.pdf', '/uploads/resumes/alice-chen-resume.pdf', 'application/pdf', 245760, 'parsed'),
  (2, 'daniel-tan-resume.pdf', '/uploads/resumes/daniel-tan-resume.pdf', 'application/pdf', 198240, 'parsed')
ON DUPLICATE KEY UPDATE
  original_file_name = VALUES(original_file_name),
  stored_file_path = VALUES(stored_file_path),
  file_mime_type = VALUES(file_mime_type),
  file_size_bytes = VALUES(file_size_bytes),
  parsing_status = VALUES(parsing_status);

INSERT INTO candidate_scores (id, application_id, total_raw_score, total_weighted_score, scoring_method) VALUES
  (1, 1, 88.50, 88.50, 'nlp_rule_based_weighted_scoring'),
  (2, 2, 67.00, 67.00, 'nlp_rule_based_weighted_scoring')
ON DUPLICATE KEY UPDATE
  total_raw_score = VALUES(total_raw_score),
  total_weighted_score = VALUES(total_weighted_score),
  scoring_method = VALUES(scoring_method);

INSERT INTO score_breakdowns (id, candidate_score_id, criteria_id, raw_score, weight, weighted_score, explanation) VALUES
  (1, 1, 1, 90.00, 40.00, 36.00, 'Strong match for React and TypeScript; Node.js and AWS also mentioned.'),
  (2, 1, 2, 88.00, 25.00, 22.00, 'Relevant frontend development experience exceeds minimum requirement.'),
  (3, 1, 3, 92.00, 20.00, 18.40, 'Relevant computer science education and strong CGPA.'),
  (4, 1, 4, 80.67, 15.00, 12.10, 'Resume indicates collaboration and communication experience.'),
  (5, 2, 1, 72.00, 40.00, 28.80, 'React mentioned, TypeScript detail is limited, AWS not found.'),
  (6, 2, 2, 70.00, 25.00, 17.50, 'Experience is relevant but less senior.'),
  (7, 2, 3, 55.00, 20.00, 11.00, 'Education is relevant to the role.'),
  (8, 2, 4, 64.67, 15.00, 9.70, 'Some teamwork evidence found.')
ON DUPLICATE KEY UPDATE
  raw_score = VALUES(raw_score),
  weight = VALUES(weight),
  weighted_score = VALUES(weighted_score),
  explanation = VALUES(explanation);

INSERT INTO score_breakdown_items (score_breakdown_id, requirement_text, match_status, evidence_text, item_score) VALUES
  (1, 'React', 'matched', 'Resume includes multiple React projects.', 95.00),
  (1, 'TypeScript', 'matched', 'TypeScript used in frontend applications.', 90.00),
  (1, 'Node.js', 'matched', 'Node.js used for API integration work.', 85.00),
  (1, 'AWS', 'partial', 'AWS deployment exposure mentioned.', 75.00),
  (5, 'React', 'matched', 'React mentioned in project section.', 80.00),
  (5, 'TypeScript', 'partial', 'TypeScript mentioned without strong detail.', 60.00),
  (5, 'AWS', 'missing', 'AWS was not found in resume text.', 0.00)
ON DUPLICATE KEY UPDATE
  match_status = VALUES(match_status),
  evidence_text = VALUES(evidence_text),
  item_score = VALUES(item_score);

INSERT INTO email_templates (template_key, template_name, subject, body, created_by_user_id) VALUES
  (
    'interview_invitation',
    'Interview Invitation',
    'Interview Invitation for {{job_title}}',
    'Dear {{candidate_name}},\n\nThank you for applying for {{job_title}} at UWC Berhad. We would like to invite you for an interview on {{interview_datetime}}.\n\nBest regards,\nUWC HR Team',
    2
  ),
  (
    'reject_application',
    'Reject Application',
    'Application Update for {{job_title}}',
    'Dear {{candidate_name}},\n\nThank you for applying for {{job_title}} at UWC Berhad. After careful review, we regret to inform you that your application will not proceed at this time.\n\nBest regards,\nUWC HR Team',
    2
  )
ON DUPLICATE KEY UPDATE
  template_name = VALUES(template_name),
  subject = VALUES(subject),
  body = VALUES(body),
  created_by_user_id = VALUES(created_by_user_id);

INSERT INTO notifications (user_id, notification_type, title, message) VALUES
  (2, 'new_application', 'New candidate application', 'Alice Chen submitted an application for Senior Frontend Developer.'),
  (2, 'filtered_out', 'Candidate filtered out', 'Daniel Tan was reviewed through the score breakdown.');

INSERT INTO attendance_records (user_id, attendance_date, status, check_in_time, check_out_time, remarks) VALUES
  (2, CURRENT_DATE, 'present', '08:55:00', NULL, 'Optional attendance analytics demo record.')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  check_in_time = VALUES(check_in_time),
  check_out_time = VALUES(check_out_time),
  remarks = VALUES(remarks);

