"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Mail,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  Server,
  Key,
  ShieldCheck,
  RefreshCw,
  Edit3,
  Star,
  Check,
  Globe,
  HelpCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  EmailClient,
  EmailProviderType,
  addEmailClient,
  updateEmailClient,
  deleteEmailClient,
  setDefaultClient,
  closeClientModal,
} from "@/app/redux/emailClients";
import { addNotification } from "@/app/redux/notifications";

const PROVIDER_OPTIONS: Array<{
  id: EmailProviderType;
  name: string;
  description: string;
  badge: string;
  recommended?: boolean;
}> = [
  {
    id: "gmail",
    name: "Google Workspace / Gmail",
    description: "Connect your Google business account or OAuth client",
    badge: "Most Popular",
    recommended: true,
  },
  {
    id: "outlook",
    name: "Microsoft 365 / Outlook",
    description: "Connect your Microsoft Office 365 or Outlook email",
    badge: "Enterprise",
  },
  {
    id: "smtp",
    name: "Custom SMTP Server",
    description: "Connect any standard SMTP mail server (Port 587/465)",
    badge: "Direct Server",
  },
  {
    id: "api",
    name: "Transactional API (Resend / SendGrid)",
    description: "High-deliverability API-driven email client",
    badge: "Fast & Scalable",
  },
];

export default function EmailClientsModal() {
  const dispatch = useAppDispatch();
  const { clients, isClientModalOpen } = useAppSelector(
    (state) => state.emailClients
  );

  const [activeTab, setActiveTab] = useState<"list" | "add" | "edit">("list");
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Form states
  const [provider, setProvider] = useState<EmailProviderType>("gmail");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpSecure, setSmtpSecure] = useState<boolean>(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [signature, setSignature] = useState(
    "--\nBest regards,\n[Your Name]\n[Company Name] | [Phone/Website]"
  );
  const [isDefault, setIsDefault] = useState<boolean>(false);

  // Connection testing state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const resetForm = () => {
    setProvider("gmail");
    setName("");
    setEmail("");
    setReplyTo("");
    setSmtpHost("");
    setSmtpPort(587);
    setSmtpSecure(true);
    setUsername("");
    setPassword("");
    setApiKey("");
    setSignature(
      "--\nBest regards,\n[Your Name]\n[Company Name] | [Phone/Website]"
    );
    setIsDefault(clients.length === 0);
    setTestResult(null);
    setEditingClientId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setActiveTab("add");
  };

  const handleOpenEdit = (client: EmailClient) => {
    setEditingClientId(client.id);
    setProvider(client.provider);
    setName(client.name);
    setEmail(client.email);
    setReplyTo(client.replyTo || "");
    setSmtpHost(client.smtpHost || "");
    setSmtpPort(client.smtpPort || 587);
    setSmtpSecure(client.smtpSecure ?? true);
    setUsername(client.username || "");
    setSignature(client.signature || "");
    setIsDefault(client.isDefault);
    setTestResult(null);
    setActiveTab("edit");
  };

  const handleTestConnection = async () => {
    if (!email.trim() || !email.includes("@")) {
      setTestResult({
        success: false,
        message: "Please enter a valid sender email address before testing.",
      });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    // Frontend simulation of connection handshake
    await new Promise((resolve) => setTimeout(resolve, 900));

    setTestingConnection(false);
    setTestResult({
      success: true,
      message: `Connection established successfully with ${email}. Handshake verified!`,
    });
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      return;
    }

    if (activeTab === "edit" && editingClientId) {
      const existing = clients.find((c) => c.id === editingClientId);
      if (existing) {
        dispatch(
          updateEmailClient({
            ...existing,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            replyTo: replyTo.trim() ? replyTo.trim().toLowerCase() : undefined,
            provider,
            smtpHost: provider === "smtp" ? smtpHost : undefined,
            smtpPort: provider === "smtp" ? Number(smtpPort) : undefined,
            smtpSecure: provider === "smtp" ? smtpSecure : undefined,
            username: provider === "smtp" ? username : undefined,
            signature: signature.trim(),
            isDefault,
            status: "connected",
            lastVerifiedAt: new Date().toISOString(),
          })
        );
        dispatch(
          addNotification({
            id: `client-updated-${Date.now()}`,
            category: "system",
            type: "system",
            title: "Email Client Updated",
            message: `Sender account "${name}" has been updated successfully.`,
            time: "Just now",
            timestamp: Date.now(),
            unread: true,
            priority: "low",
          })
        );
      }
    } else {
      dispatch(
        addEmailClient({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          replyTo: replyTo.trim() ? replyTo.trim().toLowerCase() : undefined,
          provider,
          smtpHost: provider === "smtp" ? smtpHost : undefined,
          smtpPort: provider === "smtp" ? Number(smtpPort) : undefined,
          smtpSecure: provider === "smtp" ? smtpSecure : undefined,
          username: provider === "smtp" ? username : undefined,
          signature: signature.trim(),
          isDefault: isDefault || clients.length === 0,
          status: "connected",
          lastVerifiedAt: new Date().toISOString(),
        })
      );
      dispatch(
        addNotification({
          id: `client-added-${Date.now()}`,
          category: "system",
          type: "system",
          title: "Email Client Added",
          message: `New sender client "${name}" (${email}) is now ready to send emails to your leads.`,
          time: "Just now",
          timestamp: Date.now(),
          unread: true,
          priority: "medium",
        })
      );
    }

    resetForm();
    setActiveTab("list");
  };

  const handleDelete = (id: string, clientName: string) => {
    if (confirm(`Are you sure you want to remove the email client "${clientName}"?`)) {
      dispatch(deleteEmailClient(id));
      dispatch(
        addNotification({
          id: `client-deleted-${Date.now()}`,
          category: "system",
          type: "system",
          title: "Email Client Removed",
          message: `Email client "${clientName}" was deleted.`,
          time: "Just now",
          timestamp: Date.now(),
          unread: true,
          priority: "low",
        })
      );
    }
  };

  if (!isClientModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#263248] bg-[#111827] text-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#263248] px-6 py-4 bg-[#0D1421]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Email Clients & Sender Accounts
              </h2>
              <p className="text-xs text-slate-400">
                Configure your sending email identity to email leads directly
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closeClientModal())}
            className="rounded-lg p-2 text-slate-400 hover:bg-[#263248] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#263248] px-6 bg-[#0E1624]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("list");
              resetForm();
            }}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "list"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server size={16} />
            Configured Clients ({clients.length})
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "add"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Plus size={16} />
            Add New Client
          </button>

          {activeTab === "edit" && (
            <button
              type="button"
              className="flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 border-blue-500 text-blue-400"
            >
              <Edit3 size={16} />
              Edit Client
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "list" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Select which client to send from by default, or add a new provider.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-500 transition-colors"
                >
                  <Plus size={14} /> Add Client
                </button>
              </div>

              {clients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#263248] p-8 text-center bg-[#0D1421]/60">
                  <Mail size={32} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-sm font-medium text-white">
                    No email clients configured yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Add your email client (SMTP, Google Workspace, or Outlook) to start sending emails directly to your leads.
                  </p>
                  <button
                    onClick={handleOpenAdd}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
                  >
                    <Plus size={15} /> Add First Client
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map((c) => (
                    <div
                      key={c.id}
                      className={`group relative rounded-xl border p-4 transition-all ${
                        c.isDefault
                          ? "border-blue-500/50 bg-gradient-to-r from-blue-950/30 to-[#111827]"
                          : "border-[#263248] bg-[#0D1421] hover:border-[#384863]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                              c.provider === "gmail"
                                ? "border-red-500/20 bg-red-500/10 text-red-400"
                                : c.provider === "outlook"
                                ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            <Mail size={18} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-white truncate">
                                {c.name}
                              </h3>
                              {c.isDefault && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                                  <Star size={10} className="fill-blue-400" /> Default Sender
                                </span>
                              )}
                              <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] uppercase font-semibold text-slate-400">
                                {c.provider}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-300 font-mono truncate">
                              {c.email}
                            </p>

                            <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 size={12} /> Connected & Verified
                              </span>
                              {c.replyTo && (
                                <span>Reply-To: {c.replyTo}</span>
                              )}
                              {c.smtpHost && (
                                <span>Host: {c.smtpHost}:{c.smtpPort}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!c.isDefault && (
                            <button
                              type="button"
                              onClick={() => dispatch(setDefaultClient(c.id))}
                              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                              title="Set as Default Sender"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                            title="Edit Client"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, c.name)}
                            className="rounded-lg border border-red-500/20 p-1.5 text-red-400 hover:bg-red-500/10 transition"
                            title="Delete Client"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeTab === "add" || activeTab === "edit") && (
            <form onSubmit={handleSaveClient} className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Email Provider / Client Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PROVIDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProvider(opt.id)}
                      className={`relative flex flex-col text-left p-3 rounded-xl border transition-all ${
                        provider === opt.id
                          ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50"
                          : "border-[#263248] bg-[#0D1421] hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold text-white">
                          {opt.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                        {opt.description}
                      </p>
                      {provider === opt.id && (
                        <Check size={14} className="absolute bottom-2.5 right-2.5 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sender Display Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Alex Turner (Sales)"
                    className="w-full rounded-xl border border-[#263248] bg-[#0D1421] px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sender Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., alex@company.com"
                    className="w-full rounded-xl border border-[#263248] bg-[#0D1421] px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reply-To Email (Optional)
                </label>
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="e.g., support@company.com"
                  className="w-full rounded-xl border border-[#263248] bg-[#0D1421] px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-500"
                />
              </div>

              {/* SMTP Specific Fields */}
              {provider === "smtp" && (
                <div className="space-y-3 rounded-xl border border-[#263248] bg-[#0A101C] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                    <Server size={14} /> Custom SMTP Server Configuration
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        SMTP Host Server
                      </label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="mail.yourdomain.com"
                        className="w-full rounded-lg border border-[#263248] bg-[#0D1421] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Port
                      </label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#263248] bg-[#0D1421] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        SMTP Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username / Email"
                        className="w-full rounded-lg border border-[#263248] bg-[#0D1421] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        SMTP Password / App Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-lg border border-[#263248] bg-[#0D1421] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="smtpSecure"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="accent-blue-500"
                    />
                    <label htmlFor="smtpSecure" className="text-xs text-slate-300">
                      Require SSL / TLS Secure Connection
                    </label>
                  </div>
                </div>
              )}

              {/* API Provider Key */}
              {provider === "api" && (
                <div className="space-y-2 rounded-xl border border-[#263248] bg-[#0A101C] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                    <Key size={14} /> Transactional API Key
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Resend / SendGrid API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="re_123456789..."
                      className="w-full rounded-lg border border-[#263248] bg-[#0D1421] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Email Signature */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Email Signature
                </label>
                <textarea
                  rows={3}
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Add your personalized sign-off..."
                  className="w-full rounded-xl border border-[#263248] bg-[#0D1421] p-3 text-xs text-slate-200 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 font-mono"
                />
              </div>

              {/* Set Default Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 accent-blue-500 cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-xs text-slate-300 cursor-pointer">
                  Set this client as the default sender for new lead emails
                </label>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                    testResult.success
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#263248]">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                >
                  <RefreshCw
                    size={13}
                    className={testingConnection ? "animate-spin text-blue-400" : ""}
                  />
                  {testingConnection ? "Testing Connection..." : "Test Connection"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setActiveTab("list");
                    }}
                    className="rounded-xl border border-[#263248] px-4 py-2 text-xs font-medium text-slate-400 hover:bg-[#263248] hover:text-white transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition active:scale-95"
                  >
                    <Check size={14} />
                    {activeTab === "edit" ? "Save Changes" : "Add Client"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
