import { useState, useEffect } from "react";
import { Trash2, Download, FileText, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";

export default function MyDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "readable" | "unreadable">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; docId: number | null }>({ show: false, docId: null });
  const [deleting, setDeleting] = useState(false);
  const [deleteAllModal, setDeleteAllModal] = useState(false);

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
      setTotalDocs(response.data.pagination.total);
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

  const handleDeleteAll = async () => {
    try {
      setDeleting(true);
      
      // Get ALL documents with current filter (not just current page)
      const statusParam = filter === "all" ? "" : `&status=${filter}`;
      const response = await api.get(`/upload?page=1&limit=1000${statusParam}`);
      const allDocs = response.data.data;
      
      if (allDocs.length === 0) {
        setDeleteAllModal(false);
        return;
      }
      
      // Delete all documents
      await Promise.all(allDocs.map((doc: any) => api.delete(`/upload/${doc.id}`)));
      
      setDeleteAllModal(false);
      setPage(1); // Reset to first page
      loadDocuments(); // Reload list
    } catch (error) {
      console.error("Failed to delete all documents:", error);
      alert("Failed to delete all documents. Please try again.");
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
        {totalDocs > 0 && (
          <button
            onClick={() => setDeleteAllModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete All ({totalDocs})
          </button>
        )}
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
              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                  <h3 className="font-medium text-sm break-all" title={doc.file_name}>
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

      {/* Delete All Confirmation Modal */}
      {deleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-3">
              ⚠️ Delete All {totalDocs} Documents?
            </h3>
            <p className="text-gray-700 mb-6">
              <strong>WARNING:</strong> This will permanently delete ALL {totalDocs} documents {filter !== 'all' && `(${filter})`} and their files. 
              <br/><br/>
              <strong>This action CANNOT be undone!</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAllModal(false)}
                disabled={deleting}
                className="flex-1 btn bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 font-bold"
              >
                {deleting ? "Deleting..." : "Delete All Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
