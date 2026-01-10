import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle, Camera, X, ArrowRight } from 'lucide-react';
import api from '../api/axios';

const STORAGE_KEY = 'uploadedFiles';

export default function Upload() {
  const [files, setFiles] = useState<any[]>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedFiles = JSON.parse(saved);
        return savedFiles.length > 0 && savedFiles.every((f: any) => f.status === 'success');
      } catch {
        return false;
      }
    }
    return false;
  });
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Save to localStorage whenever files change
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [files]);

  // Detect mobile device
  useState(() => {
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(checkMobile);
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    })));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10485760, // 10MB
  });

  const uploadFiles = async () => {
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      try {
        const formData = new FormData();
        formData.append('document', files[i].file);

        await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success' } : f
        ));
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' } : f
        ));
      }
    }

    setUploading(false);
    setUploadComplete(true);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (updated.length === 0) {
        setUploadComplete(false);
      }
      return updated;
    });
  };

  const clearAll = () => {
    setFiles([]);
    setUploadComplete(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capturedFiles = e.target.files;
    if (capturedFiles && capturedFiles.length > 0) {
      const fileArray = Array.from(capturedFiles).map(file => ({
        file,
        status: 'pending',
        progress: 0,
      }));
      setFiles(prev => [...prev, ...fileArray]);
    }
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Upload Bills</h1>

      {/* Mobile Camera Button */}
      {isMobile && (
        <div className="card bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex flex-col items-center text-center py-4">
            <Camera size={48} className="mb-3" />
            <h3 className="text-xl font-bold mb-2">📸 Take Photo Now</h3>
            <p className="text-sm opacity-90 mb-4">
              Use your phone's camera to capture bills instantly
            </p>
            <button
              onClick={openCamera}
              className="bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Open Camera
            </button>
          </div>
        </div>
      )}

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
        multiple
      />

      <div className="card">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          <input {...getInputProps()} />
          <UploadIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragActive ? 'Drop files here' : isMobile ? 'Tap to select files' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500">
            {isMobile 
              ? 'or use the camera button above (PDF, JPG, PNG up to 10MB)'
              : 'or click to select files (PDF, JPG, PNG up to 10MB)'
            }
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Selected Files:</h3>
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>
            {files.map((f, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <File className="text-gray-400" size={24} />
                  <div>
                    <p className="font-medium">{f.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(f.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {f.status === 'success' && <CheckCircle className="text-green-500" size={24} />}
                  {f.status === 'error' && <AlertCircle className="text-red-500" size={24} />}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Remove file"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={uploadFiles}
              disabled={uploading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        )}

        {/* Success message with link to Calculations */}
        {uploadComplete && files.every(f => f.status === 'success') && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg text-center">
            <CheckCircle className="mx-auto text-green-600 mb-3" size={64} />
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              ✅ Files Uploaded Successfully!
            </h3>
            <p className="text-lg text-gray-700 mb-4">
              AI is processing your bills now (10-30 seconds)
            </p>
            <p className="text-base text-gray-600 mb-6">
              Go to <strong>Calculations</strong> page to see your carbon emissions results
            </p>
            <a
              href="/calculations"
              className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors text-lg"
            >
              View Results
              <ArrowRight size={24} />
            </a>
          </div>
        )}
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">💡 Tips for best results:</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Upload clear, well-lit photos of your bills</li>
          <li>• Ensure all text is readable and not cut off</li>
          <li>• Supported: electricity, gas, fuel, and supply bills</li>
          <li>• AI will automatically extract and calculate emissions</li>
        </ul>
      </div>
    </div>
  );
}
