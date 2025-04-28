import React, { useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { AuthContext } from '../context/AuthContext';
import { uploadFile } from '../services/api';
import { toast } from 'react-toastify';

const UploadForm = ({ projectId, onUploadSuccess }) => {
  const { user } = useContext(AuthContext);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await uploadFile(projectId, formData, user.token);
      toast.success('File uploaded successfully!', { position: 'top-right', autoClose: 3000 });
      if (onUploadSuccess) onUploadSuccess(response.data);
    } catch (error) {
      console.error('UploadForm - Error uploading file:', error);
      toast.error('Failed to upload file', { position: 'top-right', autoClose: 3000 });
    }
  }, [projectId, user.token, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} style={{
      border: '2px dashed #00d1b2',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#1a2b3c',
      borderRadius: '10px',
      cursor: 'pointer',
      marginBottom: '20px',
    }}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p style={{ color: '#00d1b2' }}>Drop the files here...</p>
      ) : (
        <p style={{ color: '#00d1b2' }}>Drag & drop files here, or click to select files</p>
      )}
    </div>
  );
};

export default UploadForm;