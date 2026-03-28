-- CreateIndex
CREATE INDEX "items_userId_isPinned_idx" ON "items"("userId", "isPinned");

-- CreateIndex
CREATE INDEX "items_userId_isFavorite_idx" ON "items"("userId", "isFavorite");
