import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload, Download, Trash2, FileText, Search, HardDrive, FileImage,
  FileCode, Archive, ShieldCheck, Check, AlertCircle, Eye, X,
  LayoutGrid, List, ArrowUpDown, Filter, Copy, FileCheck, RefreshCw
} from 'lucide-react';
import { VaultFile } from '../types';
import { apiService } from '../services/api';

type SortOption = 'newest' | 'oldest' | 'name' | 'size_desc' | 'size_asc';
type CategoryFilter = 'all' | 'image' | 'document' | 'code' | 'archive' | 'other';
type ViewMode = 'grid' | 'table';

export const FileManagerSection: React.FC = () => {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Preview Modal state
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [previewData, setPreviewData] = useState<{ url?: string; text?: string; type: 'image' | 'text' | 'pdf' | 'other' } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Status messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getFiles();
      setFiles(res);
      setSelectedIds([]);
    } catch (err) {
      setError('Failed to load encrypted files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Upload handler
  const handleUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      await apiService.uploadFile(file);
      setSuccess(`"${file.name}" encrypted and stored successfully!`);
      setTimeout(() => setSuccess(null), 3500);
      await loadFiles();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleUpload(droppedFile);
    }
  };

  // Download handler
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const blob = await apiService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download decrypted file');
    }
  };

  // Delete handler
  const handleDelete = async (fileId: string, fileName: string) => {
    if (window.confirm(`Delete "${fileName}" permanently?`)) {
      try {
        await apiService.deleteFile(fileId);
        await loadFiles();
      } catch (err) {
        setError('Failed to delete file');
      }
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Permanently delete ${selectedIds.length} selected files?`)) {
      try {
        setIsLoading(true);
        await Promise.all(selectedIds.map((id) => apiService.deleteFile(id)));
        setSuccess(`Successfully deleted ${selectedIds.length} files.`);
        setTimeout(() => setSuccess(null), 3000);
        await loadFiles();
      } catch (err) {
        setError('Failed to delete some files');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Preview Handler
  const handleOpenPreview = async (file: VaultFile) => {
    setPreviewFile(file);
    setIsPreviewLoading(true);
    setPreviewData(null);
    setCopiedText(false);

    try {
      const blob = await apiService.downloadFile(file.id);
      const ext = file.original_name.split('.').pop()?.toLowerCase() || '';
      const mime = file.mime_type.toLowerCase();

      if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
        const objectUrl = URL.createObjectURL(blob);
        setPreviewData({ url: objectUrl, type: 'image' });
      } else if (
        mime.startsWith('text/') ||
        mime.includes('json') ||
        ['txt', 'json', 'md', 'py', 'js', 'ts', 'html', 'css', 'rs', 'go', 'csv', 'yaml', 'yml', 'xml', 'sh'].includes(ext)
      ) {
        const text = await blob.text();
        setPreviewData({ text, type: 'text' });
      } else if (mime === 'application/pdf' || ext === 'pdf') {
        const objectUrl = URL.createObjectURL(blob);
        setPreviewData({ url: objectUrl, type: 'pdf' });
      } else {
        setPreviewData({ type: 'other' });
      }
    } catch (err) {
      setError('Failed to load file preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewData?.url) {
      URL.revokeObjectURL(previewData.url);
    }
    setPreviewFile(null);
    setPreviewData(null);
  };

  const handleCopyText = () => {
    if (previewData?.text) {
      navigator.clipboard.writeText(previewData.text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Helper file categorizer
  const getFileCategory = (filename: string, mime: string): 'image' | 'document' | 'code' | 'archive' | 'other' => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return 'archive';
    if (['js', 'ts', 'py', 'json', 'html', 'css', 'rs', 'go', 'c', 'cpp', 'sh', 'sql'].includes(ext)) return 'code';
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'csv', 'xls', 'xlsx'].includes(ext)) return 'document';
    return 'other';
  };

  const getFileIcon = (filename: string, mime: string) => {
    const cat = getFileCategory(filename, mime);
    switch (cat) {
      case 'image':
        return <FileImage className="w-8 h-8 text-emerald-500" />;
      case 'archive':
        return <Archive className="w-8 h-8 text-amber-500" />;
      case 'code':
        return <FileCode className="w-8 h-8 text-blue-500" />;
      case 'document':
        return <FileText className="w-8 h-8 text-teal-600" />;
      default:
        return <FileText className="w-8 h-8 text-slate-400" />;
    }
  };

  // Storage Stats
  const storageStats = useMemo(() => {
    const totalBytes = files.reduce((acc, f) => acc + f.file_size, 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
    const categoryCounts = {
      image: 0,
      document: 0,
      code: 0,
      archive: 0,
      other: 0,
    };
    files.forEach((f) => {
      const cat = getFileCategory(f.original_name, f.mime_type);
      categoryCounts[cat]++;
    });
    return { totalBytes, totalMb, categoryCounts };
  }, [files]);

  // Filtered & Sorted Files
  const processedFiles = useMemo(() => {
    let list = files.filter((f) =>
      f.original_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedCategory !== 'all') {
      list = list.filter((f) => getFileCategory(f.original_name, f.mime_type) === selectedCategory);
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') return a.original_name.localeCompare(b.original_name);
      if (sortBy === 'size_desc') return b.file_size - a.file_size;
      if (sortBy === 'size_asc') return a.file_size - b.file_size;
      return 0;
    });

    return list;
  }, [files, searchQuery, selectedCategory, sortBy]);

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === processedFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedFiles.map((f) => f.id));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-extrabold text-white">Bit Vault File Storage</h2>
          </div>
          <p className="text-slate-400 text-sm max-w-xl font-medium">
            Zero-knowledge AES-256-GCM encrypted file storage. Store confidential documents, backup keys, and binary files securely.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={loadFiles}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh Files"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <label className="flex-1 lg:flex-none bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50">
            <Upload className={`w-4 h-4 ${uploading ? 'animate-bounce' : ''}`} />
            <span>{uploading ? 'Encrypting & Storing...' : 'Upload File'}</span>
            <input type="file" onChange={handleFileInputChange} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Storage Analytics Card */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="md:col-span-2 space-y-2.5 md:border-r border-slate-800 md:pr-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span>Storage Capacity</span>
            <span className="text-emerald-400 font-mono font-extrabold">{storageStats.totalMb} MB Used</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full shadow-sm shadow-emerald-500/50"
              style={{ width: `${Math.min(100, (storageStats.totalBytes / (50 * 1024 * 1024)) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {files.length} total encrypted file{files.length !== 1 ? 's' : ''} stored under AES-256 vault.
          </p>
        </div>

        <div className="md:col-span-2 grid grid-cols-4 gap-2.5 text-center">
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-sm font-extrabold text-emerald-400 font-mono block">{storageStats.categoryCounts.image}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Images</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-sm font-extrabold text-teal-400 font-mono block">{storageStats.categoryCounts.document}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Docs</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-sm font-extrabold text-blue-400 font-mono block">{storageStats.categoryCounts.code}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Code</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-sm font-extrabold text-amber-400 font-mono block">{storageStats.categoryCounts.archive}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Archives</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl flex items-center justify-between text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 font-bold">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all shadow-xl backdrop-blur-xl ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/60'
        }`}
      >
        <HardDrive className={`w-10 h-10 mx-auto mb-3 transition ${isDragging ? 'text-emerald-400 animate-bounce' : 'text-slate-500'}`} />
        <h3 className="font-extrabold text-white text-base">Drag & Drop files here to encrypt instantly</h3>
        <p className="text-xs text-slate-400 mt-1 font-medium">Supports any file format (PDF, images, zip, code, binary keys)</p>
      </div>

      {/* Search, Filter Tabs & Controls */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Files', count: files.length },
            { id: 'image', label: '📷 Images', count: storageStats.categoryCounts.image },
            { id: 'document', label: '📄 Documents', count: storageStats.categoryCounts.document },
            { id: 'code', label: '💻 Code', count: storageStats.categoryCounts.code },
            { id: 'archive', label: '📦 Archives', count: storageStats.categoryCounts.archive },
            { id: 'other', label: '📁 Others', count: storageStats.categoryCounts.other },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${selectedCategory === tab.id ? 'bg-slate-950/20 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar: Search, Sort & View Mode */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 border border-slate-800/80 rounded-2xl shadow-xl">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file by name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-medium text-white placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Multi-select Actions */}
            {processedFiles.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700"
              >
                {selectedIds.length === processedFiles.length ? 'Deselect All' : 'Select All'}
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedIds.length})</span>
              </button>
            )}

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none text-xs"
              >
                <option value="newest" className="bg-slate-900 text-white">Newest First</option>
                <option value="oldest" className="bg-slate-900 text-white">Oldest First</option>
                <option value="name" className="bg-slate-900 text-white">Name (A-Z)</option>
                <option value="size_desc" className="bg-slate-900 text-white">Size (Largest)</option>
                <option value="size_asc" className="bg-slate-900 text-white">Size (Smallest)</option>
              </select>
            </div>

            {/* Grid / Table Toggle */}
            <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Files Display */}
      {isLoading ? (
        <div className="text-center py-16 space-y-3">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-400 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Decrypting encrypted files...</p>
        </div>
      ) : processedFiles.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-16 text-center shadow-xl max-w-xl mx-auto space-y-3">
          <FileText className="w-14 h-14 text-slate-600 mx-auto" />
          <h3 className="font-extrabold text-white text-xl">No encrypted files found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto font-medium">
            {searchQuery || selectedCategory !== 'all'
              ? 'No files match your active search or category filters.'
              : 'Drag & drop or upload files to store them securely in your vault.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedFiles.map((file) => {
            const isSelected = selectedIds.includes(file.id);
            return (
              <div
                key={file.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all group relative flex flex-col justify-between ${
                  isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/20 bg-emerald-500/5' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(file.id)}
                        className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-emerald-500/30 transition">
                        {getFileIcon(file.original_name, file.mime_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className="font-extrabold text-white text-sm truncate group-hover:text-emerald-400 transition cursor-pointer"
                          onClick={() => handleOpenPreview(file)}
                          title={file.original_name}
                        >
                          {file.original_name}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono font-medium block mt-0.5">
                          {(file.file_size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-800/80 mt-3">
                  <button
                    onClick={() => handleOpenPreview(file)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700"
                    title="Preview File"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    Preview
                  </button>

                  <button
                    onClick={() => handleDownload(file.id, file.original_name)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Decrypt & Download
                  </button>

                  <button
                    onClick={() => handleDelete(file.id, file.original_name)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Delete File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === processedFiles.length && processedFiles.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">File Name</th>
                <th className="p-3.5">Size</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Uploaded</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedFiles.map((file) => {
                const isSelected = selectedIds.includes(file.id);
                return (
                  <tr key={file.id} className={`hover:bg-slate-50 transition ${isSelected ? 'bg-emerald-50/20' : ''}`}>
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(file.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(file.original_name, file.mime_type)}
                        <span
                          className="hover:text-emerald-600 cursor-pointer font-semibold text-sm truncate max-w-xs"
                          onClick={() => handleOpenPreview(file)}
                        >
                          {file.original_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{(file.file_size / 1024).toFixed(1)} KB</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px] truncate max-w-[120px]">{file.mime_type}</td>
                    <td className="p-3.5 text-slate-500">{new Date(file.created_at).toLocaleDateString()}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPreview(file)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Preview File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(file.id, file.original_name)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition text-xs inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(file.id, file.original_name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-800">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-base truncate">{previewFile.original_name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {(previewFile.file_size / 1024).toFixed(1)} KB • Decrypted in Memory
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewData?.type === 'text' && (
                  <button
                    onClick={handleCopyText}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl transition flex items-center gap-1 text-xs"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText ? 'Copied!' : 'Copy Text'}
                  </button>
                )}
                <button
                  onClick={() => handleDownload(previewFile.id, previewFile.original_name)}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 text-xs shadow-md shadow-emerald-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button onClick={handleClosePreview} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-950/60 min-h-[300px]">
              {isPreviewLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-400 border-t-transparent"></div>
                  <p className="text-xs text-slate-400 mt-3 font-medium">Decrypting file in memory...</p>
                </div>
              ) : previewData?.type === 'image' && previewData.url ? (
                <div className="text-center">
                  <img
                    src={previewData.url}
                    alt={previewFile.original_name}
                    className="max-h-[65vh] max-w-full rounded-xl shadow-2xl mx-auto object-contain border border-slate-800"
                  />
                </div>
              ) : previewData?.type === 'text' && previewData.text !== undefined ? (
                <pre className="w-full text-left font-mono text-xs text-emerald-300 bg-slate-900 border border-slate-800 p-5 rounded-xl overflow-x-auto max-h-[65vh] whitespace-pre-wrap leading-relaxed">
                  {previewData.text}
                </pre>
              ) : previewData?.type === 'pdf' && previewData.url ? (
                <iframe
                  src={previewData.url}
                  title="PDF Preview"
                  className="w-full h-[65vh] rounded-xl border border-slate-800 bg-white"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-300 text-lg">No direct browser preview for this file type</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Click "Download" above to save the decrypted file directly to your computer.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
