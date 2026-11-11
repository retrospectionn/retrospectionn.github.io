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
    title: 'Account Manager',
    place: 'Remote, Canada',
    dates: 'Jan 2024 – Dec 2025',
    points: [
      'Managed over $55,000 in monthly ad spend across 8 accounts, with over $475,000 in sales across international marketplaces.',
      'Raised account profitability by 29% for a large spa product-line brand.',
      'Used a white-label machine-learning PPC toolkit, combining branded targeting with high-organic-opportunity keywords.',
      'Led daily strategic and technical updates with North American clients.',
      'Worked from Inventory, Brand Insight and FBA reports to improve ad performance.',
    ],
    chips: ['$55k+/mo spend', '8 accounts', '$475k+ sales', '+29% profitability'],
  },
  {
    org: 'Upscale Valley Pvt. Ltd.',
    title: 'Amazon Executive',
    points: [
      'Launched 10 products across 4 brands in the UK and US.',
      'Ran market analysis in DataDive for 10 niche products.',
      'Optimised 50+ PPC campaigns, managing ACOS and TACOS through Q4.',
      'Negotiated with suppliers and handled freight forwarding from China.',
      'Managed 400+ campaigns across 70+ products.',
    ],
    chips: ['10 launches', '4 brands', '400+ campaigns'],
  },
  {
    org: "Aphrodite's Marketing Inc.",
    title: 'Amazon Content Specialist',
    place: 'Remote, United States',
    dates: 'Mar 2022 – Sep 2023',
    points: [
      'Led the Amazon presence toward a $1.2 million valuation.',
      'Raised average ROAS to 2.3 and introduced budget controls.',
      'Over $300,000 in monthly sales during peak season; 400+ campaigns across 70+ products.',
      'Gave guest lectures for students at an affiliated company.',
    ],
    chips: ['2.3 ROAS', '$300k+/mo peak', '$1.2M valuation'],
  },
  {
    org: 'Code Informatics Pvt. Ltd.',
    title: 'Senior Amazon Accounts Executive, Team Lead',
    place: 'Islamabad',
    dates: 'Jun 2019 – Jun 2022',
    points: [
      'Led an international accounts team of 4.',
      'Launched and optimised 35+ brand stores; built 65+ A+ / Enhanced Brand Content sections.',
      'Handled shipments, design feedback and accounts on Vendor and Seller marketplaces.',
      'Ran training on advanced Excel, conflict management and communication.',
    ],
    chips: ['Team of 4', '35+ stores', '65+ A+ sections'],
  },
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

export const tools: string[] = [
  'Amazon Seller Central',
  'Vendor Central',
  'Helium10',
  'SellerSprite',
  'DataDive',
  'Teikametrics Flywheel',
  'Excel',
  'RStudio',
  'Photoshop',
  'Figma',
  'Adobe XD',
  'Canva',
];

export const credentials = [{ name: 'McKinsey Forward Program', year: '2024' }];
