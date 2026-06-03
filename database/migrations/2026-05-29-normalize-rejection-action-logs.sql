UPDATE hr_action_logs
SET action_type = 'reject_candidate',
    action_label = 'Rejected Candidate',
    details = CASE
      WHEN details IS NULL OR details = '' THEN 'Rejected the candidate and sent rejection email.'
      ELSE details
    END
WHERE action_type = 'send_rejection_email';
