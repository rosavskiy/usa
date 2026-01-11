import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  File,
  CheckCircle,
  AlertCircle,
  Camera,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import api from "../api/axios";

const STORAGE_KEY = "uploadedFiles";

export default function Upload() {
  const navigate = useNavigate();
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
  const [processing, setProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedFiles = JSON.parse(saved);
        return (
          savedFiles.length > 0 &&
          savedFiles.every((f: any) => f.status === "success")
        );
      } catch {
        return false;
      }
    }
    return false;
  });
  const [processingErrors, setProcessingErrors] = useState<
    { docId: number; error: string }[]
  >([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Clear localStorage on component mount to avoid NaN issues
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Save to localStorage whenever files change (only pending/processing files)
  useEffect(() => {
    const filesToSave = files.filter(f => f.status !== 'success');
    if (filesToSave.length > 0) {
      // Don't save File objects, just metadata
      const metadata = filesToSave.map(f => ({
        name: f.file?.name,
        size: f.file?.size,
        status: f.status,
        docId: f.docId,
        errorMsg: f.errorMsg,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [files]);

  // Detect mobile device
  useState(() => {
    const checkMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    setIsMobile(checkMobile);
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Add new files to existing ones (don't replace)
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => ({
        file,
        status: "pending",
        progress: 0,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10485760, // 10MB
  });

  const uploadFiles = async () => {
    setUploading(true);

    // Step 1: Upload files in parallel (not sequentially!)
    const filesToUpload = files
      .map((f, idx) => ({ file: f, index: idx }))
      .filter(({ file }) => file.status !== "success"); // Skip already processed

    const uploadPromises = filesToUpload.map(async ({ file, index }) => {
      try {
        const formData = new FormData();
        formData.append("document", file.file);

        const response = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const docId = response.data.data.id;

        // Mark as processing (show spinner, not checkmark yet)
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === index ? { ...f, status: "processing", docId } : f
          )
        );

        return { success: true, docId, index };
      } catch (error) {
        setFiles((prev) =>
          prev.map((f, idx) => (idx === index ? { ...f, status: "error" } : f))
        );
        return { success: false, docId: null, index };
      }
    });

    const results = await Promise.all(uploadPromises);
    const uploadedDocIds = results.filter(r => r.success && r.docId).map(r => r.docId as number);

    setUploading(false);

    // Step 2: Wait for AI processing & calculate emissions
    if (uploadedDocIds.length > 0) {
      setProcessing(true);
      setProcessingErrors([]);

      // Poll document status instead of fixed wait
      const checkInterval = 2000; // Check every 2 seconds
      const maxWaitTime = 30000; // Max 30 seconds
      let elapsedTime = 0;

      while (elapsedTime < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        elapsedTime += checkInterval;

        // Check if all documents are processed
        try {
          const responses = await Promise.all(
            uploadedDocIds.map(id => api.get(`/upload/${id}`))
          );
          
          const allProcessed = responses.every(r => 
            r.data.data.status === 'completed' || r.data.data.status === 'failed'
          );

          if (allProcessed) {
            console.log(`✅ All documents processed in ${elapsedTime / 1000}s`);
            break;
          }
        } catch (error) {
          console.error('Error checking document status:', error);
        }
      }

      // Calculate emissions for each document
      const errors: { docId: number; error: string }[] = [];
      let successCount = 0;

      for (let i = 0; i < uploadedDocIds.length; i++) {
        const docId = uploadedDocIds[i];
        try {
          await api.post("/carbon/calculate", { documentId: docId });
          successCount++;

          // Mark file as SUCCESS (green checkmark)
          setFiles((prev) =>
            prev.map((f) =>
              f.docId === docId ? { ...f, status: "success" } : f
            )
          );
        } catch (error: any) {
          const errorMsg =
            error.response?.data?.message || "Failed to process document";
          console.error(`Failed to calculate for doc ${docId}:`, errorMsg);
          errors.push({ docId, error: errorMsg });

          // Mark file as ERROR (red X)
          setFiles((prev) =>
            prev.map((f) =>
              f.docId === docId ? { ...f, status: "error", errorMsg } : f
            )
          );
        }
      }

      setProcessing(false);
      setUploadComplete(true);
      setProcessingErrors(errors);

      // Auto-scroll to error/success message
      setTimeout(() => {
        const errorMessage = document.querySelector("[data-error-message]");
        const successMessage = document.querySelector("[data-success-message]");
        const targetElement = errors.length > 0 ? errorMessage : successMessage;
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
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
      const fileArray = Array.from(capturedFiles).map((file) => ({
        file,
        status: "pending",
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...fileArray]);
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
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-primary-400"
          }`}
        >
          <input {...getInputProps()} />
          <UploadIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragActive
              ? "Drop files here"
              : isMobile
              ? "Tap to select files"
              : "Drag & drop files here"}
          </p>
          <p className="text-sm text-gray-500">
            {isMobile
              ? "or use the camera button above (PDF, JPG, PNG up to 10MB)"
              : "or click to select files (PDF, JPG, PNG up to 10MB)"}
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
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <File className="text-gray-400" size={24} />
                  <div>
                    <p className="font-medium">{f.file?.name || 'Unknown file'}</p>
                    <p className="text-sm text-gray-500">
                      {f.file?.size ? (f.file.size / 1024 / 1024).toFixed(2) : '0.00'} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {f.status === "processing" && (
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                  )}
                  {f.status === "success" && !f.errorMsg && (
                    <CheckCircle className="text-green-500" size={24} />
                  )}
                  {f.status === "error" && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="text-red-500" size={24} />
                      {f.errorMsg && (
                        <span
                          className="text-xs text-red-600 max-w-xs truncate"
                          title={f.errorMsg}
                        >
                          {f.errorMsg}
                        </span>
                      )}
                    </div>
                  )}
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
              disabled={uploading || processing || files.every(f => f.status === 'success')}
              className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading && (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Uploading files...
                </>
              )}
              {processing && (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  AI processing & calculating...
                </>
              )}
              {!uploading && !processing && files.every(f => f.status === 'success') && "All Files Processed ✓"}
              {!uploading && !processing && !files.every(f => f.status === 'success') && "Upload & Calculate"}
            </button>

            {/* Reprocess Failed button - only show if there are failed files */}
            {files.some(f => f.status === 'error') && !uploading && !processing && (
              <button
                onClick={() => {
                  // Remove failed files and re-upload them
                  const failedFiles = files.filter(f => f.status === 'error');
                  setFiles(failedFiles.map(f => ({ ...f, status: 'pending', docId: undefined, errorMsg: undefined })));
                  setUploadComplete(false);
                  setProcessingErrors([]);
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                🔄 Reprocess Failed Files Only
              </button>
            )}
          </div>
        )}

        {/* Success/Error message */}
        {uploadComplete && (
          <>
            {/* All failed */}
            {processingErrors.length === files.length && (
              <div
                data-error-message
                className="mt-6 p-8 bg-gradient-to-r from-red-50 to-orange-50 border-4 border-red-400 rounded-xl text-center shadow-xl"
              >
                <AlertCircle className="mx-auto text-red-600 mb-4" size={80} />
                <h3 className="text-3xl font-bold text-red-900 mb-3">
                  ❌ Documents Could Not Be Recognized
                </h3>
                <p className="text-xl text-gray-700 mb-3">
                  AI was unable to extract data from the uploaded images
                </p>
                <div className="mb-6 p-4 bg-red-100 border-2 border-red-300 rounded-lg text-left">
                  <p className="font-bold text-red-900 mb-2">Error details:</p>
                  {processingErrors.map((err, idx) => (
                    <p key={idx} className="text-red-700 text-sm mb-1">
                      • {err.error}
                    </p>
                  ))}
                </div>
                <p className="text-lg text-gray-600 mb-6">Please try:</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setFiles([]);
                      setUploadComplete(false);
                      setProcessingErrors([]);
                      localStorage.removeItem(STORAGE_KEY);
                    }}
                    className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-all text-lg"
                  >
                    📸 Upload Clearer Photo
                  </button>
                  <button
                    onClick={() => navigate("/manual-entry")}
                    className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-all text-lg"
                  >
                    ✍️ Enter Data Manually
                  </button>
                </div>
              </div>
            )}

            {/* Some succeeded */}
            {processingErrors.length > 0 &&
              processingErrors.length < files.length && (
                <div
                  data-error-message
                  className="mt-6 p-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-xl text-center shadow-xl"
                >
                  <AlertCircle
                    className="mx-auto text-yellow-600 mb-4"
                    size={80}
                  />
                  <h3 className="text-3xl font-bold text-yellow-900 mb-3">
                    ⚠️ Partial Success
                  </h3>
                  <p className="text-xl text-gray-700 mb-3">
                    {files.length - processingErrors.length} of {files.length}{" "}
                    files processed successfully
                  </p>
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-left">
                    <p className="font-bold text-red-900 mb-2">
                      Failed to recognize:
                    </p>
                    {processingErrors.map((err, idx) => (
                      <p key={idx} className="text-red-700 text-sm mb-1">
                        • {err.error}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => navigate("/calculations")}
                      className="inline-flex items-center gap-3 bg-green-600 text-white font-bold py-4 px-10 rounded-lg hover:bg-green-700 transition-all text-xl shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      View Successful Results
                      <ArrowRight size={28} />
                    </button>
                    <button
                      onClick={() => navigate("/manual-entry")}
                      className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-all text-lg"
                    >
                      ✍️ Enter Remaining Manually
                    </button>
                  </div>
                </div>
              )}

            {/* All succeeded */}
            {processingErrors.length === 0 && (
              <div
                data-success-message
                className="mt-6 p-8 bg-gradient-to-r from-green-50 to-blue-50 border-4 border-green-400 rounded-xl text-center shadow-xl animate-pulse"
              >
                <CheckCircle
                  className="mx-auto text-green-600 mb-4"
                  size={80}
                />
                <h3 className="text-3xl font-bold text-green-900 mb-3">
                  ✅ All Documents Recognized!
                </h3>
                <p className="text-xl text-gray-700 mb-3">
                  All bills successfully analyzed and emissions calculated
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  View detailed carbon footprint breakdown on the{" "}
                  <strong>Calculations</strong> page
                </p>
                <button
                  onClick={() => navigate("/calculations")}
                  className="inline-flex items-center gap-3 bg-green-600 text-white font-bold py-4 px-10 rounded-lg hover:bg-green-700 transition-all text-xl shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View Results
                  <ArrowRight size={28} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">
          💡 Tips for best results:
        </h3>
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
