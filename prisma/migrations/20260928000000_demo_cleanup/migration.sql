CREATE TABLE "DemoCleanupRun" (
    "day" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cutoff" TIMESTAMP(3) NOT NULL,
    "deletedOrders" INTEGER NOT NULL DEFAULT 0,
    "deletedLeads" INTEGER NOT NULL DEFAULT 0,
    "deletedConversations" INTEGER NOT NULL DEFAULT 0,
    "restoredProducts" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DemoCleanupRun_pkey" PRIMARY KEY ("day")
);
