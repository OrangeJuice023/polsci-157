import type { Reading } from '../types';
import { PILAPIL_ANNOTATIONS, PILAPIL_CONTENT, PILAPIL_META } from './reading-pilapil';
import { RULAND_ANNOTATIONS, RULAND_CONTENT, RULAND_META } from './reading-ruland';

export const readings: Reading[] = [
  {
    id: 'ruland',
    docNumber: 'Doc 7',
    title: 'Constitutional Debate',
    author: 'Jürgen Rüland',
    topicId: 't-ruland',
    pdfFile: '/readings/ruland-constitutional-debate.pdf',
    sourceFile: 'Pol Sci 157_Torres-Pilapil_Doc 7_Ruland, Jurgen_Constitutional Debate.pdf',
    totalPages: 24,
    overview: RULAND_META.overview,
    thesis: RULAND_META.thesis,
    takeaways: RULAND_META.takeaways,
    examQuestions: RULAND_META.examQuestions,
    content: RULAND_CONTENT,
    annotations: RULAND_ANNOTATIONS,
  },
  {
    id: 'pilapil',
    docNumber: 'Doc 6',
    title: 'Some Arguments for an Institutional Approach',
    author: 'Gene Lacza Pilapil',
    topicId: 't-pilapil',
    pdfFile: '/readings/pilapil-institutional-approach.pdf',
    sourceFile:
      'Pol Sci 157_Torres-Pilapil_Doc 6_Pilapil, Gene_Some Arguments for an Institutional Approach.PDF',
    totalPages: 19,
    overview: PILAPIL_META.overview,
    thesis: PILAPIL_META.thesis,
    takeaways: PILAPIL_META.takeaways,
    examQuestions: PILAPIL_META.examQuestions,
    content: PILAPIL_CONTENT,
    annotations: PILAPIL_ANNOTATIONS,
  },
];

export const readingById = (id: string): Reading | undefined =>
  readings.find((r) => r.id === id);

export const readingByTopic = (topicId: string): Reading | undefined =>
  readings.find((r) => r.topicId === topicId);
