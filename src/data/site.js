// Single source of truth for every piece of content on the site.
// Edit here — components read from this file and never hardcode copy.

// Imported rather than referenced by path so Astro optimizes it at build time
// (WebP + a srcset). Full-resolution original lives in `originals/`, untracked.
import photo from '../assets/varun.jpg';

export const profile = {
  first: 'Varun',
  last: 'Babu',
  role: 'Team Lead',
  email: 'varunnaidu307@gmail.com',
  intro:
    'I lead engineers, remove whatever is in their way, and review the architecture before it becomes someone\'s 2am problem. The best days end with nobody stuck.',
  bio: [
    'Seven years in, four companies deep. I started writing code at GlobalLogic in 2019 and somewhere along the way the interesting problems stopped being syntax and started being people, design decisions, and the gap between them.',
    'Now I lead a team at SpeakUp. Day to day that means clearing blockers, reviewing code and architecture before it hardens into a migration, and making sure the people around me have room to do their best work — and get the credit for it.',
    'I still read every design doc properly. It is the cheapest bug fix there is.',
  ],
  headline: 'I lead engineers, unblock them, and review the code and architecture before production does.',
  photo: { src: photo, alt: 'Varun Babu', position: '42% 34%' },
};

export const links = [
  { label: 'X / @1nurav', href: 'https://x.com/1nurav' },
  { label: 'Instagram / @1nurav', href: 'https://instagram.com/1nurav' },
  { label: 'Email', href: 'mailto:varunnaidu307@gmail.com' },
];

export const nav = [
  { label: 'about', href: '#about' },
  { label: 'how i lead', href: '#doctrine' },
  { label: 'experience', href: '#experience' },
  { label: 'work', href: '#work' },
];

export const marquee = [
  'team lead',
  'unblocker of blockers',
  'architecture reviews',
  'ships things',
  '1nurav',
];

export const stats = [
  { value: '7', label: 'years building software', accent: true },
  { value: '4', label: 'companies, one craft' },
  { value: 'Team Lead', label: 'currently at SpeakUp', small: true },
  { value: '0', label: 'deploys on friday' },
];

export const principles = [
  {
    n: '001',
    title: 'Unblock first, everything else second',
    body: 'If someone is stuck, that is my top priority. A blocked engineer is the most expensive thing in the room.',
  },
  {
    n: '002',
    title: 'Review the design, not just the diff',
    body: 'Architecture reviews catch the problems code review never will. Ask "what happens at 10x?" early, sleep better later.',
  },
  {
    n: '003',
    title: 'Grow people, not dependencies on me',
    body: 'If the team only ships when I am online, I have built a bottleneck and called it leadership.',
  },
];

// Newest first. `current: true` renders the live dot instead of a duration.
export const experience = [
  {
    company: 'SpeakUp',
    period: 'Mar 2026 — now',
    duration: 'present',
    current: true,
    note: 'Team Lead — unblocking people, reviewing code and architecture.',
  },
  {
    company: 'Navex',
    period: '9 Apr 2025 — 6 Mar 2026',
    duration: '11 mos',
    note: 'Short stint, long list of lessons.',
  },
  {
    company: 'PeopleInTouch',
    period: 'Feb 2023 — 31 Mar 2025',
    duration: '2 yrs 2 mos',
    note: 'Two years of shipping and stakeholder diplomacy.',
  },
  {
    company: 'GlobalLogic',
    period: '15 Jul 2019 — 3 Feb 2023',
    duration: '3 yrs 7 mos',
    note: 'Where it started. Learned more from code review than from any course.',
  },
];

// Add `image: '/assets/whatever.jpg'` to swap the striped placeholder for a real shot.
export const projects = [
  {
    title: 'Project One',
    year: '20XX',
    body: 'One witty line about what it did and who it saved. Classified until further notice.',
  },
  {
    title: 'Project Two',
    year: '20XX',
    body: 'The one where the deadline moved twice and it still shipped. Details incoming.',
  },
  {
    title: 'Project Three',
    year: '20XX',
    body: 'Small idea, suspiciously large impact. Write-up pending your notes.',
  },
];
