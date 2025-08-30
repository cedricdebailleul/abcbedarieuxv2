#!/usr/bin/env tsx

import { prisma } from "@/lib/prisma";
import { BadgeTriggerService } from "@/lib/services/badge-trigger-service";

async function testWelcomeBadge() {
  console.log("🎖️ Testing Welcome Badge...\n");

  try {
    // Get all users
    const users = await prisma.user.findMany({
      where: {
        email: { not: "" }
      },
      include: {
        _count: {
          select: {
            badges: true
          }
        }
      }
    });

    console.log(`📊 Found ${users.length} users in database`);

    for (const user of users) {
      console.log(`\n👤 Testing user: ${user.email} (${user._count.badges} badges)`);

      const service = BadgeTriggerService.getInstance();
      
      // Test welcome badge trigger
      await service.triggerUserRegistration(user.id);
      
      // Check badges after trigger
      const badges = await prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true }
      });
      
      console.log(`🏆 Badges after registration trigger (${badges.length}):`);
      badges.forEach(ub => {
        console.log(`  - ${ub.badge.title}: ${ub.badge.description}`);
      });
    }

  } catch (error) {
    console.error("❌ Error testing welcome badge:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWelcomeBadge();