export function setMeta({ title, description, image }) {
    if (title) document.title = title;
    const ensure = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const ensureProp = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    if (description) ensure('description', description);
    if (title)       ensureProp('og:title', title);
    if (description) ensureProp('og:description', description);
    if (image)       ensureProp('og:image', image);
  }
  