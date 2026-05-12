USE uwc_hr_decision_support;

UPDATE application_submission_history ash
JOIN (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY application_id
      ORDER BY recorded_at ASC, id ASC
    ) AS normalized_no
  FROM application_submission_history
) numbered ON numbered.id = ash.id
SET
  ash.submission_no = numbered.normalized_no,
  ash.status_label = CONCAT(
    numbered.normalized_no,
    CASE
      WHEN numbered.normalized_no % 100 BETWEEN 11 AND 13 THEN 'th'
      WHEN numbered.normalized_no % 10 = 1 THEN 'st'
      WHEN numbered.normalized_no % 10 = 2 THEN 'nd'
      WHEN numbered.normalized_no % 10 = 3 THEN 'rd'
      ELSE 'th'
    END,
    ' Submission'
  );
