import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../services/api';

interface UploadFormProps {
  onUpload: (url: string) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUpload }) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const file = acceptedFiles[0];
      const { url } = await uploadFile(file);
      onUpload(url);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
    </div>
  );
};

export default UploadForm;