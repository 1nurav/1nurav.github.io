// Single source of truth for every piece of content on the site.
// Edit here — components read from this file and never hardcode copy.

// Imported rather than referenced by path so Astro optimizes it at build time
// (WebP + a srcset). Full-resolution original lives in `originals/`, untracked.
import photo from '../assets/varun.jpg';

// Page title and meta description. They live here with the rest of the copy
// rather than inline in index.astro, so the title, og:title and twitter card
// all read from one string instead of drifting apart.
export const meta = {
  // Just the name: the role is already in the description, hero, marquee and
  // stats, so repeating it in the tab earns nothing and truncates sooner.
  title: 'Varun Babu',
  description:
    'Lead Software Engineer. Seven years in, eleven engineers, and the meeting cancelled on your behalf.',
};

export const profile = {
  first: 'Varun',
  last: 'Babu',
  role: 'Lead Software Engineer',
  email: 'varunnaidu307@gmail.com',
  intro:
    'Good engineers don\'t need managing. They need the meeting cancelled, the decision made, and someone to go argue with the other team. That part I can do.',
  bio: [
    'Seven years in, four companies deep. I started at GlobalLogic in 2019 writing code that worked, then code that worked at 2am, then eventually not much code at all. The interesting problems turned out to be people, design decisions, and the distance between the two.',
    'Now I lead eleven engineers at SpeakUp. Day to day: unsticking people, asking the question everyone hoped nobody would ask, and making sure the good work gets credited to whoever actually did it.',
    'I still read every design doc line by line. It is the least glamorous way to catch a bug, and the only one that never wakes anybody up.',
  ],
  headline: 'Nobody tells you that leading engineers is mostly a reading job. Docs, diffs, and the room.',
  photo: { src: photo, alt: 'Varun Babu', position: '42% 34%' },
};

// The pills render the icon as a glyph, so the label is no longer drawn: it
// accessible name instead, which is why it still reads as a full phrase.
export const links = [
  { icon: 'x', label: 'X, @1nurav', href: 'https://x.com/1nurav' },
  { icon: 'github', label: 'GitHub, @1nurav', href: 'https://github.com/1nurav' },
  { icon: 'linkedin', label: 'LinkedIn, @1nurav', href: 'https://linkedin.com/in/1nurav' },
  { icon: 'instagram', label: 'Instagram, @1nurav', href: 'https://instagram.com/1nurav' },
  // The big address above copies to the clipboard, so this one opens a mail client.
  { icon: 'mail', label: 'Open in mail app', href: 'mailto:varunnaidu307@gmail.com' },
];

export const nav = [
  { label: 'about', href: '#about' },
  { label: 'how i lead', href: '#doctrine' },
  { label: 'experience', href: '#experience' },
];

export const marquee = [
  'estimates are fiction',
  'no deploys on friday',
  'let\'s take this offline',
  'it worked in staging',
  'who owns this service',
  'two weeks, probably',
  'lgtm',
];

export const stats = [
  { value: '7', label: 'years building software', accent: true },
  { value: '4', label: 'companies so far' },
  { value: 'SpeakUp', label: 'where I am now', small: true },
  // Headcount confirmed 11 as of Jul 2026. It also appears in bio[1], so change
  // both together. "no deploys on friday" moved to the marquee, which is why
  // this tile is free.
  { value: '11', label: 'engineers I work for' },
];

export const principles = [
  {
    n: '001',
    title: 'Unblock first, everything else second',
    body: 'A blocked engineer is the most expensive thing in the building, and the last one to mention it. So I ask.',
  },
  {
    n: '002',
    title: 'Disagree early, loudly, once',
    body: 'The cheapest moment to hate a design is before anyone has built it. After that it is a migration with feelings.',
  },
  {
    n: '003',
    title: 'Grow people, not dependencies on me',
    body: 'If the team only ships when I\'m online, I haven\'t built a team. I\'ve built a bottleneck with a nice title.',
  },
];

// Newest first. `current: true` renders the live dot instead of a duration.
// `logo` is optional: omit it and the row is just the company name. Exact
// start and end days live in the facts, not here; the rows show months.
export const experience = [
  {
    company: 'SpeakUp',
    logo: '/assets/logos/speakup.svg',
    period: 'Mar 2026 — now',
    duration: 'present',
    current: true,
    note: 'Eleven engineers. Nobody is stuck for long.',
  },
  {
    company: 'Navex',
    logo: '/assets/logos/navex.svg',
    period: 'Apr 2025 — Mar 2026',
    duration: '11 mos',
    note: 'Short stint, long list of lessons.',
  },
  {
    company: 'PeopleInTouch',
    logo: '/assets/logos/peopleintouch.png',
    period: 'Feb 2023 — Mar 2025',
    duration: '2 yrs 2 mos',
    note: 'Two years of shipping and stakeholder diplomacy.',
  },
  {
    company: 'GlobalLogic',
    logo: '/assets/logos/globallogic.png',
    period: 'Jul 2019 — Feb 2023',
    duration: '3 yrs 7 mos',
    note: 'Where it started. Code review taught me more than the degree did.',
  },
];
