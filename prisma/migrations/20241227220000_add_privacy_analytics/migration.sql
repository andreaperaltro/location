-- Add privacy and analytics fields to existing models
ALTER TABLE "Location" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Proposal" ADD COLUMN "watermarkText" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "watermarkEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Proposal" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Proposal" ADD COLUMN "downloadCount" INTEGER NOT NULL DEFAULT 0;

-- Create ProposalAnalytics table
CREATE TABLE "ProposalAnalytics" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalAnalytics_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "ProposalAnalytics_proposalId_idx" ON "ProposalAnalytics"("proposalId");
CREATE INDEX "ProposalAnalytics_event_idx" ON "ProposalAnalytics"("event");
CREATE INDEX "ProposalAnalytics_createdAt_idx" ON "ProposalAnalytics"("createdAt");

-- Add foreign key constraint
ALTER TABLE "ProposalAnalytics" ADD CONSTRAINT "ProposalAnalytics_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
