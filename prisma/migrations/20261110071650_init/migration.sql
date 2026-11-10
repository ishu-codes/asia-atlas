-- CreateTable
CREATE TABLE "people" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mongo_id" TEXT,
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

-- CreateIndex
CREATE UNIQUE INDEX "people_mongo_id_key" ON "people"("mongo_id");

-- CreateIndex
CREATE INDEX "people_ethnicity_idx" ON "people"("ethnicity");

-- CreateIndex
CREATE INDEX "people_gender_idx" ON "people"("gender");

-- CreateIndex
CREATE INDEX "people_category_idx" ON "people"("category");

-- CreateIndex
CREATE INDEX "people_birth_date_idx" ON "people"("birth_date");
