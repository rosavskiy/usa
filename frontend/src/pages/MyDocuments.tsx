import { useState, useEffect } from "react";
import { Trash2, Download, FileText, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";

export default function MyDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "readable" | "unreadable">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; docId: number | null }>({ show: false, docId: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [page, filter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const statusParam = filter === "all" ? "" : `&status=${filter}`;
      const response = await api.get(`/upload?page=${page}&limit=20${statusParam}`);
      setDocuments(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.docId) return;

    try {
      setDeleting(true);
      await api.delete(`/upload/${deleteModal.docId}`);
      setDeleteModal({ show: false, docId: null });
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
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Readable</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Unreadable</span>
          </div>
        );
      default:
        return <span className="text-sm text-gray-500">Processing...</span>;
    }
  };

  if (loading && documents.length === 0) {
    return <div className="text-center py-12">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => { setFilter("all"); setPage(1); }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === "all"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All Documents
        </button>
        <button
          onClick={() => { setFilter("readable"); setPage(1); }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === "readable"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Readable
        </button>
        <button
          onClick={() => { setFilter("unreadable"); setPage(1); }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
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
          <p className="text-gray-500">
            Upload your first bill to see it here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="card hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                {doc.file_path !== 'manual' ? (
                  <img
                    src={`http://localhost:5000/${doc.file_path}`}
                    alt={doc.file_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="text-gray-400" size={48} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm truncate" title={doc.file_name}>
                  {doc.file_name}
                </h3>
                
                {getStatusBadge(doc.status)}

                <p className="text-xs text-gray-500">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {doc.file_path !== 'manual' && (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 btn btn-sm bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-1"
                    >
                      <Download size={14} />
                      <span className="text-xs">Download</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteModal({ show: true, docId: doc.id })}
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
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
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
              This action <strong>cannot be undone</strong>. The file will be permanently deleted from your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, docId: null })}
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
