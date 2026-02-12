export const EXAM_TYPES = [
  { value: 'PRE_CT', label: 'Pre-CT' },
  { value: 'CT1', label: 'CT 1' },
  { value: 'CT2', label: 'CT 2' },
  { value: 'PUE', label: 'PUE' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'OTHER', label: 'Other' },
];

export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

export const ATTAINMENT_LEVELS = {
  0: { label: 'Level 0', color: 'var(--danger-500)', description: '< 50%' },
  1: { label: 'Level 1', color: 'var(--warning-500)', description: '50-59%' },
  2: { label: 'Level 2', color: 'var(--primary-500)', description: '60-69%' },
  3: { label: 'Level 3', color: 'var(--success-500)', description: '≥ 70%' },
};

export const ATTAINMENT_TYPES = {
  CT_FINAL: 'CT_FINAL',
  ASSIGNMENT_FINAL: 'ASSIGNMENT_FINAL',
  OVERALL: 'OVERALL',
  CO: 'CO',
};
