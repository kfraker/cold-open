// DELIBERATE FAILURE (story 0.8 proof, reverted next): a table with no migration. CI must go red.
import { pgTable, serial } from 'drizzle-orm/pg-core';

export const probe = pgTable('probe', { id: serial('id').primaryKey() });
