// Medium articles: titles, dates, links and covers come from generated/medium.json (pnpm sync).
// Summaries are written for this site; they paraphrase, never quote, the articles.
import medium from './generated/medium.json';
import type { Article, MediumPost } from './types';

const posts: MediumPost[] = medium.posts;

const summaries: Record<string, { summary: string; publication?: string }> = {
  'launching-simyourcity-an-amenity-landuse-and-route-data-visualizer': {
    summary:
      'Introduces SimYourCity, an open-source tool that draws OpenStreetMap amenities and land use around a point to show which areas are underserved.',
  },
  'how-i-won-the-flood-pk-hackathon': {
    summary:
      'An account of the flood hackathon at NIC Peshawar, held with Google and S&P Global, and the QGIS and satellite-imagery work behind the entry.',
  },
  'using-night-time-imagery-to-save-turtles-in-karachis-coasts': {
    summary:
      "A night-light radiance map of Karachi's coastline, made from artificial-light-at-night imagery for a news story on the city's sea turtles.",
  },
  'the-lahorification-of-rawalpindi': {
    summary:
      'Maps how housing-society sprawl on the edges of Islamabad and Rawalpindi ties into the dust and air-quality problems of the twin cities.',
  },
  'visualizing-forest-fires-in-the-margalla-hills-using-ndvi': {
    summary:
      'A short visual note: three months of NDVI imagery layered into an animation that shows forest-fire damage in the Margalla Hills.',
  },
  'a-proposal-for-the-facilitation-of-redesigning-urban-spaces-in-city-saddar-rawalpindi': {
    summary:
      'Argues for redesigning City Saddar, one of the most walked parts of Rawalpindi, around pedestrians rather than cars.',
  },
  'creating-urban-cartographic-maps-using-rcities': {
    summary:
      'A walkthrough of drawing cartographic city maps in R from OpenStreetMap data with the rcities package.',
  },
  'thoughts-on-brexit-and-sovereignty': {
    summary:
      'A personal reflection on how a view of Brexit changed over four years, read through the question of sovereignty.',
    publication: 'Tasdeek',
  },
  'improving-pakistani-cities-through-data': {
    summary:
      'An essay on why cities drive growth and how better data could help Pakistani cities work toward the Sustainable Development Goals.',
  },
};

const pick = (slugs: string[]): Article[] =>
  slugs.flatMap((slug) => {
    const post = posts.find((p) => p.slug === slug);
    const extra = summaries[slug];
    if (!post || !extra) return [];
    return [
      {
        slug,
        title: post.title,
        link: post.link,
        date: post.date,
        cover: post.cover,
        summary: extra.summary,
        publication: extra.publication,
      },
    ];
  });

/** Newest first, as in PLAN section 7. */
export const mapsArticles = pick([
  'launching-simyourcity-an-amenity-landuse-and-route-data-visualizer',
  'how-i-won-the-flood-pk-hackathon',
  'using-night-time-imagery-to-save-turtles-in-karachis-coasts',
  'the-lahorification-of-rawalpindi',
  'visualizing-forest-fires-in-the-margalla-hills-using-ndvi',
  'a-proposal-for-the-facilitation-of-redesigning-urban-spaces-in-city-saddar-rawalpindi',
  'creating-urban-cartographic-maps-using-rcities',
]);

export const researchArticles = pick([
  'thoughts-on-brexit-and-sovereignty',
  'improving-pakistani-cities-through-data',
]);

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
