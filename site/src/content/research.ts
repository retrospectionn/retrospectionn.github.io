// Research mode content, from the academic CV (February) and PLAN section 7.
import type { Citation, Degree, Role } from './types';

export const researchHero = {
  role: 'Researcher',
  summary:
    'Policy research, fieldwork and surveys — from development programmes in Pakistan to comparative COVID-19 governance and the language of populism.',
};

export const education: Degree[] = [
  {
    degree: 'MA Politics, Economics, Philosophy',
    school: 'HSE University',
    place: 'Moscow',
    dates: '2020 – 2022',
    notes: [
      'Attended on a full scholarship.',
      'Compiled and coded COVID-19 governance responses with Prof. Dina Rosenberg and a remote team in New York and Russia; the study was published in Nature.',
      'Speech analysis in NVivo of political-rally transcripts on populism and conspiracy theories, under Prof. Patrick Sawyer.',
      'Thesis: “Reassessment of Britain as a Unitary State”.',
    ],
  },
  {
    degree: 'BSc (Hons) Management',
    school: 'University of Stirling',
    place: 'Stirling, United Kingdom',
    dates: '2014 – 2018',
    notes: ['Students as Researchers (StAR) programme.', 'Organised the StirHack hackathon.'],
  },
];

export const researchExperience: Role[] = [
  {
    org: 'Sustainable Development Policy Institute (SDPI)',
    title: 'Project Assistant',
    place: 'Islamabad',
    dates: 'Aug 2018 – Jun 2019',
    points: [
      'Wrote the Beneficiary Satisfaction Survey report for the Pakistan Poverty Alleviation Fund.',
      'Ran field surveys in Khyber Pakhtunkhwa and wrote an impact evaluation for the UNDP-funded Strengthening Rule of Law Programme.',
      'Organised seminars and workshops with senators, politicians and officials.',
    ],
  },
  {
    org: 'Surveys on bilingualism and creativity',
    title: 'Academic project',
    points: [],
  },
];

/** Listed as authored publications under SDPI on the academic CV. Years are not given there. */
export const publications: Citation[] = [
  {
    author: 'Khan, A.',
    title: 'Achieving Sustainable Development Goals in Balochistan',
    venue: 'Daily Times',
  },
  {
    author: 'Khan, A.',
    title: 'Understanding barriers for Women’s Access to Justice in Pakistan',
    venue: 'UN Women',
  },
  {
    author: 'Khan, A.',
    title: 'Policy Brief for Public Procurement Regulatory Authority',
    venue: 'Prepared for the Public Procurement Regulatory Authority, Pakistan; republished on Medium',
    date: '12 Jan 2020',
    href: 'https://medium.com/@CasualVisionary/policy-brief-for-public-procurement-regulatory-authority-cc079b0acfff',
  },
];

/** Stated as on the CV. No citation or link until the owner supplies one (PLAN G6). */
export const natureNote =
  'The COVID-19 governance study I helped compile and code at HSE was published in Nature.';

export const methods: string[] = [
  'NVivo',
  'RStudio',
  'Survey design',
  'Quantitative research',
  'Qualitative research',
  'Fieldwork',
];
