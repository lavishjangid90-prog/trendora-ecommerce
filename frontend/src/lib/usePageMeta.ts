import { useEffect } from 'react';

type PageMeta = {
  title: string;
  description: string;
};

export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    document.title = title;

    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }

    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }

    if (twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }

    if (ogUrl) {
      ogUrl.setAttribute('content', window.location.href);
    }

    if (canonical) {
      canonical.href = window.location.href;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [description, title]);
}
