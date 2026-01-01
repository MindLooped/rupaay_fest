-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tickets_count" INTEGER NOT NULL DEFAULT 1,
    "qr_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verification_code" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "seat_number" TEXT,
    "event_name" TEXT NOT NULL DEFAULT 'Rupaayi Fest',
    "event_location" TEXT NOT NULL DEFAULT 'Gitam University BLR',
    "venue" TEXT NOT NULL DEFAULT 'Auditorium',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_date" DATETIME
);
INSERT INTO "new_bookings" ("created_at", "email", "event_date", "id", "name", "qr_code", "reference", "status", "tickets_count") SELECT "created_at", "email", "event_date", "id", "name", "qr_code", "reference", "status", "tickets_count" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE UNIQUE INDEX "bookings_reference_key" ON "bookings"("reference");
CREATE INDEX "bookings_email_idx" ON "bookings"("email");
CREATE INDEX "bookings_reference_idx" ON "bookings"("reference");
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at" DESC);
CREATE UNIQUE INDEX "bookings_email_key" ON "bookings"("email");
CREATE UNIQUE INDEX "bookings_seat_number_key" ON "bookings"("seat_number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
