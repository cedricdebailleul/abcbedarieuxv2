#!/usr/bin/env tsx

import { prisma } from "@/lib/prisma";
import { BadgeTriggerService } from "@/lib/services/badge-trigger-service";

async function testBadgeSystem() {
  console.log("🎖️ Testing Badge System...\n");

  try {
    // Get a test user
    const user = await prisma.user.findFirst({
      where: {
        email: { not: "" }
      },
      include: {
        profile: true,
        _count: {
          select: {
            places: true,
            posts: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      console.log("❌ No users found in database");
      return;
    }

    console.log(`👤 Testing with user: ${user.email} (ID: ${user.id})`);
    console.log(`📊 User stats:`, {
      places: user._count.places,
      posts: user._count.posts,
      reviews: user._count.reviews,
      hasProfile: !!user.profile
    });

    // Check current badges
    const currentBadges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      include: {
        badge: true
      }
    });

    console.log(`\n🏆 Current badges (${currentBadges.length}):`);
    currentBadges.forEach(ub => {
      console.log(`  - ${ub.badge.title}: ${ub.badge.description}`);
    });

    // Test badge triggering
    console.log("\n🔥 Testing badge triggers...");

    const service = BadgeTriggerService.getInstance();
    
    // Test user registration badges (should give "welcome" badge if not already owned)
    console.log("\n1️⃣ Testing user registration badges:");
    await service.triggerUserRegistration(user.id);

    // Test profile update badges (should check for "profile_complete" badge)  
    console.log("\n2️⃣ Testing profile update badges:");
    await service.triggerProfileUpdate(user.id);

    // Test complete badge check (should check all possible badges)
    console.log("\n3️⃣ Testing complete badge check:");
    await service.checkAllBadgesForUser(user.id);

    // Check badges after triggers
    const afterBadges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      include: {
        badge: true
      }
    });

    console.log(`\n🏆 Badges after triggers (${afterBadges.length}):`);
    afterBadges.forEach(ub => {
      const isNew = !currentBadges.some(cb => cb.badgeId === ub.badgeId);
      const indicator = isNew ? "🆕" : "  ";
      console.log(`  ${indicator} ${ub.badge.title}: ${ub.badge.description}`);
    });

    const newBadgeCount = afterBadges.length - currentBadges.length;
    if (newBadgeCount > 0) {
      console.log(`\n✅ ${newBadgeCount} new badge(s) awarded!`);
    } else {
      console.log(`\n📝 No new badges awarded (user may already have eligible badges)`);
    }

  } catch (error) {
    console.error("❌ Error testing badge system:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testBadgeSystem();