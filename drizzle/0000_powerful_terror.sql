-- DELIBERATE FAILURE (story 0.8 proof, reverted next): this references a table that does not exist.
CREATE TABLE "probe" (
	"id" serial PRIMARY KEY NOT NULL REFERENCES "missing_table" ("id")
);
