import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import axios from 'axios';
const Upload = ({ projects }) => {
    const [file, setFile] = useState(null);
    const [selectedProject, setSelectedProject] = useState('');
    const [uploadUrl, setUploadUrl] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [user] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };
    const handleUpload = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        if (!file) {
            setErrorMessage('Please select a file to upload');
            return;
        }
        if (!selectedProject) {
            setErrorMessage('Please select a project');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axios.post('http://localhost:3000/uploads', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadUrl(response.data.url);
            setSuccessMessage('File uploaded successfully!');
            setFile(null);
            setSelectedProject('');
            // Log the upload activity (mocked for now; in a real app, you'd send this to the backend)
            console.log(`User ${user?.username} uploaded file ${file.name} to project ${selectedProject}`);
        }
        catch (error) {
            console.error('Upload error:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.error || 'An error occurred during upload. Please ensure the backend server is running.');
        }
    };
    console.log('Rendering Upload page');
    return (_jsxs("div", { className: "upload-container", children: [_jsx("h2", { children: "Upload File" }), _jsx("p", { children: "Upload files to share with your project team." }), _jsxs("form", { onSubmit: handleUpload, className: "glassmorphic", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "projectSelect", children: "Select Project" }), _jsxs("select", { id: "projectSelect", value: selectedProject, onChange: (e) => setSelectedProject(e.target.value), required: true, children: [_jsx("option", { value: "", children: "Select a project" }), projects && projects.map((project) => (_jsx("option", { value: project._id, children: project.name }, project._id)))] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "fileUpload", children: "Select File" }), _jsx("input", { id: "fileUpload", type: "file", onChange: handleFileChange })] }), _jsx("button", { type: "submit", className: "neumorphic", children: "Upload" })] }), errorMessage && _jsx("div", { className: "error-message", children: errorMessage }), successMessage && (_jsx("div", { className: "success-message", children: successMessage })), uploadUrl && (_jsxs("div", { className: "upload-result", children: [_jsx("p", { children: "File uploaded successfully!" }), _jsx("a", { href: uploadUrl, target: "_blank", rel: "noopener noreferrer", children: "View File" })] }))] }));
};
export default Upload;
