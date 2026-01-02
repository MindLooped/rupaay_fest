-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_date" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "seat_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "gitam_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_key" ON "bookings"("reference");

-- CreateIndex
CREATE INDEX "bookings_email_idx" ON "bookings"("email");

-- CreateIndex
CREATE INDEX "bookings_reference_idx" ON "bookings"("reference");

-- CreateIndex
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_email_key" ON "bookings"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_seat_number_key" ON "bookings"("seat_number");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
