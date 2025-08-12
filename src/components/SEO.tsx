import { useEffect } from "react";

type Props = {
  title: string;
  description?: string;
  canonicalPath?: string;
};

const SEO = ({ title, description, canonicalPath }: Props) => {
  useEffect(() => {
    document.title = title;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    const canonicalHref = `${window.location.origin}${canonicalPath ?? window.location.pathname}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalHref);
  }, [title, description, canonicalPath]);

  return null;
};

export default SEO;
