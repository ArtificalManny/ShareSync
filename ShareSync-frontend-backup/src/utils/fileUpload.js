// Map MIME types and file extensions to a normalized "kind"
// You can use this to choose icons, colors, or preview logic.

const EXT_KIND = {
    // images
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', heic: 'image',
    // video
    mp4: 'video', mov: 'video', webm: 'video', mkv: 'video', avi: 'video',
    // audio
    mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio', flac: 'audio',
    // docs
    pdf: 'pdf', doc: 'doc', docx: 'doc', txt: 'doc', md: 'doc', rtf: 'doc',
    xls: 'sheet', xlsx: 'sheet', csv: 'sheet',
    ppt: 'slides', pptx: 'slides', key: 'slides',
    // code
    js: 'code', ts: 'code', jsx: 'code', tsx: 'code', py: 'code', rb: 'code', java: 'code',
    c: 'code', cpp: 'code', cs: 'code', go: 'code', rs: 'code', php: 'code', html: 'code', css: 'code', json: 'code', yml: 'code', yaml: 'code',
    // archives
    zip: 'archive', gz: 'archive', gzip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive',
  };
  
  const MIME_KIND = [
    [/^image\//, 'image'],
    [/^video\//, 'video'],
    [/^audio\//, 'audio'],
    [/^application\/pdf$/, 'pdf'],
    [/^text\//, 'doc'],
    [/^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/, 'doc'],
    [/^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|csv)$/, 'sheet'],
    [/^application\/(vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)$/, 'slides'],
    [/^application\/(zip|x-7z-compressed|x-rar-compressed|x-tar|x-gzip)$/, 'archive'],
    [/^(application|text)\/(javascript|json|xml)$/, 'code'],
  ];
  
  /** Return a normalized kind: 'image'|'video'|'audio'|'pdf'|'doc'|'sheet'|'slides'|'code'|'archive'|'other' */
  export function kindFromMimeOrExt(mime = '', nameOrUrl = '') {
    const m = String(mime || '').toLowerCase();
    if (m) {
      const hit = MIME_KIND.find(([re]) => re.test(m));
      if (hit) return hit[1];
    }
    const ext = (nameOrUrl.split('.').pop() || '').toLowerCase();
    if (ext && EXT_KIND[ext]) return EXT_KIND[ext];
    return 'other';
  }
  
  /** Convenience icon map (lucide-react names) */
  const KIND_TO_LUCIDE = {
    image: 'Image',
    video: 'Video',
    audio: 'Music',
    pdf: 'FileText',
    doc: 'FileText',
    sheet: 'Table',
    slides: 'Presentation',
    code: 'Code2',
    archive: 'Archive',
    other: 'File',
  };
  
  /** Returns a lucide-react icon name for the given file */
  export function lucideIconForFile({ mime, name, url } = {}) {
    const kind = kindFromMimeOrExt(mime, name || url || '');
    return KIND_TO_LUCIDE[kind] || 'File';
  }
  
  export default { kindFromMimeOrExt, lucideIconForFile };
  