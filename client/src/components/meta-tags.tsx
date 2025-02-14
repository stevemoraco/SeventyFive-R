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
  const baseUrl = "https://seventyfive.app"; // Replace with your actual domain

  useEffect(() => {
    // Update title
    document.title = title;

    // Ensure image URL is absolute
    const absoluteImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;

    // Define all meta tags to be updated/created
    const metaTags = {
      // Basic meta tags
      "description": description,
      "theme-color": "hsl(220, 90%, 60%)",

      // Open Graph meta tags
      "og:title": title,
      "og:description": description,
      "og:image": absoluteImageUrl,
      "og:url": `${baseUrl}${location}`,
      "og:type": type,
      "og:site_name": "SeventyFive",

      // Twitter Card meta tags
      "twitter:card": "summary_large_image",
      "twitter:site": "@seventyfiveapp",
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": absoluteImageUrl,

      // Additional meta tags for better SEO
      "application-name": "SeventyFive",
      "apple-mobile-web-app-title": "SeventyFive",
      "msapplication-TileImage": absoluteImageUrl,
    };

    // Update or create meta tags
    Object.entries(metaTags).forEach(([name, content]) => {
      // Handle both property and name attributes
      const selectors = [
        `meta[property="${name}"]`,
        `meta[name="${name}"]`
      ];

      // Try to find existing tag
      let meta = selectors.map(selector => 
        document.querySelector(selector)
      ).find(Boolean);

      if (!meta) {
        // Create new meta tag if it doesn't exist
        meta = document.createElement('meta');
        // Set appropriate attribute (property for OG tags, name for others)
        const attr = name.startsWith('og:') ? 'property' : 'name';
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }

      // Update content
      meta.setAttribute('content', content);
    });

    // Cleanup function to remove dynamically added meta tags on unmount
    return () => {
      Object.keys(metaTags).forEach(name => {
        const selectors = [
          `meta[property="${name}"]`,
          `meta[name="${name}"]`
        ];
        selectors.forEach(selector => {
          const meta = document.querySelector(selector);
          if (meta && meta.parentNode === document.head) {
            document.head.removeChild(meta);
          }
        });
      });
    };
  }, [title, description, image, type, location, baseUrl]);

  return null;
}