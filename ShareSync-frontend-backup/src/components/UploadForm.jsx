import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const UploadForm = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      fetch(`${import.meta.env.VITE_API_URL}/api/uploads`, {
        method: 'POST',
        body: formData,
      })
        .then(res => res.json())
        .then(data => onUpload(data.url))
        .catch(err => console.error('Upload error:', err));
    }
  }, [onUpload]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} style={{ border: '2px dashed #e94560', padding: '20px', textAlign: 'center', color: 'white' }}>
      <input {...getInputProps()} />
      <p>Drag 'n' drop a file here, or click to select a file</p>
    </div>
  );
};

export default UploadForm;