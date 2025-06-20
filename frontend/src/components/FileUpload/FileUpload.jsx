// frontend/src/components/FileUpload/FileUpload.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ onFileUpload }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError('Please upload only DXF, DWG, or PDF files');
      return;
    }

    setError('');
    const newFiles = acceptedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      id: Date.now() + Math.random()
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Pass files to parent component
    if (onFileUpload) {
      onFileUpload([...uploadedFiles, ...newFiles]);
    }
  }, [uploadedFiles, onFileUpload]);

  const removeFile = (fileId) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    if (onFileUpload) {
      onFileUpload(updatedFiles);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/acad': ['.dwg'],
      'application/dxf': ['.dxf']
    },
    multiple: true
  });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="file-upload-container">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <svg className="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="dropzone-text">
            {isDragActive 
              ? 'Drop the files here...' 
              : 'Drag & drop CAD files here, or click to select'}
          </p>
          <p className="dropzone-hint">Supported formats: DXF, DWG, PDF</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Files:</h4>
          <ul className="file-list">
            {uploadedFiles.map(fileInfo => (
              <li key={fileInfo.id} className="file-item">
                <div className="file-info">
                  <span className="file-name">{fileInfo.name}</span>
                  <span className="file-size">{formatFileSize(fileInfo.size)}</span>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={() => removeFile(fileInfo.id)}
                  type="button"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
