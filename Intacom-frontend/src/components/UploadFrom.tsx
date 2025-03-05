import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../services/api';

const UploadForm: React.FC = () => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await uploadFile(formData);
      console.log('File uploaded:', response.data);
      alert(`File uploaded successfully: ${response.data}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="p-6 border-2 border-dashed border-gray-300 rounded text-center cursor-pointer hover:border-blue-500">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the file here...</p>
      ) : (
        <p>Drag 'n' drop a file here, or click to select a file</p>
      )}
    </div>
  );
};

export default UploadForm;