-- CreateEnum
CREATE TYPE "TripRequestStatus" AS ENUM ('new', 'contacted', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('bus', 'minibus', 'van', 'no_preference');

-- CreateTable
CREATE TABLE "TripRequest" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pickup" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "isRoundTrip" BOOLEAN NOT NULL DEFAULT false,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "vehicleType" "VehicleType" NOT NULL,
    "passengerCount" INTEGER NOT NULL,
    "specialRequirements" TEXT,
    "status" "TripRequestStatus" NOT NULL DEFAULT 'new',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripRequest_ref_key" ON "TripRequest"("ref");

-- CreateIndex
CREATE INDEX "TripRequest_status_idx" ON "TripRequest"("status");

-- CreateIndex
CREATE INDEX "TripRequest_submittedAt_idx" ON "TripRequest"("submittedAt");
