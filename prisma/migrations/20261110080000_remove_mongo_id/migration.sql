-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_people" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "occupation" TEXT,
    "category" TEXT,
    "image_url" TEXT NOT NULL,
    "wikipedia_en_url" TEXT,
    "ethnicity" TEXT NOT NULL,
    "nationality_qid" TEXT,
    "gender" TEXT NOT NULL,
    "given_name" TEXT,
    "family_name" TEXT,
    "birth_date" TEXT,
    "data_source" TEXT NOT NULL DEFAULT 'wikidata',
    "schema_version" TEXT NOT NULL DEFAULT '1',
    "created_at" TEXT NOT NULL,
    "other" TEXT NOT NULL DEFAULT '{}'
);
INSERT INTO "new_people" ("birth_date", "category", "created_at", "data_source", "description", "ethnicity", "family_name", "gender", "given_name", "id", "image_url", "name", "nationality_qid", "occupation", "other", "schema_version", "wikipedia_en_url") SELECT "birth_date", "category", "created_at", "data_source", "description", "ethnicity", "family_name", "gender", "given_name", "id", "image_url", "name", "nationality_qid", "occupation", "other", "schema_version", "wikipedia_en_url" FROM "people";
DROP TABLE "people";
ALTER TABLE "new_people" RENAME TO "people";
CREATE INDEX "people_ethnicity_idx" ON "people"("ethnicity");
CREATE INDEX "people_gender_idx" ON "people"("gender");
CREATE INDEX "people_category_idx" ON "people"("category");
CREATE INDEX "people_birth_date_idx" ON "people"("birth_date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
