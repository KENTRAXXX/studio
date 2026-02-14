/**
 * @fileOverview Aggregator for chunked Master Catalog seed data.
 */

import { seedPart1 } from './part1';
import { seedPart2 } from './part2';
import { seedPart3 } from './part3';
import { seedPart4 } from './part4';
import { seedPart5 } from './part5';

/**
 * Combined registry of all luxury assets for the Master Catalog.
 */
export const masterSeedRegistry = [
    ...seedPart1,
    ...seedPart2,
    ...seedPart3,
    ...seedPart4,
    ...seedPart5
];
