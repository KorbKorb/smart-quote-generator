// frontend/src/components/FileUpload/FileUpload.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';

const FileUpload = ({ onFileUpload }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError('Please upload only DXF, DWG, or PDF files');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setError('');
    const newFiles = acceptedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      id: Date.now() + Math.random(),
      progress: 0,
      status: 'uploading'
    }));

    const allFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(allFiles);
    
    // Simulate upload progress
    newFiles.forEach((fileInfo, index) => {
      const timer = setInterval(() => {
        setUploadedFiles(prev => {
          const updated = [...prev];
          const fileIndex = updated.findIndex(f => f.id === fileInfo.id);
          if (fileIndex !== -1) {
            if (updated[fileIndex].progress < 100) {
              updated[fileIndex].progress += 10;
            } else {
              updated[fileIndex].status = 'complete';
              clearInterval(timer);
            }
          }
          return updated;
        });
      }, 100);
    });
    
    // Pass actual file objects to parent component
    if (onFileUpload) {
      onFileUpload(allFiles.map(f => f.file));
    }
  }, [uploadedFiles, onFileUpload]);

  const removeFile = (fileId) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    if (onFileUpload) {
      onFileUpload(updatedFiles.map(f => f.file));
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

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'dxf':
        return (
          <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'dwg':
        return (
          <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
            <rect x="8" y="13" width="8" height="6" />
          </svg>
        );
      case 'pdf':
        return (
          <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <path d="M9 15h6" />
          </svg>
        );
      default:
        return (
          <svg className="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        );
    }
  };

  return (
    <div className="file-upload-container">
      <div 
        {...getRootProps()} 
        className={`dropzone-modern ${isDragActive ? 'drag-active' : ''}`}
      >
        <input {...getInputProps()} />
        
        {/* Animated background pattern */}
        <div className="dropzone-pattern">
          <div className="pattern-grid"></div>
        </div>

        <div className="dropzone-content">
          <div className={`upload-icon-wrapper ${isDragActive ? 'bounce' : ''}`}>
            <svg className="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="upload-icon-bg"></div>
          </div>
          
          <h3 className="dropzone-title">
            {isDragActive 
              ? 'Drop your files here' 
              : 'Drag & drop CAD files'}
          </h3>
          
          <p className="dropzone-subtitle">
            or click to browse from your computer
          </p>
          
          <div className="supported-formats">
            <span className="format-badge">DXF</span>
            <span className="format-badge">DWG</span>
            <span className="format-badge">PDF</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-notification animate-slideUp">
          <svg className="error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-modern">
          <h4 className="files-header">
            <span>Uploaded Files</span>
            <span className="file-count">{uploadedFiles.length}</span>
          </h4>
          
          <div className="file-list-modern">
            {uploadedFiles.map(fileInfo => (
              <div 
                key={fileInfo.id} 
                className={`file-item-modern ${fileInfo.status === 'complete' ? 'complete' : ''}`}
              >
                <div className="file-icon-wrapper">
                  {getFileIcon(fileInfo.name)}
                  {fileInfo.status === 'complete' && (
                    <div className="success-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="file-details">
                  <div className="file-name">{fileInfo.name}</div>
                  <div className="file-meta">
                    <span className="file-size">{formatFileSize(fileInfo.size)}</span>
                    {fileInfo.status === 'uploading' && (
                      <span className="file-progress">{fileInfo.progress}%</span>
                    )}
                  </div>
                  {fileInfo.status === 'uploading' && (
                    <div className="progress-bar-wrapper">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${fileInfo.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <button 
                  className="remove-file-btn"
                  onClick={() => removeFile(fileInfo.id)}
                  type="button"
                  aria-label="Remove file"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" />
                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
