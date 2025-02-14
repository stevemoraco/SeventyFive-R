import { useEffect } from "react";
import { useLocation } from "wouter";

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

export function MetaTags({
  title = "SeventyFive - 75 Hard Challenge Tracker",
  description = "Transform your life with the 75 Hard Challenge. Track workouts, reading, water intake, and more with our comprehensive progress tracker.",
  image = "/icon.webp",
  type = "website"
}: MetaTagsProps) {
  const [location] = useLocation();

  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta tags
    const metaTags = {
      description: description,
      "og:title": title,
      "og:description": description,
      "og:image": image,
      "og:url": `https://seventyfive.app${location}`,
      "og:type": type,
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": image
    };

    // Update existing meta tags or create new ones
    Object.entries(metaTags).forEach(([name, content]) => {
      // Try to find existing tag
      let meta = document.querySelector(`meta[property="${name}"]`) ||
                 document.querySelector(`meta[name="${name}"]`);
      
      if (!meta) {
        // Create new meta tag if it doesn't exist
        meta = document.createElement('meta');
        if (name.startsWith('og:')) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      // Set content
      meta.setAttribute('content', content);
    });
  }, [title, description, image, type, location]);

  return null;
}
