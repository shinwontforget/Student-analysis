// Field-organized written exam prompts for Critical Thinking

export type StudentLevel = 'school_9_10' | 'school_11_12' | 'college' | 'postgraduate'
export type StudentField =
  | 'science' | 'maths' | 'social_studies' | 'language_arts'     // 9-10
  | 'pcm' | 'pcb' | 'commerce' | 'humanities'                     // 11-12
  | 'computer_science' | 'engineering' | 'medical' | 'business'   // College
  | 'law' | 'arts' | 'social_sciences' | 'education'              // College

export interface ExamPrompt {
  id: string
  title: string
  field: StudentField
  level: StudentLevel
  promptText: string
  suggestedWords: number
  timeMinutes: number // base time; unlocked users get 1.5x
}

export const EXAM_PROMPTS: ExamPrompt[] = [

  // ── SCHOOL 9-10: SCIENCE ─────────────────────────────────────────────────
  {
    id: 's910_sci_1',
    title: 'Force & Motion in Everyday Life',
    field: 'science', level: 'school_9_10',
    promptText: 'Explain Newton\'s three laws of motion with one real-world example for each. How do these laws explain why wearing a seatbelt saves lives in a car crash?',
    suggestedWords: 200, timeMinutes: 20,
  },
  {
    id: 's910_sci_2',
    title: 'Climate Change vs. Weather',
    field: 'science', level: 'school_9_10',
    promptText: 'Distinguish between weather and climate. Explain three ways human activity contributes to climate change and suggest two things your school can do to reduce its carbon footprint.',
    suggestedWords: 220, timeMinutes: 20,
  },
  {
    id: 's910_sci_3',
    title: 'Cell Division & Growth',
    field: 'science', level: 'school_9_10',
    promptText: 'Describe the difference between mitosis and meiosis. Why does your body need both processes? What would happen if cells only used mitosis?',
    suggestedWords: 180, timeMinutes: 20,
  },

  // ── SCHOOL 9-10: MATHS ───────────────────────────────────────────────────
  {
    id: 's910_math_1',
    title: 'Real Numbers & Proof',
    field: 'maths', level: 'school_9_10',
    promptText: 'Explain the difference between rational and irrational numbers. Prove that √2 is irrational using contradiction. Why does this matter in mathematics?',
    suggestedWords: 200, timeMinutes: 20,
  },
  {
    id: 's910_math_2',
    title: 'Statistics in Daily Life',
    field: 'maths', level: 'school_9_10',
    promptText: 'Compare mean, median, and mode. Give a real-world situation where the median is a better measure than the mean. Create a small data set to illustrate your point.',
    suggestedWords: 180, timeMinutes: 20,
  },

  // ── SCHOOL 11-12: PCM ────────────────────────────────────────────────────
  {
    id: 's1112_pcm_1',
    title: 'Thermodynamics & Entropy',
    field: 'pcm', level: 'school_11_12',
    promptText: 'Explain the second law of thermodynamics in your own words. What does entropy mean for a closed system? Give two examples from daily life that demonstrate entropy increasing.',
    suggestedWords: 230, timeMinutes: 20,
  },
  {
    id: 's1112_pcm_2',
    title: 'Calculus Application — Rates of Change',
    field: 'pcm', level: 'school_11_12',
    promptText: 'Derivatives represent the rate of change. Explain this concept using a real scenario (e.g., speed, population growth, or temperature). How does the second derivative give additional information?',
    suggestedWords: 220, timeMinutes: 20,
  },
  {
    id: 's1112_pcm_3',
    title: 'Electromagnetic Induction',
    field: 'pcm', level: 'school_11_12',
    promptText: 'Describe Faraday\'s law of electromagnetic induction. How does this principle power electric generators and transformers? What role does Lenz\'s law play?',
    suggestedWords: 240, timeMinutes: 20,
  },

  // ── SCHOOL 11-12: PCB ────────────────────────────────────────────────────
  {
    id: 's1112_pcb_1',
    title: 'Mendelian Genetics & Beyond',
    field: 'pcb', level: 'school_11_12',
    promptText: 'Explain Mendel\'s laws of segregation and independent assortment. What does it mean when a trait is "non-Mendelian"? Give an example of incomplete dominance.',
    suggestedWords: 230, timeMinutes: 20,
  },
  {
    id: 's1112_pcb_2',
    title: 'Enzyme Activity & pH',
    field: 'pcb', level: 'school_11_12',
    promptText: 'Explain how enzymes work as biological catalysts. How does pH affect enzyme activity? Why would a slight fever of 40°C denature enzymes and affect digestion?',
    suggestedWords: 220, timeMinutes: 20,
  },

  // ── SCHOOL 11-12: COMMERCE ───────────────────────────────────────────────
  {
    id: 's1112_com_1',
    title: 'Demand, Supply & Market Equilibrium',
    field: 'commerce', level: 'school_11_12',
    promptText: 'Explain the law of demand and supply. Draw and describe what happens to the equilibrium price when consumer income rises. Use a product of your choice as an example.',
    suggestedWords: 220, timeMinutes: 20,
  },
  {
    id: 's1112_com_2',
    title: 'Role of Banks in an Economy',
    field: 'commerce', level: 'school_11_12',
    promptText: 'Describe the main functions of commercial banks and the Reserve Bank of India. How do banks create credit? What happens when the RBI raises the repo rate?',
    suggestedWords: 210, timeMinutes: 20,
  },

  // ── SCHOOL 11-12: HUMANITIES ─────────────────────────────────────────────
  {
    id: 's1112_hum_1',
    title: 'Democracy vs. Authoritarianism',
    field: 'humanities', level: 'school_11_12',
    promptText: 'Compare democratic and authoritarian governance systems. Using one historical example of each, evaluate their strengths and weaknesses in protecting citizens\' rights.',
    suggestedWords: 250, timeMinutes: 20,
  },
  {
    id: 's1112_hum_2',
    title: 'Social Media & Mental Health',
    field: 'humanities', level: 'school_11_12',
    promptText: 'Analyze the impact of social media on adolescent mental health. Are the effects primarily positive or negative? What responsibilities do tech companies have?',
    suggestedWords: 230, timeMinutes: 20,
  },

  // ── COLLEGE: COMPUTER SCIENCE ────────────────────────────────────────────
  {
    id: 'col_cs_1',
    title: 'Monolithic vs. Microservices Trade-offs',
    field: 'computer_science', level: 'college',
    promptText: 'Analyze the core trade-offs between Monolithic and Microservices architectures for a high-concurrency e-commerce application. Discuss network latency, data consistency (CAP theorem), and deployment complexity.',
    suggestedWords: 280, timeMinutes: 20,
  },
  {
    id: 'col_cs_2',
    title: 'CPU Scheduling & Thread Synchronization',
    field: 'computer_science', level: 'college',
    promptText: 'Explain how Priority Inversion occurs in real-time operating systems and how Priority Inheritance Protocol resolves it. Contrast this with semaphore deadlock prevention.',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_cs_3',
    title: 'Machine Learning Bias & Fairness',
    field: 'computer_science', level: 'college',
    promptText: 'Explain how training data bias can lead to unfair ML model outputs. Describe two mitigation strategies (e.g., resampling, fairness constraints) and their trade-offs with model accuracy.',
    suggestedWords: 270, timeMinutes: 20,
  },

  // ── COLLEGE: ENGINEERING ─────────────────────────────────────────────────
  {
    id: 'col_eng_1',
    title: 'Structural Failure Analysis',
    field: 'engineering', level: 'college',
    promptText: 'Using the Tacoma Narrows Bridge collapse as a case study, explain the concept of resonance failure. What engineering checks are now standard to prevent such failures in modern bridge design?',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_eng_2',
    title: 'Renewable Energy Trade-offs',
    field: 'engineering', level: 'college',
    promptText: 'Compare solar and wind energy systems as electricity sources for a mid-sized Indian city. Discuss efficiency, land use, intermittency, and storage requirements.',
    suggestedWords: 270, timeMinutes: 20,
  },

  // ── COLLEGE: MEDICAL ─────────────────────────────────────────────────────
  {
    id: 'col_med_1',
    title: 'Antibiotic Resistance Crisis',
    field: 'medical', level: 'college',
    promptText: 'Explain the mechanism by which bacteria develop antibiotic resistance. What are the public health consequences of overuse of antibiotics? Suggest two policy-level interventions.',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_med_2',
    title: 'Ethical Implications of Autonomous AI in Medicine',
    field: 'medical', level: 'college',
    promptText: 'Evaluate the ethical challenges when deploying autonomous AI for medical diagnostics. Who bears legal liability for misdiagnosis? How can algorithmic bias be mitigated?',
    suggestedWords: 280, timeMinutes: 20,
  },

  // ── COLLEGE: BUSINESS ────────────────────────────────────────────────────
  {
    id: 'col_biz_1',
    title: 'Blue Ocean vs. Red Ocean Strategy',
    field: 'business', level: 'college',
    promptText: 'Explain the difference between Red Ocean and Blue Ocean strategy. Provide one real-world company example of each. What risks does a Blue Ocean strategy carry?',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_biz_2',
    title: 'Startup Valuation vs. Revenue',
    field: 'business', level: 'college',
    promptText: 'Why are some startups valued at billions despite making losses? Explain how investor sentiment, TAM, and growth metrics drive valuation. Use a real example (e.g., Ola, Swiggy, Zomato).',
    suggestedWords: 260, timeMinutes: 20,
  },

  // ── COLLEGE: LAW ─────────────────────────────────────────────────────────
  {
    id: 'col_law_1',
    title: 'Fundamental Rights vs. State Power',
    field: 'law', level: 'college',
    promptText: 'When can the Indian state legitimately restrict Fundamental Rights under Article 19? Analyze using one landmark Supreme Court case. Is the current balance adequate?',
    suggestedWords: 270, timeMinutes: 20,
  },

  // ── COLLEGE: SOCIAL SCIENCES ─────────────────────────────────────────────
  {
    id: 'col_soc_1',
    title: 'Urbanization & Inequality',
    field: 'social_sciences', level: 'college',
    promptText: 'How does rapid urbanization in developing countries worsen income inequality? Discuss two sociological theories that explain this and one policy intervention that has shown results.',
    suggestedWords: 270, timeMinutes: 20,
  },
]

export function getPromptsForUser(field: StudentField, level: StudentLevel): ExamPrompt[] {
  return EXAM_PROMPTS.filter((p) => p.field === field && p.level === level)
}

export const FIELD_LABELS: Record<StudentField, string> = {
  science:         'Science',
  maths:           'Mathematics',
  social_studies:  'Social Studies',
  language_arts:   'Language Arts',
  pcm:             'PCM (Physics, Chemistry, Maths)',
  pcb:             'PCB (Physics, Chemistry, Biology)',
  commerce:        'Commerce & Accountancy',
  humanities:      'Humanities & Social Studies',
  computer_science:'Computer Science & IT',
  engineering:     'Engineering (Mech/Civil/Elec)',
  medical:         'Medical & Life Sciences',
  business:        'Business & Management',
  law:             'Law & Political Science',
  arts:            'Fine Arts & Design',
  social_sciences: 'Social Sciences & Psychology',
  education:       'Education & Pedagogy',
}

export const LEVEL_LABELS: Record<StudentLevel, string> = {
  school_9_10:   '🏫 Class 9 / 10',
  school_11_12:  '🎓 Class 11 / 12',
  college:       '🏛️ College / University',
  postgraduate:  '🔬 Postgraduate / Research',
}

export const FIELDS_BY_LEVEL: Record<StudentLevel, StudentField[]> = {
  school_9_10:  ['science', 'maths', 'social_studies', 'language_arts'],
  school_11_12: ['pcm', 'pcb', 'commerce', 'humanities'],
  college:      ['computer_science', 'engineering', 'medical', 'business', 'law', 'arts', 'social_sciences', 'education'],
  postgraduate: ['computer_science', 'engineering', 'medical', 'business', 'law', 'social_sciences'],
}
