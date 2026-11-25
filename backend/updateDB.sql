
ALTER TYPE "enum_myFileFolders_type"
ADD VALUE IF NOT EXISTS 'holst';

ALTER TYPE "enum_myFileFolders_type"
ADD VALUE IF NOT EXISTS 'magnit';

ALTER TYPE "enum_myFileFolders_type"
ADD VALUE IF NOT EXISTS 'poster';

ALTER TABLE "myFileFolders"
ADD COLUMN IF NOT EXISTS "settingId" UUID;

ALTER TABLE "myFileFolders"
ADD COLUMN IF NOT EXISTS "note" TEXT NOT NULL DEFAULT '';

ALTER TABLE "myFileFolders"
ADD COLUMN "paperType" VARCHAR(20) DEFAULT 'glossy';