import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../services/api';
const UploadForm = () => {
    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await uploadFile(formData);
            console.log('File uploaded:', response.data);
            alert(`File uploaded successfully: ${response.data}`);
        }
        catch (error) {
            console.error('Upload error:', error);
            alert('File upload failed');
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
    return (_jsxs("div", { ...getRootProps(), className: "p-6 border-2 border-dashed border-gray-300 rounded text-center cursor-pointer hover:border-blue-500", children: [_jsx("input", { ...getInputProps() }), isDragActive ? (_jsx("p", { children: "Drop the file here..." })) : (_jsx("p", { children: "Drag 'n' drop a file here, or click to select a file" }))] }));
};
export default UploadForm;
