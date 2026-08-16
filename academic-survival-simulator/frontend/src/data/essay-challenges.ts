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
  {
    id: 's910_sci_4',
    title: 'Sound & Light Waves',
    field: 'science', level: 'school_9_10',
    promptText: 'Compare the properties of sound and light waves. Why can light travel through a vacuum but sound cannot? Give one real-life application that relies on each type of wave.',
    suggestedWords: 190, timeMinutes: 20,
  },
  {
    id: 's910_sci_5',
    title: 'Acids, Bases & pH in Daily Life',
    field: 'science', level: 'school_9_10',
    promptText: 'Define acids and bases using the Arrhenius concept. What is the pH scale? Give two everyday examples of acids and two of bases, and explain why knowing pH matters in cooking and medicine.',
    suggestedWords: 200, timeMinutes: 20,
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
  {
    id: 's910_math_3',
    title: 'Polynomials & Their Applications',
    field: 'maths', level: 'school_9_10',
    promptText: 'What is a polynomial? Explain the relationship between the zeroes of a quadratic polynomial and its coefficients. Give a real-world context where a quadratic equation naturally appears.',
    suggestedWords: 190, timeMinutes: 20,
  },
  {
    id: 's910_math_4',
    title: 'Coordinate Geometry Fundamentals',
    field: 'maths', level: 'school_9_10',
    promptText: 'Explain how the distance formula and section formula are derived from coordinate geometry. Solve a short problem: find the midpoint of the line segment joining (3, -4) and (-1, 6) and explain each step.',
    suggestedWords: 200, timeMinutes: 20,
  },
  {
    id: 's910_math_5',
    title: 'Probability in Real Life',
    field: 'maths', level: 'school_9_10',
    promptText: 'Define probability and explain the difference between theoretical and experimental probability with examples. Why is probability important in weather forecasting and insurance?',
    suggestedWords: 180, timeMinutes: 20,
  },

  // ── SCHOOL 9-10: SOCIAL STUDIES ──────────────────────────────────────────
  {
    id: 's910_soc_1',
    title: 'French Revolution & Its Legacy',
    field: 'social_studies', level: 'school_9_10',
    promptText: 'Describe the main causes of the French Revolution. How did the ideals of Liberty, Equality, and Fraternity influence later democratic movements around the world? Give one specific example.',
    suggestedWords: 220, timeMinutes: 20,
  },
  {
    id: 's910_soc_2',
    title: 'Democracy & Its Pillars',
    field: 'social_studies', level: 'school_9_10',
    promptText: 'What makes a government a democracy? Explain three essential features of a democratic system. Using India as an example, describe how free and fair elections strengthen democracy.',
    suggestedWords: 210, timeMinutes: 20,
  },
  {
    id: 's910_soc_3',
    title: 'Resources: Types & Conservation',
    field: 'social_studies', level: 'school_9_10',
    promptText: 'Classify natural resources by renewability and availability. Why is sustainable development important? Suggest two practical measures a community can take to conserve water resources.',
    suggestedWords: 200, timeMinutes: 20,
  },
  {
    id: 's910_soc_4',
    title: 'Globalisation & Its Effects on India',
    field: 'social_studies', level: 'school_9_10',
    promptText: 'Define globalisation and explain how it has affected Indian industries. Has globalisation been more beneficial or harmful for Indian workers? Support your argument with specific examples.',
    suggestedWords: 220, timeMinutes: 20,
  },
  {
    id: 's910_soc_5',
    title: 'Gender Inequality & Social Change',
    field: 'social_studies', level: 'school_9_10',
    promptText: 'Explain what gender inequality means in the context of Indian society. Identify two areas where inequality persists and suggest one policy and one community action that can bring change.',
    suggestedWords: 210, timeMinutes: 20,
  },

  // ── SCHOOL 9-10: LANGUAGE ARTS ───────────────────────────────────────────
  {
    id: 's910_lang_1',
    title: 'Power of Persuasion in Writing',
    field: 'language_arts', level: 'school_9_10',
    promptText: 'Explain the three modes of persuasion: ethos, pathos, and logos. Write a short persuasive paragraph (60–80 words) arguing for school uniforms, deliberately using all three techniques.',
    suggestedWords: 200, timeMinutes: 20,
  },
  {
    id: 's910_lang_2',
    title: 'Character Development in Fiction',
    field: 'language_arts', level: 'school_9_10',
    promptText: 'Explain the difference between a static and a dynamic character. Choose any novel or story you have read and analyze how the protagonist changes from the beginning to the end, with textual evidence.',
    suggestedWords: 210, timeMinutes: 20,
  },
  {
    id: 's910_lang_3',
    title: 'Poetry: Form, Tone & Meaning',
    field: 'language_arts', level: 'school_9_10',
    promptText: 'Choose a poem you have studied and analyze how the poet uses imagery, rhyme scheme, and tone to convey a central theme. How does the form reinforce the meaning?',
    suggestedWords: 200, timeMinutes: 20,
  },
  {
    id: 's910_lang_4',
    title: 'Media Literacy & Fake News',
    field: 'language_arts', level: 'school_9_10',
    promptText: 'What is media literacy and why is it important in the age of social media? List three strategies a student can use to identify fake news or misleading headlines and explain why each is effective.',
    suggestedWords: 210, timeMinutes: 20,
  },
  {
    id: 's910_lang_5',
    title: 'Narrative Voice & Point of View',
    field: 'language_arts', level: 'school_9_10',
    promptText: 'Explain first-person, second-person, and third-person narrative perspectives. How does the choice of point of view affect the reader\'s experience and emotional connection to the story? Give examples.',
    suggestedWords: 200, timeMinutes: 20,
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
  {
    id: 's1112_pcm_4',
    title: 'Conic Sections in Real World',
    field: 'pcm', level: 'school_11_12',
    promptText: 'Explain how parabolas, ellipses, and hyperbolas arise from slicing a cone. Give one real-world engineering or scientific application of each conic section and explain the underlying mathematical property that makes it useful.',
    suggestedWords: 230, timeMinutes: 20,
  },
  {
    id: 's1112_pcm_5',
    title: 'Atomic Models — Evolution of Ideas',
    field: 'pcm', level: 'school_11_12',
    promptText: 'Trace the evolution of atomic models from Dalton to Bohr. What experimental evidence forced each model to be revised? Why is Bohr\'s model considered a landmark despite its limitations?',
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
  {
    id: 's1112_pcb_3',
    title: 'Photosynthesis vs. Cellular Respiration',
    field: 'pcb', level: 'school_11_12',
    promptText: 'Compare and contrast photosynthesis and aerobic cellular respiration in terms of reactants, products, location in the cell, and energy outcome. How are the two processes interdependent in an ecosystem?',
    suggestedWords: 230, timeMinutes: 20,
  },
  {
    id: 's1112_pcb_4',
    title: 'Immune System & Vaccination',
    field: 'pcb', level: 'school_11_12',
    promptText: 'Differentiate between the innate and adaptive immune responses. Explain how vaccines train the immune system. Why does herd immunity require a critical percentage of a population to be vaccinated?',
    suggestedWords: 240, timeMinutes: 20,
  },
  {
    id: 's1112_pcb_5',
    title: 'Ecosystem Dynamics & Food Webs',
    field: 'pcb', level: 'school_11_12',
    promptText: 'Explain the difference between a food chain and a food web. What is meant by the 10% energy transfer rule? How does removing an apex predator from an ecosystem trigger a trophic cascade?',
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
  {
    id: 's1112_com_3',
    title: 'Accounting: Trial Balance & Errors',
    field: 'commerce', level: 'school_11_12',
    promptText: 'What is a Trial Balance and what is its purpose in the accounting cycle? List and explain three types of errors that a Trial Balance cannot detect. Give a numerical example for one of them.',
    suggestedWords: 220, timeMinutes: 20,
  },
  {
    id: 's1112_com_4',
    title: 'GST: Structure & Impact',
    field: 'commerce', level: 'school_11_12',
    promptText: 'Explain the dual structure of GST in India (CGST, SGST, IGST). How does GST eliminate the cascading effect of taxes? What are its main advantages and challenges for small businesses?',
    suggestedWords: 230, timeMinutes: 20,
  },
  {
    id: 's1112_com_5',
    title: 'Business Ethics & Corporate Responsibility',
    field: 'commerce', level: 'school_11_12',
    promptText: 'Define business ethics and Corporate Social Responsibility (CSR). Using one Indian company as an example, evaluate whether good ethics and profitability can coexist in the long run.',
    suggestedWords: 220, timeMinutes: 20,
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
  {
    id: 's1112_hum_3',
    title: 'Caste System & Its Modern Relevance',
    field: 'humanities', level: 'school_11_12',
    promptText: 'Trace the historical origins of the caste system in India. Has reservation policy successfully addressed caste-based discrimination? Argue your position with two pieces of evidence.',
    suggestedWords: 240, timeMinutes: 20,
  },
  {
    id: 's1112_hum_4',
    title: 'Colonialism & Its Lasting Legacy',
    field: 'humanities', level: 'school_11_12',
    promptText: 'Explain how British colonialism restructured India\'s economy and society. What economic and psychological legacies of colonialism are still visible in India today? Cite specific examples.',
    suggestedWords: 250, timeMinutes: 20,
  },
  {
    id: 's1112_hum_5',
    title: 'Nationalism vs. Globalisation',
    field: 'humanities', level: 'school_11_12',
    promptText: 'Is rising nationalism a threat to globalisation? Discuss using two current examples from different countries. What are the economic and cultural trade-offs of prioritising national identity over global integration?',
    suggestedWords: 240, timeMinutes: 20,
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
  {
    id: 'col_cs_4',
    title: 'Database Normalization & Query Optimization',
    field: 'computer_science', level: 'college',
    promptText: 'Explain 1NF, 2NF, and 3NF with a real example showing each normalization step. When might intentional denormalization improve performance, and what are the risks of doing so?',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_cs_5',
    title: 'Cryptography: Symmetric vs. Asymmetric',
    field: 'computer_science', level: 'college',
    promptText: 'Explain the fundamental difference between symmetric and asymmetric encryption. How does HTTPS use both in a TLS handshake? What is the role of a Certificate Authority in this trust chain?',
    suggestedWords: 265, timeMinutes: 20,
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
  {
    id: 'col_eng_3',
    title: 'Control Systems: Feedback & Stability',
    field: 'engineering', level: 'college',
    promptText: 'Explain the difference between open-loop and closed-loop control systems. Why is negative feedback used in most engineering systems? Describe a real-world application where instability from positive feedback is problematic.',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_eng_4',
    title: 'Lean Manufacturing & Six Sigma',
    field: 'engineering', level: 'college',
    promptText: 'What is Lean Manufacturing? Explain the concept of Muda (waste) with three examples. How does Six Sigma complement Lean principles, and what metric does Six Sigma use to define "near perfection"?',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_eng_5',
    title: 'Material Selection: Strength vs. Weight',
    field: 'engineering', level: 'college',
    promptText: 'Why is specific strength (strength-to-weight ratio) a critical metric in aerospace engineering? Compare steel, aluminium alloys, and carbon fibre composites on this metric. When would you choose each material?',
    suggestedWords: 265, timeMinutes: 20,
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
  {
    id: 'col_med_3',
    title: 'Pharmacokinetics: ADME Principles',
    field: 'medical', level: 'college',
    promptText: 'Define Absorption, Distribution, Metabolism, and Excretion (ADME) of drugs. How does the route of administration affect bioavailability? Explain why dosing intervals are calculated from a drug\'s half-life.',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_med_4',
    title: 'Pathophysiology of Type 2 Diabetes',
    field: 'medical', level: 'college',
    promptText: 'Describe the pathophysiology of Type 2 Diabetes, starting with insulin resistance. How do lifestyle modifications and metformin address different points in this pathway? What long-term complications arise from poor glycemic control?',
    suggestedWords: 280, timeMinutes: 20,
  },
  {
    id: 'col_med_5',
    title: 'Public Health: Epidemiology Basics',
    field: 'medical', level: 'college',
    promptText: 'Define incidence, prevalence, and mortality rate. How are these metrics used to assess the burden of a disease like tuberculosis in India? What is the difference between a cohort study and a case-control study?',
    suggestedWords: 270, timeMinutes: 20,
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
  {
    id: 'col_biz_3',
    title: 'Supply Chain Disruptions',
    field: 'business', level: 'college',
    promptText: 'Using the COVID-19 pandemic as a case study, explain three major ways global supply chains were disrupted. What risk-management strategies (e.g., nearshoring, just-in-case inventory) have companies adopted in response?',
    suggestedWords: 265, timeMinutes: 20,
  },
  {
    id: 'col_biz_4',
    title: 'Marketing Mix in the Digital Age',
    field: 'business', level: 'college',
    promptText: 'How has the rise of digital platforms transformed the traditional 4Ps of marketing (Product, Price, Place, Promotion)? Illustrate with an example of a D2C brand that disrupted an established market using digital marketing.',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_biz_5',
    title: 'Financial Ratios & Business Health',
    field: 'business', level: 'college',
    promptText: 'Explain the purpose of liquidity, profitability, and leverage ratios in analyzing a company\'s financial health. Why might a company with strong profits still face a liquidity crisis? Illustrate with the concept of working capital.',
    suggestedWords: 265, timeMinutes: 20,
  },

  // ── COLLEGE: LAW ─────────────────────────────────────────────────────────
  {
    id: 'col_law_1',
    title: 'Fundamental Rights vs. State Power',
    field: 'law', level: 'college',
    promptText: 'When can the Indian state legitimately restrict Fundamental Rights under Article 19? Analyze using one landmark Supreme Court case. Is the current balance adequate?',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_law_2',
    title: 'Contract Law: Offer, Acceptance & Consideration',
    field: 'law', level: 'college',
    promptText: 'Explain the essential elements of a valid contract under the Indian Contract Act, 1872. Illustrate how the absence of consideration or free consent can render a contract void or voidable. Use a hypothetical scenario.',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_law_3',
    title: 'Judicial Review & Separation of Powers',
    field: 'law', level: 'college',
    promptText: 'Explain the doctrine of judicial review in India. How does the Supreme Court\'s power of judicial review interact with Parliamentary sovereignty? Discuss one case where the court struck down legislation and its significance.',
    suggestedWords: 280, timeMinutes: 20,
  },
  {
    id: 'col_law_4',
    title: 'Criminal Law: Mens Rea & Actus Reus',
    field: 'law', level: 'college',
    promptText: 'Define mens rea and actus reus. Why must both elements generally coexist for criminal liability? Discuss one exception under Indian Penal Code where strict liability applies (no mens rea required) and justify the rationale.',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_law_5',
    title: 'Intellectual Property: Copyright vs. Patent',
    field: 'law', level: 'college',
    promptText: 'Distinguish between copyright and patent protection under Indian IP law. What types of works/inventions qualify for each? How has digital technology complicated copyright enforcement, and what does the safe harbour doctrine do?',
    suggestedWords: 270, timeMinutes: 20,
  },

  // ── COLLEGE: ARTS & DESIGN ───────────────────────────────────────────────
  {
    id: 'col_arts_1',
    title: 'Modernism vs. Postmodernism in Art',
    field: 'arts', level: 'college',
    promptText: 'Contrast the core philosophies of Modernism and Postmodernism as art movements. How did Postmodern artists challenge the "grand narratives" promoted by Modernism? Use one artist from each movement to illustrate your argument.',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_arts_2',
    title: 'Design Thinking & Human-Centered Design',
    field: 'arts', level: 'college',
    promptText: 'Explain the five stages of Design Thinking (Empathize, Define, Ideate, Prototype, Test). Apply this framework to redesign the experience of voting in India for first-time voters aged 18–21.',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_arts_3',
    title: 'Photography as Social Commentary',
    field: 'arts', level: 'college',
    promptText: 'How has documentary photography been used as a tool for social and political change? Analyze one iconic photograph that shifted public opinion on an issue and explain the visual techniques that made it powerful.',
    suggestedWords: 255, timeMinutes: 20,
  },
  {
    id: 'col_arts_4',
    title: 'Architecture & Cultural Identity',
    field: 'arts', level: 'college',
    promptText: 'How does architecture reflect the cultural and political identity of a society? Compare the design philosophy behind a traditional Indian monument and a modern Indian building. What tensions exist between heritage and innovation?',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_arts_5',
    title: 'Digital Art & the Question of Authenticity',
    field: 'arts', level: 'college',
    promptText: 'The rise of AI-generated art and NFTs has challenged traditional notions of artistic authenticity and ownership. Is AI-generated art "real" art? Discuss the ethical and economic implications for human artists.',
    suggestedWords: 265, timeMinutes: 20,
  },

  // ── COLLEGE: SOCIAL SCIENCES ─────────────────────────────────────────────
  {
    id: 'col_soc_1',
    title: 'Urbanization & Inequality',
    field: 'social_sciences', level: 'college',
    promptText: 'How does rapid urbanization in developing countries worsen income inequality? Discuss two sociological theories that explain this and one policy intervention that has shown results.',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_soc_2',
    title: 'Social Identity & Prejudice',
    field: 'social_sciences', level: 'college',
    promptText: 'Explain Social Identity Theory (Tajfel & Turner). How does in-group favoritism and out-group discrimination arise from group membership? Describe one real-world example of prejudice this theory explains and one intervention that reduces it.',
    suggestedWords: 265, timeMinutes: 20,
  },
  {
    id: 'col_soc_3',
    title: 'Climate Justice & Social Vulnerability',
    field: 'social_sciences', level: 'college',
    promptText: 'Explain why the populations least responsible for climate change are often the most vulnerable to its impacts. Using a case study (e.g., coastal Bangladesh, drought in sub-Saharan Africa), analyze the intersection of poverty and climate risk.',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_soc_4',
    title: 'Mental Health Stigma in Society',
    field: 'social_sciences', level: 'college',
    promptText: 'What is social stigma and how does it prevent people from seeking mental health treatment? Draw on Erving Goffman\'s work on stigma. What structural changes in healthcare policy and media representation could reduce stigma?',
    suggestedWords: 265, timeMinutes: 20,
  },
  {
    id: 'col_soc_5',
    title: 'Migration: Push, Pull & Brain Drain',
    field: 'social_sciences', level: 'college',
    promptText: 'Explain the push-pull theory of migration. How does brain drain affect developing countries? Should governments restrict skilled emigration or invest in making the home country more attractive? Argue your position.',
    suggestedWords: 265, timeMinutes: 20,
  },

  // ── COLLEGE: EDUCATION ───────────────────────────────────────────────────
  {
    id: 'col_edu_1',
    title: 'Constructivism in the Classroom',
    field: 'education', level: 'college',
    promptText: 'Explain Piaget\'s constructivist theory of learning. How does it differ from a traditional behaviorist approach to teaching? Design one classroom activity for secondary school students that embodies constructivist principles.',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_edu_2',
    title: 'Inclusive Education & Learning Differences',
    field: 'education', level: 'college',
    promptText: 'Define inclusive education and explain its importance for students with learning disabilities such as dyslexia or ADHD. What specific classroom accommodations and Universal Design for Learning (UDL) strategies can support diverse learners?',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_edu_3',
    title: 'Technology in Education: Promise & Peril',
    field: 'education', level: 'college',
    promptText: 'Critically evaluate the use of technology in K-12 education. What evidence supports blended learning improving outcomes? What risks (digital divide, screen time, distraction) must educators manage? Suggest a balanced implementation framework.',
    suggestedWords: 270, timeMinutes: 20,
  },
  {
    id: 'col_edu_4',
    title: 'Assessment: Formative vs. Summative',
    field: 'education', level: 'college',
    promptText: 'Distinguish between formative and summative assessment. Why do education researchers argue that over-reliance on summative exams harms learning? Propose a hybrid assessment model for a college-level course in your discipline.',
    suggestedWords: 260, timeMinutes: 20,
  },
  {
    id: 'col_edu_5',
    title: 'Critical Pedagogy & Paulo Freire',
    field: 'education', level: 'college',
    promptText: 'Explain Paulo Freire\'s critique of the "banking model" of education. What is "praxis" in the context of his critical pedagogy? How might a teacher implement Freire\'s ideas in an Indian classroom setting today?',
    suggestedWords: 265, timeMinutes: 20,
  },

  // ── POSTGRADUATE: COMPUTER SCIENCE ───────────────────────────────────────
  {
    id: 'pg_cs_1',
    title: 'Distributed Systems: Consensus Algorithms',
    field: 'computer_science', level: 'postgraduate',
    promptText: 'Compare Paxos and Raft consensus algorithms. What problem does each solve in a distributed system? Why is Raft considered more understandable, and in what scenario might Paxos be preferred despite its complexity?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_cs_2',
    title: 'Transformer Architecture & Attention Mechanism',
    field: 'computer_science', level: 'postgraduate',
    promptText: 'Explain the self-attention mechanism in transformer models. How does multi-head attention allow the model to capture different types of relationships? Compare the computational complexity of transformers vs. LSTMs for sequence modelling.',
    suggestedWords: 310, timeMinutes: 25,
  },
  {
    id: 'pg_cs_3',
    title: 'Formal Verification in Critical Systems',
    field: 'computer_science', level: 'postgraduate',
    promptText: 'What is formal verification and why is it important for safety-critical software (e.g., avionics, medical devices)? Compare model checking and theorem proving. What are the practical scalability limitations of each approach?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_cs_4',
    title: 'Quantum Computing: Shor\'s Algorithm',
    field: 'computer_science', level: 'postgraduate',
    promptText: 'Explain the significance of Shor\'s algorithm for RSA encryption. What quantum properties (superposition, entanglement, quantum Fourier transform) does it exploit? What does this imply for post-quantum cryptographic standards?',
    suggestedWords: 305, timeMinutes: 25,
  },
  {
    id: 'pg_cs_5',
    title: 'Ethics of Artificial General Intelligence',
    field: 'computer_science', level: 'postgraduate',
    promptText: 'Critically assess the alignment problem in AI: why is it difficult to ensure an AGI system acts in accordance with human values? Compare utilitarian, deontological, and virtue ethics frameworks as potential foundations for AI governance.',
    suggestedWords: 310, timeMinutes: 25,
  },

  // ── POSTGRADUATE: ENGINEERING ─────────────────────────────────────────────
  {
    id: 'pg_eng_1',
    title: 'Finite Element Analysis: Theory & Limits',
    field: 'engineering', level: 'postgraduate',
    promptText: 'Explain the mathematical foundation of the Finite Element Method (FEM). What are the key assumptions made in mesh discretization, and how do they introduce error? When should FEM be supplemented by experimental validation?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_eng_2',
    title: 'Advanced Fluid Dynamics: Turbulence Modelling',
    field: 'engineering', level: 'postgraduate',
    promptText: 'Compare RANS, LES, and DNS approaches to turbulence modelling. What are the computational cost and accuracy trade-offs of each? In what industrial application would LES be justified despite its cost?',
    suggestedWords: 305, timeMinutes: 25,
  },
  {
    id: 'pg_eng_3',
    title: 'Smart Grids & Energy Storage',
    field: 'engineering', level: 'postgraduate',
    promptText: 'What are the key components of a smart grid? How do V2G (vehicle-to-grid) technologies and large-scale battery storage address the intermittency of renewable energy? What cybersecurity risks does increased grid connectivity introduce?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_eng_4',
    title: 'Additive Manufacturing: Opportunities & Constraints',
    field: 'engineering', level: 'postgraduate',
    promptText: 'Evaluate the capabilities and limitations of metal additive manufacturing (powder bed fusion, DED) for producing load-bearing structural components. How do residual stress and anisotropic material properties affect part qualification?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_eng_5',
    title: 'Autonomous Systems: Safety & Certification',
    field: 'engineering', level: 'postgraduate',
    promptText: 'What engineering challenges make certifying autonomous vehicles for public roads difficult? Explain the role of ISO 26262 functional safety standards and SOTIF (Safety Of The Intended Functionality). How does "edge case" testing differ from traditional software testing?',
    suggestedWords: 305, timeMinutes: 25,
  },

  // ── POSTGRADUATE: MEDICAL ─────────────────────────────────────────────────
  {
    id: 'pg_med_1',
    title: 'Precision Medicine & Pharmacogenomics',
    field: 'medical', level: 'postgraduate',
    promptText: 'Define precision medicine and explain how pharmacogenomic profiling can individualize drug therapy. Using warfarin or clopidogrel as an example, discuss the clinical implications of CYP450 genetic polymorphisms for dosing and adverse effects.',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_med_2',
    title: 'Oncology: Tumour Microenvironment & Immunotherapy',
    field: 'medical', level: 'postgraduate',
    promptText: 'Describe how the tumour microenvironment (TME) suppresses anti-tumour immunity. Explain the mechanism of PD-1/PD-L1 checkpoint inhibition. Why do only a subset of patients respond to checkpoint immunotherapy?',
    suggestedWords: 310, timeMinutes: 25,
  },
  {
    id: 'pg_med_3',
    title: 'Neuroplasticity & Stroke Rehabilitation',
    field: 'medical', level: 'postgraduate',
    promptText: 'Explain the concept of neuroplasticity and the mechanisms (axonal sprouting, LTP, cortical reorganization) that underlie recovery after ischemic stroke. How do constraint-induced movement therapy and non-invasive brain stimulation exploit neuroplasticity?',
    suggestedWords: 305, timeMinutes: 25,
  },
  {
    id: 'pg_med_4',
    title: 'Gene Therapy: CRISPR-Cas9 & Ethics',
    field: 'medical', level: 'postgraduate',
    promptText: 'Explain the molecular mechanism of CRISPR-Cas9 gene editing. What are the primary technical challenges (off-target edits, delivery) in therapeutic applications? Discuss the ethical boundaries between somatic and germline gene editing.',
    suggestedWords: 305, timeMinutes: 25,
  },
  {
    id: 'pg_med_5',
    title: 'Systematic Reviews & Meta-Analysis',
    field: 'medical', level: 'postgraduate',
    promptText: 'Explain the difference between a systematic review and a meta-analysis. What is publication bias and how does a funnel plot detect it? When can pooling RCT results be misleading, and what is clinical heterogeneity?',
    suggestedWords: 300, timeMinutes: 25,
  },

  // ── POSTGRADUATE: BUSINESS ───────────────────────────────────────────────
  {
    id: 'pg_biz_1',
    title: 'Behavioral Finance: Irrational Markets',
    field: 'business', level: 'postgraduate',
    promptText: 'Contrast the Efficient Market Hypothesis (EMH) with behavioral finance. Explain three cognitive biases (anchoring, loss aversion, herding) that cause systematic market anomalies. How can portfolio managers account for these biases?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_biz_2',
    title: 'Mergers & Acquisitions: Value Creation or Destruction?',
    field: 'business', level: 'postgraduate',
    promptText: 'Why do empirical studies suggest that most M&A deals destroy shareholder value for the acquirer? Analyze the roles of synergy overestimation, integration failure, and winner\'s curse. Use one real-world M&A case to illustrate.',
    suggestedWords: 305, timeMinutes: 25,
  },
  {
    id: 'pg_biz_3',
    title: 'ESG Investing: Performance vs. Purpose',
    field: 'business', level: 'postgraduate',
    promptText: 'Critically evaluate whether ESG (Environmental, Social, Governance) investing delivers superior risk-adjusted returns or whether it sacrifices alpha for values. What are the challenges of ESG measurement and greenwashing in fund disclosures?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_biz_4',
    title: 'Platform Economics & Network Effects',
    field: 'business', level: 'postgraduate',
    promptText: 'Explain the concept of network effects and why they create winner-takes-most dynamics in platform markets. How do multi-sided platforms (e.g., Uber, Amazon Marketplace) differ from traditional businesses in terms of pricing strategy and competitive moats?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_biz_5',
    title: 'Corporate Governance: Principal-Agent Problem',
    field: 'business', level: 'postgraduate',
    promptText: 'Define the principal-agent problem in corporate governance. What mechanisms (stock options, board independence, activist investors) are used to align CEO incentives with shareholder interests? Where do these mechanisms fail, and what reforms have been proposed?',
    suggestedWords: 300, timeMinutes: 25,
  },

  // ── POSTGRADUATE: LAW ─────────────────────────────────────────────────────
  {
    id: 'pg_law_1',
    title: 'International Arbitration vs. Litigation',
    field: 'law', level: 'postgraduate',
    promptText: 'Compare international commercial arbitration and litigation as dispute resolution mechanisms. What advantages does arbitration offer (enforceability via New York Convention, confidentiality, neutrality) and what are its limitations? Discuss a case where arbitration was preferred.',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_law_2',
    title: 'Constitutional Interpretation: Originalism vs. Living Constitutionalism',
    field: 'law', level: 'postgraduate',
    promptText: 'Contrast originalist and living constitutionalist theories of constitutional interpretation. Using an example from the Indian or U.S. Supreme Court, analyze how the interpretive philosophy adopted by judges affects substantive legal outcomes.',
    suggestedWords: 305, timeMinutes: 25,
  },
  {
    id: 'pg_law_3',
    title: 'Data Privacy Law: GDPR & DPDPA Compared',
    field: 'law', level: 'postgraduate',
    promptText: 'Compare the EU\'s GDPR and India\'s Digital Personal Data Protection Act (DPDPA) on data subject rights, consent requirements, and cross-border data transfers. What are the gaps in India\'s framework relative to GDPR?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_law_4',
    title: 'Competition Law: Defining Relevant Market',
    field: 'law', level: 'postgraduate',
    promptText: 'Explain the SSNIP (Small but Significant Non-Transitory Increase in Price) test used by competition authorities to define the relevant market. How does market definition affect merger clearance decisions? Illustrate with a digital market case.',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_law_5',
    title: 'Human Rights & Corporate Liability',
    field: 'law', level: 'postgraduate',
    promptText: 'Under the UN Guiding Principles on Business and Human Rights (UNGPs), what are the duties of states and corporations? Should corporations face binding international legal liability for human rights abuses in their supply chains? Argue your position.',
    suggestedWords: 300, timeMinutes: 25,
  },

  // ── POSTGRADUATE: SOCIAL SCIENCES ────────────────────────────────────────
  {
    id: 'pg_soc_1',
    title: 'Postcolonial Theory & Knowledge Production',
    field: 'social_sciences', level: 'postgraduate',
    promptText: 'Drawing on Said\'s Orientalism or Spivak\'s concept of the subaltern, explain how colonial power structures shaped the production of knowledge in social sciences. What does "decolonizing the curriculum" mean in practice?',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_soc_2',
    title: 'Intersectionality as an Analytical Framework',
    field: 'social_sciences', level: 'postgraduate',
    promptText: 'Explain Kimberlé Crenshaw\'s concept of intersectionality. How does examining overlapping systems of oppression (race, class, gender, caste) offer a more accurate analysis than studying each in isolation? Apply this framework to an Indian social issue.',
    suggestedWords: 300, timeMinutes: 25,
  },
  {
    id: 'pg_soc_3',
    title: 'Qualitative vs. Quantitative Research Paradigms',
    field: 'social_sciences', level: 'postgraduate',
    promptText: 'Compare ontological and epistemological assumptions underlying positivism and interpretivism in social science research. When is a mixed-methods design appropriate? What validity threats must a researcher address in ethnographic fieldwork?',
    suggestedWords: 305, timeMinutes: 25,
  },
  {
    id: 'pg_soc_4',
    title: 'Digital Surveillance & Social Control',
    field: 'social_sciences', level: 'postgraduate',
    promptText: 'Apply Foucault\'s panopticon concept to modern digital surveillance (e.g., China\'s Social Credit System, CCTV-AI networks). Does pervasive surveillance deter crime effectively, or does it produce a chilling effect on civil liberties? Use empirical evidence.',
    suggestedWords: 305, timeMinutes: 25,
  },
  {
    id: 'pg_soc_5',
    title: 'Populism & Democratic Backsliding',
    field: 'social_sciences', level: 'postgraduate',
    promptText: 'Define populism as a political logic. How have populist leaders across different ideological traditions used democratic institutions to erode democratic norms (Levitsky & Ziblatt\'s "soft guardrails")? Is democratic backsliding reversible?',
    suggestedWords: 305, timeMinutes: 25,
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
