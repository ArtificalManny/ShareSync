import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import axios from 'axios';
const UploadPage = () => {
    const [file, setFile] = useState(null);
    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };
    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file)
            return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axios.post('http://localhost:3000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log('File uploaded:', response.data);
            alert('File uploaded successfully');
        }
        catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed');
        }
    };
    return (_jsxs("div", { style: { maxWidth: '500px', width: '100%', textAlign: 'center' }, children: [_jsx("h2", { children: "Upload File" }), _jsxs("form", { onSubmit: handleFileUpload, children: [_jsx("input", { type: "file", onChange: handleFileChange }), _jsx("button", { type: "submit", children: "Upload" })] })] }));
};
export default UploadPage;
