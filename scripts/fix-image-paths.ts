import { prisma } from "./prisma-client";

async function fixImagePaths() {
  console.log("🔧 Correction des chemins d'images avec backslashes...\n");

  try {
    // Fix images in Place table
    const places = await prisma.place.findMany({
      select: {
        id: true,
        logo: true,
        coverImage: true,
        images: true,
      },
    });

    let placesFixed = 0;
    for (const place of places) {
      const updates: any = {};
      let needsUpdate = false;

      if (place.logo && place.logo.includes("\\")) {
        updates.logo = place.logo.replace(/\\/g, "/");
        needsUpdate = true;
      }

      if (place.coverImage && place.coverImage.includes("\\")) {
        updates.coverImage = place.coverImage.replace(/\\/g, "/");
        needsUpdate = true;
      }

      if (place.images) {
        const imagesArray = Array.isArray(place.images) ? place.images : [];
        const fixedImages = imagesArray.map((img: any) =>
          typeof img === "string" ? img.replace(/\\/g, "/") : img
        );
        if (JSON.stringify(fixedImages) !== JSON.stringify(imagesArray)) {
          updates.images = fixedImages;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.place.update({
          where: { id: place.id },
          data: updates,
        });
        placesFixed++;
        console.log(`✓ Place ${place.id} fixed`);
      }
    }

    console.log(`\n✅ ${placesFixed} places corrigées`);

    // Fix images in Event table
    const events = await prisma.event.findMany({
      select: {
        id: true,
        logo: true,
        images: true,
      },
    });

    let eventsFixed = 0;
    for (const event of events) {
      const updates: any = {};
      let needsUpdate = false;

      if (event.logo && event.logo.includes("\\")) {
        updates.logo = event.logo.replace(/\\/g, "/");
        needsUpdate = true;
      }

      if (event.images) {
        const imagesArray = Array.isArray(event.images) ? event.images : [];
        const fixedImages = imagesArray.map((img: any) =>
          typeof img === "string" ? img.replace(/\\/g, "/") : img
        );
        if (JSON.stringify(fixedImages) !== JSON.stringify(imagesArray)) {
          updates.images = fixedImages;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.event.update({
          where: { id: event.id },
          data: updates,
        });
        eventsFixed++;
        console.log(`✓ Event ${event.id} fixed`);
      }
    }

    console.log(`✅ ${eventsFixed} events corrigés`);

    // Fix images in Post table
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        coverImage: true,
      },
    });

    let postsFixed = 0;
    for (const post of posts) {
      if (post.coverImage && post.coverImage.includes("\\")) {
        await prisma.post.update({
          where: { id: post.id },
          data: { coverImage: post.coverImage.replace(/\\/g, "/") },
        });
        postsFixed++;
        console.log(`✓ Post ${post.id} fixed`);
      }
    }

    console.log(`✅ ${postsFixed} posts corrigés`);

    // Fix images in User table
    const users = await prisma.user.findMany({
      select: {
        id: true,
        image: true,
      },
    });

    let usersFixed = 0;
    for (const user of users) {
      if (user.image && user.image.includes("\\")) {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: user.image.replace(/\\/g, "/") },
        });
        usersFixed++;
        console.log(`✓ User ${user.id} fixed`);
      }
    }

    console.log(`✅ ${usersFixed} users corrigés`);

    console.log("\n🎉 Migration terminée !");
    console.log(`Total: ${placesFixed + eventsFixed + postsFixed + usersFixed} entrées corrigées`);

  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixImagePaths();
