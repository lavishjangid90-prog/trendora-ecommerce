import { useEffect } from 'react';

type PageMeta = {
  title: string;
  description: string;
};

export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');

    document.title = title;

    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [description, title]);
}
