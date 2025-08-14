interface PostSchemaProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null;
    metaDescription?: string | null;
    coverImage?: string | null;
    ogImage?: string | null;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date | null;
    viewCount?: number | null;
    author: {
      name: string;
      slug?: string | null;
    };
    category?: {
      name: string;
    } | null;
    tags?: Array<{
      tag: {
        name: string;
      };
    }>;
  };
}

export function PostSchema({ post }: PostSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const postUrl = `${baseUrl}/posts/${post.slug}`;

  const imageUrl = post.ogImage || post.coverImage;
  const absoluteImageUrl = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${baseUrl}${imageUrl}`
    : `${baseUrl}/images/og-post-default.jpg`;

  const publishedDate = post.publishedAt || post.createdAt;
  const modifiedDate = post.updatedAt;

  // Créer le schéma JSON-LD pour l'article
  const jsonLd: {
    "@context": string;
    "@type": string;
    "@id": string;
    url: string;
    headline: string;
    name: string;
    description: string;
    abstract: string | null | undefined;
    articleBody: string | null | undefined;
    datePublished: string;
    dateModified: string;
    author: {
      "@type": string;
      name: string;
      url?: string;
    };
    publisher: {
      "@type": string;
      name: string;
      url: string;
      logo: {
        "@type": string;
        url: string;
        width: number;
        height: number;
      };
    };
    image: {
      "@type": string;
      url: string;
      width: number;
      height: number;
      caption: string;
    };
    mainEntityOfPage: {
      "@type": string;
      "@id": string;
    };
    isPartOf: {
      "@type": string;
      name: string;
      url: string;
    };
    inLanguage: string;
    genre?: string;
    keywords?: string;
    articleSection?: string;
    wordCount?: number;
    timeRequired?: string;
    interactionStatistic: {
      "@type": string;
      interactionType: string;
      userInteractionCount: number;
    };
    about?: Array<{
      "@type": string;
      name: string;
    }>;
  } = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": postUrl,
    url: postUrl,
    headline: post.title,
    name: post.title,
    description:
      post.metaDescription ||
      post.excerpt ||
      `Article publié sur ABC Bédarieux`,
    abstract: post.excerpt,
    articleBody: post.content,
    datePublished: publishedDate.toISOString(),
    dateModified: modifiedDate.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name,
      url: post.author.slug
        ? `${baseUrl}/profil/${post.author.slug}`
        : undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "ABC Bédarieux",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/logo.png`,
        width: 200,
        height: 60,
      },
    },
    image: {
      "@type": "ImageObject",
      url: absoluteImageUrl,
      width: 1200,
      height: 630,
      caption: post.title,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    isPartOf: {
      "@type": "Blog",
      name: "Blog ABC Bédarieux",
      url: `${baseUrl}/articles`,
    },
    inLanguage: "fr-FR",
    genre: post.category?.name,
    keywords: post.tags?.map((pt) => pt.tag.name).join(", "),
    articleSection: post.category?.name,
    wordCount: post.content
      ? post.content.replace(/<[^>]*>/g, "").split(/\s+/).length
      : undefined,
    timeRequired: post.content
      ? `PT${Math.max(
          1,
          Math.round(
            post.content.replace(/<[^>]*>/g, "").split(/\s+/).length / 200
          )
        )}M`
      : undefined,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ReadAction",
      userInteractionCount: post.viewCount || 0,
    },
  };

  // Ajouter les tags si présents
  if (post.tags && post.tags.length > 0) {
    jsonLd["about"] = post.tags.map((pt) => ({
      "@type": "Thing",
      name: pt.tag.name,
    }));
  }

  // Ajouter la catégorie si présente
  if (post.category) {
    jsonLd["genre"] = post.category.name;
    jsonLd["articleSection"] = post.category.name;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd, null, 2),
      }}
    />
  );
}
