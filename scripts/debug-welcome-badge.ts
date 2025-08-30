#!/usr/bin/env tsx

import { getBadgeEngine } from "@/lib/engines/badge-engine";
import { prisma } from "@/lib/prisma";

async function debugWelcomeBadge() {
  console.log("🔍 Debugging Welcome Badge...\n");

  try {
    const user = await prisma.user.findFirst({
      where: { email: { not: "" } },
      include: { profile: true }
    });

    if (!user) {
      console.log("❌ No user found");
      return;
    }

    console.log(`👤 User: ${user.email} (ID: ${user.id})`);

    const engine = getBadgeEngine();
    
    // Test evaluating welcome badge manually
    console.log("\n🎖️ Evaluating welcome badge...");
    const result = await engine.awardBadge(user.id, "welcome", "Manual test");
    
    console.log("Result:", result);

    // Check what badges the user has
    const badges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true }
    });
    
    console.log(`\n🏆 User badges (${badges.length}):`);
    badges.forEach(ub => {
      console.log(`  - ${ub.badge.title}: ${ub.badge.description}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugWelcomeBadge();