USE uwc_hr_decision_support;

UPDATE users u
JOIN roles r ON r.id = u.role_id
SET u.role_id = CASE
  WHEN r.role_key = 'hiring_manager' THEN 2
  ELSE 1
END;

DELETE FROM users
WHERE email = 'admin@uwc.com.my';

ALTER TABLE users DROP FOREIGN KEY fk_users_role;
ALTER TABLE users MODIFY role_id TINYINT UNSIGNED NOT NULL COMMENT '1 = HR Staff, 2 = Hiring Manager';
ALTER TABLE users ADD CONSTRAINT chk_users_role_id CHECK (role_id IN (1, 2));

DROP TABLE roles;
