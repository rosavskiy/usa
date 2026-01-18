import { useState, useEffect } from "react";
import {
  Trash2,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../api/axios";

export default function MyDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "readable" | "unreadable">(
    "all"
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    fileName: string | null;
  }>({ show: false, fileName: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [page, filter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const statusParam = filter === "all" ? "" : `&status=${filter}`;
      const response = await api.get(
        `/upload?page=${page}&limit=20${statusParam}`
      );
      setDocuments(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.fileName) return;

    try {
      setDeleting(true);
      // Delete all documents with this filename
      await api.delete(
        `/upload/by-filename/${encodeURIComponent(deleteModal.fileName)}`
      );
      setDeleteModal({ show: false, fileName: null });
      loadDocuments(); // Reload list
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      // Download file from backend
      const response = await api.get(`/upload/download/${doc.id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download:", error);
      alert("Failed to download file");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-success-200 bg-success-50 text-success-700">
            <CheckCircle size={14} strokeWidth={2} />
            <span className="text-xs font-medium">Readable</span>
          </div>
        );
      case "failed":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700">
            <AlertCircle size={14} strokeWidth={2} />
            <span className="text-xs font-medium">Unreadable</span>
          </div>
        );
      default:
        return <span className="text-xs text-gray-500 font-medium">Processing...</span>;
    }
  };

  if (loading && documents.length === 0) {
    return <div className="text-center py-12">Loading documents...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-gray-900">My Documents</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => {
            setFilter("all");
            setPage(1);
          }}
          className={`px-5 py-3 font-medium border-b-2 transition-colors ${
            filter === "all"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All Documents
        </button>
        <button
          onClick={() => {
            setFilter("readable");
            setPage(1);
          }}
          className={`px-5 py-3 font-medium border-b-2 transition-colors ${
            filter === "readable"
              ? "border-success-500 text-success-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Readable
        </button>
        <button
          onClick={() => {
            setFilter("unreadable");
            setPage(1);
          }}
          className={`px-5 py-3 font-medium border-b-2 transition-colors ${
            filter === "unreadable"
              ? "border-red-500 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Unreadable
        </button>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No documents found
          </h3>
          <p className="text-gray-500">Upload your first bill to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="card hover:shadow-lg transition-shadow"
            >
              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText
                    className="text-gray-400 flex-shrink-0 mt-1"
                    size={20}
                  />
                  <h3
                    className="font-medium text-sm break-all"
                    title={doc.file_name}
                  >
                    {doc.file_name}
                  </h3>
                </div>

                {getStatusBadge(doc.status)}

                <p className="text-xs text-gray-500">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 btn btn-sm bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-1"
                  >
                    <Download size={14} />
                    <span className="text-xs">Download</span>
                  </button>
                  <button
                    onClick={() =>
                      setDeleteModal({ show: true, fileName: doc.file_name })
                    }
                    className="flex-1 btn btn-sm bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                    <span className="text-xs">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-sm disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-sm disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              ⚠️ Delete Document?
            </h3>
            <p className="text-gray-700 mb-6">
              This action <strong>cannot be undone</strong>. The file will be
              permanently deleted from your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, fileName: null })}
                disabled={deleting}
                className="flex-1 btn bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
