// Maps mode content, from the academic CV, the GitHub profile and PLAN section 7.
import type { Project, Role } from './types';

export const mapsHero = {
  role: 'Mapper',
  summary:
    'OpenStreetMap contributor since 2018, mapping Islamabad and Rawalpindi and learning to build open-source GIS tools for OpenStreetMap.',
  coords: { lat: '33.6844° N', lon: '73.0479° E', place: 'Islamabad' },
};

export const fieldWork: Role[] = [
  {
    org: 'OpenStreetMap',
    title: 'Contributor',
    dates: '2018 – present',
    points: [
      'Mapped Islamabad’s green areas and building footprints.',
      'Mapped informal housing across Islamabad.',
      'Mapped Raja Bazaar in Rawalpindi.',
      'Organised the Sarafa Bazaar Mapathon to train students in creating and maintaining datasets.',
      'Mapped Islamabad Pink Bus areas.',
      'Over 5,000 edits, as noted in a 2023 article.',
    ],
  },
  {
    org: 'Alliance for Urban Rights',
    href: 'https://www.linkedin.com/company/alliance-urban-rights/home/',
    title: 'Mapping Fellow and Project Assistant',
    points: [
      'Ground-truthing and surveys of katchi abadis (informal settlements) in Islamabad.',
      'Interviews with residents about the facilities available to each abadi.',
      'Cleaned and validated survey data and finalised the reports.',
    ],
  },
  {
    org: 'Code for Pakistan',
    title: 'Volunteer',
    points: [
      'Building a community of OpenStreetMap contributors.',
      'With Faizan Khattak, a workable map of Islamabad’s public transport.',
    ],
  },
  {
    org: 'OpenStreetMap Community Pakistan',
    title: 'Volunteer',
    points: [],
  },
];

export const highlights: { title: string; body: string }[] = [
  {
    title: 'Mapping for journalists',
    body: 'A night-light pollution map of the Karachi coastline.',
  },
  {
    title: 'Flood.pk hackathon',
    body: 'Winning entry at the flood hackathon run by NIC Peshawar with Google and S&P Global.',
  },
];

export const volunteering: string[] = [
  'Islamabad Climate March',
  'Conservation volunteering, Stirling',
];

export const projects: Project[] = [
  {
    name: 'SimYourCity',
    summary:
      'An open-source GIS explorer for OpenStreetMap amenity, land-use and transit data.',
    stack: ['Flask', 'pyosmium', 'MapLibre', 'Shapely'],
    href: 'https://github.com/retrospectionn/simyourcity',
    live: 'https://simyourcity.vercel.app',
    image: '/media/simyourcity-banner.webp',
    imageAlt: 'SimYourCity banner',
    license: 'MIT',
  },
  {
    name: 'osm-campus',
    summary: 'A 3D campus built from micromapped OpenStreetMap data.',
    href: 'https://github.com/retrospectionn/osm-campus',
  },
  {
    name: 'solarmapping',
    summary: 'Solar mapping experiments.',
    href: 'https://github.com/retrospectionn/solarmapping',
  },
];

/** Forks worth one line. Trading-bot forks are deliberately left out. */
export const forks: Project[] = [
  {
    name: 'gtfs-osm-sync',
    summary: 'Syncs GTFS transit data with OpenStreetMap.',
    href: 'https://github.com/retrospectionn/gtfs-osm-sync',
  },
  {
    name: 'gtfs-osm-import',
    summary: 'Imports GTFS transit data into OpenStreetMap.',
    href: 'https://github.com/retrospectionn/gtfs-osm-import',
  },
];

export const mapTools: string[] = [
  'QGIS',
  'Google Earth Pro',
  'RStudio',
  'MapLibre',
  'pyosmium',
  'Overpass',
  'NDVI imagery',
  'Night-light imagery',
];

/** Esri courses, from LinkedIn (no public credential links listed). Newest first. */
export const mapCertificates: { name: string; issuer: string; when: string; body: string }[] = [
  {
    name: 'ArcGIS Imagery: Foundations and Frontiers',
    issuer: 'Esri MOOC',
    when: 'Dec 2025',
    body: 'Working with satellite and aerial imagery in ArcGIS.',
  },
  {
    name: 'Cartography',
    issuer: 'Esri MOOC',
    when: 'Oct 2025',
    body: 'Map-making in ArcGIS: labelling, visualisation and time-series analysis.',
  },
];

export const osmAttribution = 'Map data © OpenStreetMap contributors';
