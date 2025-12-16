-- Clean DB path: only add columns (no drops needed because columns don't exist on a fresh database)
ALTER TABLE "User"
ADD COLUMN "huggingfaceApiKey" TEXT,
ADD COLUMN "selectedHuggingfaceModel" TEXT;
