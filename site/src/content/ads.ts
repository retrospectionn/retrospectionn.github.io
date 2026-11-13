// Ads mode content. Every figure here is from the Amazon CV (January). Do not merge with the
// academic CV's Upcounting numbers (PLAN section 7, G6).
import type { Kpi, Role, Service } from './types';

export const adsHero = {
  role: 'Amazon Ads Specialist',
  summary:
    'I run Amazon advertising and accounts for brands selling in the US, UK and other marketplaces — PPC, listings, brand stores and the analysis behind them.',
  since: 'On Amazon accounts since 2019',
};

export const kpis: Kpi[] = [
  { value: '$55k+', label: 'monthly ad spend managed', source: 'Upcounting Inc.' },
  { value: '$475k+', label: 'sales across marketplaces', source: 'Upcounting Inc.' },
  { value: '+29%', label: 'account profitability', source: 'Upcounting Inc.' },
  { value: '2.3', label: 'average ROAS', source: "Aphrodite's Marketing" },
  { value: '35+', label: 'brand stores launched', source: 'Code Informatics' },
  { value: '65+', label: 'A+ content sections', source: 'Code Informatics' },
];

/** Employment timeline, newest first. StrataTech has no description yet: the owner has not supplied one. */
export const experience: Role[] = [
  {
    org: 'StrataTech',
    title: 'CEO and Founder',
    place: 'Pakistan',
    dates: 'Jan 2026 – present',
    points: [],
  },
  {
    org: 'Upcounting Inc.',
    title: 'Account Manager, after a year as PPC Specialist',
    place: 'Remote, Canada',
    dates: 'Jan 2024 – Dec 2025',
    points: [
      'Managed over $55,000 in monthly ad spend across 8 accounts, with over $475,000 in sales across international marketplaces.',
      'Raised account profitability by 29% for a large spa product-line brand.',
      'Used a white-label machine-learning PPC toolkit, combining branded targeting with high-organic-opportunity keywords.',
      'Led daily strategic and technical updates with North American clients.',
      'Worked from Inventory, Brand Insight and FBA reports to improve ad performance.',
    ],
  },
  {
    org: 'Upscale Valley Pvt. Ltd.',
    title: 'Amazon Executive (contract)',
    place: 'Remote, Lahore',
    dates: 'Sep 2023 – Nov 2023',
    points: [
      'Launched 10 products across 4 brands in the UK and US.',
      'Ran market analysis in DataDive for 10 niche products.',
      'Optimised 50+ PPC campaigns, managing ACOS and TACOS through Q4.',
      'Negotiated with suppliers and handled freight forwarding from China.',
      'Managed 400+ campaigns across 70+ products.',
    ],
  },
  {
    org: "Aphrodite's Marketing Inc.",
    title: 'Amazon Content Specialist',
    place: 'Remote, United States',
    dates: 'Mar 2022 – Sep 2023',
    points: [
      'Led the Amazon presence toward a $1.2 million valuation.',
      'Raised average ROAS to 2.3 and introduced budget controls.',
      'Forecast and analysed business performance, with real-time monitoring through third-party tools on the Amazon API.',
      'Over $300,000 in monthly sales during peak season; 400+ campaigns across 70+ products.',
      'Gave guest lectures for students at an affiliated company.',
    ],
  },
  {
    org: 'Code Informatics Pvt. Ltd.',
    title: 'Senior Amazon Accounts Executive, Team Lead',
    place: 'Islamabad',
    dates: 'Jul 2019 – Mar 2022',
    points: [
      'Led an international accounts team of 4.',
      'Launched and optimised 35+ brand stores; built 65+ A+ / Enhanced Brand Content sections.',
      'Handled shipments, design feedback and accounts on Vendor and Seller marketplaces.',
      'Ran training on advanced Excel, conflict management and communication.',
    ],
  },
];

/** Roles before Amazon work, shown as one line each. Dates and places from LinkedIn. */
export const earlierRoles: Role[] = [
  {
    org: 'Sustainable Development Policy Institute (SDPI)',
    title: 'Project Assistant',
    place: 'Islamabad',
    dates: 'Nov 2018 – Aug 2019',
    points: [],
  },
  { org: "Domino's", title: 'In-store Staff', place: 'Stirling', dates: 'Oct 2017 – Jun 2018', points: [] },
  { org: 'Special Greetings', title: 'Sales Assistant', place: 'Stirling', dates: 'Aug 2016 – Jul 2017', points: [] },
];

export const services: Service[] = [
  {
    title: 'PPC management',
    body: 'Sponsored campaigns run day to day against ACOS and TACOS targets, including the Q4 peak.',
  },
  {
    title: 'Listings and content',
    body: 'A+ and Enhanced Brand Content sections built for brands — more than 65 so far.',
  },
  {
    title: 'Brand stores',
    body: 'Amazon brand stores planned, launched and optimised — more than 35 so far.',
  },
  {
    title: 'Market analysis',
    body: 'Market dynamics, bidding behaviour and profitability of niche products, analysed in DataDive.',
  },
];

/** Amazon tools shown with their icon (from each tool's own site favicon). */
export const amazonTools: { name: string; icon: string }[] = [
  { name: 'Helium10', icon: 'helium10' },
  { name: 'DataDive', icon: 'datadive' },
  { name: 'Sellerboard', icon: 'sellerboard' },
  { name: 'Keepa', icon: 'keepa' },
  { name: 'm19', icon: 'm19' },
];

export const tools: string[] = [
  'Amazon Seller Central',
  'Vendor Central',
  'SellerSprite',
  'Teikametrics Flywheel',
  'Excel',
  'RStudio',
  'Photoshop',
  'Figma',
  'Adobe XD',
  'Canva',
];

/** Certifications from LinkedIn, newest first. Links go to each issuer's own verification page. */
export const credentials: { name: string; issuer: string; when: string; href: string }[] = [
  {
    name: 'Amazon Ads Retail Certification',
    issuer: 'Amazon Ads',
    when: 'Nov 2025, valid to Nov 2027',
    href: 'https://learningconsole.amazonadvertising.com/student/award/ox5YWwP4rzq1Xk2jMHFw2gJD',
  },
  {
    name: 'McKinsey Forward Program',
    issuer: 'McKinsey & Company',
    when: 'Apr 2024',
    href: 'https://www.credly.com/badges/9c7fce79-27af-4714-a2f9-1b579f7ac445',
  },
  {
    name: 'Amazon Advertising Foundations Certification',
    issuer: 'Amazon Ads',
    when: 'Sep 2023',
    href: 'https://learningconsole.amazonadvertising.com/student/award/oK7ZWpZa9ndCUjELaMtFa9AA',
  },
];
