// DELIBERATE FAILURE (story 0.8 proof, reverted next): its migration is broken. CI must go red.
import { pgTable, serial } from 'drizzle-orm/pg-core';

export const probe = pgTable('probe', { id: serial('id').primaryKey() });
