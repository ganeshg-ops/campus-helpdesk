import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Search, Filter, PlusCircle, CheckCircle, FileText,
  Upload, Trash2, ExternalLink, ShieldCheck, Tag, AlertCircle,
  FileCheck, RefreshCw, AlertTriangle, Edit3, X, HelpCircle, Eye,
  FileUp
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function KnowledgePage() {
  const { isAdmin, isStaff } = useAuth();

  const [faqs, setFaqs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents'); // default to documents
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Admin upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Academics');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // View Document Modal
  const [viewModalDoc, setViewModalDoc] = useState(null);
  const [viewModalChunks, setViewModalChunks] = useState([]);
  const [viewModalLoading, setViewModalLoading] = useState(false);

  // Replace Document Modal
  const [replaceModalDoc, setReplaceModalDoc] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceTitle, setReplaceTitle] = useState('');
  const [replaceDescription, setReplaceDescription] = useState('');
  const [replacing, setReplacing] = useState(false);

  // Admin FAQ creation states
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('Academics');
  const [showFaqModal, setShowFaqModal] = useState(false);

  const categories = ['All', 'Academics', 'Certificates', 'Attendance', 'Examinations', 'Fees', 'Hostel', 'Office Timings', 'General'];

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const cat = selectedCategory === 'All' ? '' : selectedCategory;
      const [faqData, docData] = await Promise.all([
        api.getFaqs(cat, searchQuery).catch(() => []),
        api.getDocuments().catch(() => [])
      ]);
      setFaqs(faqData || []);
      setDocuments(docData || []);
    } catch (err) {
      console.error("Knowledge base loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    setUploadFile(file);
    setUploadMessage(null);

    // Auto-generate a clean, readable title from the filename if user hasn't typed one
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    const friendlyTitle = nameWithoutExt
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    if (!uploadTitle.trim()) {
      setUploadTitle(friendlyTitle);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (e) => {
    if (e) e.preventDefault();
    if (!uploadFile) {
      setUploadMessage({ type: 'error', text: 'Please select or drag a PDF file to upload.' });
      return;
    }

    // Auto-fallback title if left blank
    let finalTitle = uploadTitle.trim();
    if (!finalTitle) {
      finalTitle = uploadFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim() || "College Document";
    }

    try {
      setUploading(true);
      setUploadMessage(null);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', finalTitle);
      if (uploadDescription.trim()) formData.append('description', uploadDescription.trim());
      formData.append('category', uploadCategory);

      const uploadedDoc = await api.uploadDocument(formData);

      if (uploadedDoc.status === 'ocr_needed') {
        setUploadMessage({
          type: 'warning',
          text: `Document uploaded, but no extractable text was found. This scanned PDF requires OCR processing before it can be used for AI answers.`
        });
      } else {
        setUploadMessage({
          type: 'success',
          text: `Successfully processed '${uploadedDoc.title}' (${uploadedDoc.page_count} pages, ${uploadedDoc.chunk_count} searchable chunks created and indexed).`
        });
      }

      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadData();
    } catch (err) {
      setUploadMessage({ type: 'error', text: err.message || 'Upload and chunking failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId, title) => {
    if (window.confirm(`Are you sure you want to delete '${title}'? This will immediately remove it from the AI search index.`)) {
      try {
        await api.deleteDocument(docId);
        loadData();
      } catch (err) {
        alert("Failed to delete document: " + err.message);
      }
    }
  };

  const handleOpenView = async (doc) => {
    setViewModalDoc(doc);
    setViewModalLoading(true);
    try {
      const chunks = await api.getDocumentChunks(doc.id);
      setViewModalChunks(chunks || []);
    } catch (err) {
      console.error("Failed to load chunks:", err);
      setViewModalChunks([]);
    } finally {
      setViewModalLoading(false);
    }
  };

  const handleOpenReplace = (doc) => {
    setReplaceModalDoc(doc);
    setReplaceTitle(doc.title);
    setReplaceDescription(doc.description || '');
    setReplaceFile(null);
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!replaceFile || !replaceModalDoc) return;

    try {
      setReplacing(true);
      const formData = new FormData();
      formData.append('file', replaceFile);
      if (replaceTitle) formData.append('title', replaceTitle);
      if (replaceDescription) formData.append('description', replaceDescription);

      await api.replaceDocument(replaceModalDoc.id, formData);
      setReplaceModalDoc(null);
      loadData();
    } catch (err) {
      alert("Failed to replace document: " + err.message);
    } finally {
      setReplacing(false);
    }
  };

  const handleReprocessDocument = async (docId) => {
    try {
      await api.reprocessDocument(docId);
      loadData();
      alert("Document reprocessed and search index updated successfully!");
    } catch (err) {
      alert("Failed to reprocess: " + err.message);
    }
  };

  const handleCreateFaq = async (e) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;

    try {
      await api.createFaq({
        question: newFaqQuestion.trim(),
        answer: newFaqAnswer.trim(),
        category: newFaqCategory,
        is_approved: true
      });
      setShowFaqModal(false);
      setNewFaqQuestion('');
      setNewFaqAnswer('');
      loadData();
    } catch (err) {
      alert("Failed to create FAQ: " + err.message);
    }
  };

  const handleDeleteFaq = async (id) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        await api.deleteFaq(id);
        loadData();
      } catch (err) {
        alert("Failed to delete FAQ: " + err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Campus Knowledge Management & RAG
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Admin uploads official college rules, procedures, FAQs, and information as PDF documents. The AI uses these as its trusted knowledge source.
          </p>
        </div>

        {isAdmin && activeTab === 'faqs' && (
          <button
            onClick={() => setShowFaqModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Add Verified FAQ
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'documents'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          College PDF Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'faqs'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Approved FAQs ({faqs.length})
        </button>
      </div>

      {activeTab === 'documents' ? (
        /* PDF Knowledge Management */
        <div className="space-y-6">
          {/* Section: Upload College PDF */}
          {(isAdmin || isStaff) && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  Upload College PDF
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Upload official college regulations, handbooks, circulars, and procedure manuals. The backend extracts text page-by-page, generates searchable chunks, and indexes them into the RAG store.
                </p>
              </div>

              {uploadMessage && (
                <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  uploadMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : uploadMessage.type === 'warning'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {uploadMessage.type === 'success' ? (
                    <FileCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : uploadMessage.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <span className="leading-relaxed font-medium">{uploadMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-4">
                {/* Drag & Drop or Click Upload Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                    isDragging
                      ? 'border-purple-600 bg-purple-100/60 scale-[1.01]'
                      : uploadFile
                      ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50/80'
                      : 'border-slate-300 hover:border-purple-400 bg-slate-50/70 hover:bg-purple-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => handleFileSelected(e.target.files[0])}
                    className="hidden"
                  />

                  {uploadFile ? (
                    <div className="flex flex-wrap items-center justify-between w-full max-w-xl gap-3 py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-sm">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 truncate max-w-xs sm:max-w-md">
                              {uploadFile.name}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              Ready
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drop another PDF to change
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 shadow-sm">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        Click to select PDF or drag and drop file here
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Upload official college handbooks, regulations, or circulars (.pdf, max 25MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Document Details Grid */}
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Document Title <span className="text-slate-400 font-normal">(Auto-filled from file)</span>
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Student Handbook 2026"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none"
                    >
                      <option value="Academics">Academics</option>
                      <option value="Certificates">Certificates</option>
                      <option value="Attendance">Attendance</option>
                      <option value="Examinations">Examinations</option>
                      <option value="Fees">Fees</option>
                      <option value="Hostel">Hostel</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="e.g. Rules on condonation & exams"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    Max size: 25MB • Scanned image PDFs will automatically trigger OCR requirement notices.
                  </span>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Extracting & Indexing PDF...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Upload & Index Document
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Uploaded PDF List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Uploaded College PDF Documents ({documents.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Only successfully indexed and approved documents are searched by the student AI.
                </p>
              </div>
              <button
                onClick={loadData}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Refresh list"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
                Loading college documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No college documents uploaded yet. Use the Upload College PDF section above to ingest your first PDF.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                    <div className="flex items-start gap-3.5 max-w-2xl">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{doc.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {doc.category}
                          </span>
                        </div>
                        {doc.description && (
                          <div className="text-slate-500 text-[11px] mt-0.5">{doc.description}</div>
                        )}
                        <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
                          <span>File: {doc.filename}</span>
                          <span>•</span>
                          <span>Size: {(doc.file_size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>Pages: {doc.page_count || 1}</span>
                          <span>•</span>
                          <span>RAG Chunks: {doc.chunk_count}</span>
                        </div>

                        {doc.error_message && (
                          <div className="mt-2 text-[11px] text-amber-600 flex items-center gap-1.5 font-sans">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{doc.error_message}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        doc.status === 'indexed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : doc.status === 'ocr_needed'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {doc.status === 'indexed' ? 'INDEXED & LIVE' :
                         doc.status === 'ocr_needed' ? 'OCR NEEDED' : doc.status.toUpperCase()}
                      </span>

                      {/* Admin Controls */}
                      {(isAdmin || isStaff) && (
                        <div className="flex items-center gap-1.5">
                          {/* View Document Button */}
                          <button
                            onClick={() => handleOpenView(doc)}
                            className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
                            title="View Document passages & PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => handleOpenReplace(doc)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition shadow-sm"
                            title="Replace with updated PDF"
                          >
                            Replace
                          </button>
                          <button
                            onClick={() => handleReprocessDocument(doc.id)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm"
                            title="Reprocess document"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-sm"
                            title="Delete PDF and remove from index"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FAQs Tab */
        <div className="space-y-6">
          <div className="space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 bg-slate-900 rounded-2xl p-1.5 border border-slate-800 shadow-sm max-w-xl">
              <Search className="w-4 h-4 text-slate-400 ml-2.5 my-auto" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs by question or answer keyword..."
                className="w-full text-xs text-white placeholder-slate-500 bg-transparent focus:outline-none px-2"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`text-[11px] px-3 py-1.5 rounded-xl font-semibold transition ${
                    selectedCategory === c
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-center py-12 text-slate-400 text-xs animate-pulse">
                Loading approved FAQs...
              </div>
            ) : faqs.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
                No matching verified FAQs found.
              </div>
            ) : (
              faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800">
                        {faq.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm leading-snug">
                      {faq.question}
                    </h3>
                    <p className="text-slate-300 text-xs mt-2.5 leading-relaxed whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">Source: <strong className="text-slate-400">{faq.source_document}</strong></span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1 hover:text-rose-400 transition"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {viewModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col p-6 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                    {viewModalDoc.title}
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {viewModalDoc.filename} • {viewModalDoc.page_count || 1} pages • {viewModalDoc.chunk_count} chunks
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/knowledge/documents/${viewModalDoc.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition"
                  title="Open original file in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full PDF</span>
                </a>
                <button
                  onClick={() => setViewModalDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description & Details */}
            <div className="py-3 border-b border-slate-100 text-slate-600 space-y-1">
              <div className="font-semibold text-slate-700 text-[11px]">Official Description:</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {viewModalDoc.description || "Official college circular/handbook for student reference and AI semantic retrieval."}
              </p>
            </div>

            {/* Chunks / Extracted Pages Content */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center justify-between sticky top-0 bg-white py-1">
                <span>Extracted Document Passages & Pages ({viewModalChunks.length})</span>
                <span className="text-purple-600 font-mono font-semibold">Status: {viewModalDoc.status}</span>
              </div>

              {viewModalLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                  Loading extracted pages and passages...
                </div>
              ) : viewModalChunks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No extracted text found. Click "Open Full PDF" above to inspect the raw file.
                </div>
              ) : (
                viewModalChunks.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        Page {c.page_number}
                      </span>
                      <span className="text-slate-400 font-mono">
                        Chunk #{c.chunk_index + 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Verified knowledge base grounding source</span>
              <button
                onClick={() => setViewModalDoc(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Document Modal */}
      {replaceModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">
                Replace College Document
              </h3>
              <button onClick={() => setReplaceModalDoc(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-500 mb-4">
              Replacing <strong>{replaceModalDoc.title}</strong> will clear old chunks and immediately re-index the search store with the updated PDF.
            </p>

            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={replaceTitle}
                  onChange={(e) => setReplaceTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={replaceDescription}
                  onChange={(e) => setReplaceDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New PDF File (.pdf)</label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setReplaceFile(e.target.files[0])}
                  className="w-full text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplaceModalDoc(null)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replacing || !replaceFile}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md transition disabled:opacity-50"
                >
                  {replacing ? "Replacing & Re-indexing..." : "Confirm Replacement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-xs text-slate-800">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Verified Campus FAQ</h3>
            <p className="text-slate-500 mb-4">Official question and answer to be indexed for RAG answers.</p>

            <form onSubmit={handleCreateFaq} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question</label>
                <input
                  type="text"
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  placeholder="e.g. How do I apply for an NOC for internship?"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newFaqCategory}
                  onChange={(e) => setNewFaqCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none"
                >
                  <option value="Academics">Academics</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Examinations">Examinations</option>
                  <option value="Fees">Fees</option>
                  <option value="Hostel">Hostel</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verified Answer</label>
                <textarea
                  rows={4}
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  placeholder="Detail the exact procedure, office block, and required documents..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  Save & Publish FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
