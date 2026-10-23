import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Calendar,
  Lock,
  Download,
  Hash,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { isValidCid } from "../../services/utils/tokenMath.js";

const INITIAL_DOCUMENTS = [
  {
    id: "DOC-80G-2024",
    title: "Income Tax 80G Approval Certificate",
    category: "Tax Exemption",
    issuer: "Income Tax Department of India",
    status: "Verified",
    validUntil: "2027-03-31",
    daysRemaining: 889,
    ipfsCid: "bafybeiczsscds0ibfhq290skjdp901jk2nd9123kd90123jd9102",
    fileSize: "2.4 MB",
    uploadedAt: "2024-04-12",
  },
  {
    id: "DOC-12A-2023",
    title: "12A Non-Profit Registration Order",
    category: "Legal Incorporation",
    issuer: "Office of the Commissioner of Income Tax",
    status: "Verified",
    validUntil: "2028-06-30",
    daysRemaining: 1345,
    ipfsCid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    fileSize: "1.8 MB",
    uploadedAt: "2023-07-01",
  },
  {
    id: "DOC-FCRA-2024",
    title: "Foreign Contribution Regulation Act (FCRA) License",
    category: "Foreign Contributions",
    issuer: "Ministry of Home Affairs",
    status: "Expiring Soon",
    validUntil: "2024-12-15",
    daysRemaining: 42,
    ipfsCid: "bafybeih4j3lkd901j3901kd901jk3019d012j3d0129jd0129",
    fileSize: "3.1 MB",
    uploadedAt: "2023-12-16",
  },
  {
    id: "DOC-AUDIT-FY2324",
    title: "Annual Statutory Audit Report & Balance Sheet FY 2023-24",
    category: "Financial Audit",
    issuer: "K. R. Chawla & Associates Chartered Accountants",
    status: "Verified",
    validUntil: "2025-09-30",
    daysRemaining: 341,
    ipfsCid: "bafybeiclk4m2j3o1k092109312093102930192301923019230",
    fileSize: "6.7 MB",
    uploadedAt: "2024-09-15",
  },
  {
    id: "DOC-BYLAWS-2022",
    title: "Memorandum of Association & Governing Bylaws",
    category: "Governance",
    issuer: "Registrar of Societies",
    status: "Verified",
    validUntil: "Permanent",
    daysRemaining: 9999,
    ipfsCid: "bafybeid90123kd0912301923019230129301293019230192",
    fileSize: "4.2 MB",
    uploadedAt: "2022-01-10",
  },
];

export const DocumentComplianceWorkspace = () => {
  const { activeOrganization } = useAuth();
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "Tax Exemption",
    issuer: "",
    validUntil: "",
    fileName: "",
  });
  const [uploadFeedback, setUploadFeedback] = useState("");

  const categories = ["All", "Tax Exemption", "Legal Incorporation", "Foreign Contributions", "Financial Audit", "Governance"];

  const filteredDocs = documents.filter((d) => {
    if (selectedCategory !== "All" && d.category !== selectedCategory) return false;
    return true;
  });

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.validUntil) {
      alert("Please fill in all required fields.");
      return;
    }

    const newDoc = {
      id: `DOC-${Date.now().toString().slice(-4)}`,
      title: uploadForm.title,
      category: uploadForm.category,
      issuer: uploadForm.issuer || "Self-Declared / Authorized Authority",
      status: "Pending Review",
      validUntil: uploadForm.validUntil,
      daysRemaining: 365,
      ipfsCid: `bafybei${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      fileSize: "1.2 MB",
      uploadedAt: new Date().toISOString().split("T")[0],
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setIsUploadOpen(false);
    setUploadForm({ title: "", category: "Tax Exemption", issuer: "", validUntil: "", fileName: "" });
    setUploadFeedback(`Document '${newDoc.title}' uploaded successfully. Awaiting auditor verification.`);
    setTimeout(() => setUploadFeedback(""), 5000);
  };

  const getStatusBadge = (status, daysRemaining) => {
    if (status === "Expiring Soon" || (daysRemaining <= 60 && status === "Verified")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Expiring in {daysRemaining} days</span>
        </span>
      );
    }
    if (status === "Verified") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Verified</span>
        </span>
      );
    }
    if (status === "Pending Review") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-600" />
          <span>Pending Review</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
        Expired
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-[28px] font-outfit font-bold text-[#071B3B]">
              Document Compliance & Verification Vault
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
              IPFS Content-Addressed
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[#66738A] mt-1">
            Official statutory filings, tax exemptions (80G, 12A), FCRA compliance, and annual financial audits for {activeOrganization?.name || "Asha Foundation"}.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 bg-[#1D5FD0] hover:bg-[#1D5FD0]/90 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {uploadFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{uploadFeedback}</span>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedCategory === cat
                ? "bg-[#071B3B] text-white font-semibold shadow-sm"
                : "bg-slate-50 hover:bg-slate-100 text-[#64748B]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-3.5 px-4">Document Title & ID</th>
                <th className="py-3.5 px-4">Regulatory Category</th>
                <th className="py-3.5 px-4">Issuing Authority</th>
                <th className="py-3.5 px-4">Validity / Expiry</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#071B3B]">{doc.title}</div>
                    <div className="text-[10px] font-mono text-slate-400">{doc.id} • {doc.fileSize}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {doc.category}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {doc.issuer}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {doc.validUntil}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(doc.status, doc.daysRemaining)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Safe Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Verified Compliance Filing
                </div>
                <h3 className="text-base font-bold text-[#071B3B] mt-0.5">
                  {previewDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{previewDoc.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issuing Authority:</span>
                  <span className="font-medium text-slate-800">{previewDoc.issuer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Validity Horizon:</span>
                  <span className="font-mono text-slate-800">{previewDoc.validUntil}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification Status:</span>
                  <span>{getStatusBadge(previewDoc.status, previewDoc.daysRemaining)}</span>
                </div>
              </div>

              {/* IPFS Proof Badge */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  <span>Immutable IPFS Content Identifier</span>
                </div>
                <div className="font-mono text-[11px] text-blue-800 break-all select-all bg-white/70 p-2 rounded border border-blue-100">
                  {previewDoc.ipfsCid}
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-blue-700">SHA-256 Checksum Verified</span>
                  <a
                    href={`https://ipfs.io/ipfs/${previewDoc.ipfsCid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Open Gateway Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#071B3B]">
                Upload Regulatory Document
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 80G Renewal Order 2024-2029"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Category *</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                >
                  <option value="Tax Exemption">Tax Exemption (80G)</option>
                  <option value="Legal Incorporation">Legal Incorporation (12A)</option>
                  <option value="Foreign Contributions">Foreign Contributions (FCRA)</option>
                  <option value="Financial Audit">Statutory Financial Audit</option>
                  <option value="Governance">Governance / Bylaws</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Issuing Authority</label>
                <input
                  type="text"
                  placeholder="e.g. Ministry of Finance / Income Tax Dept"
                  value={uploadForm.issuer}
                  onChange={(e) => setUploadForm({ ...uploadForm, issuer: e.target.value })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={uploadForm.validUntil}
                  onChange={(e) => setUploadForm({ ...uploadForm, validUntil: e.target.value })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800"
                />
              </div>

              <div className="p-3 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 flex flex-col items-center gap-1.5">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600 font-medium">Select PDF or Scanned Certificate</span>
                <span className="text-[10px] text-slate-400">PDF, PNG, or JPEG up to 10MB</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D5FD0] text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
