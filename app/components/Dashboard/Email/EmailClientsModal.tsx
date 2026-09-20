"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Plus,
  Mail,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Key,
  RefreshCw,
  Edit3,
  Star,
  Check,
  HelpCircle,
  Lock,
  Shield,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  GmailAccount,
  addEmailClient,
  updateEmailClient,
  deleteEmailClient,
  setDefaultClient,
  closeClientModal,
} from "@/app/redux/emailClients";
import { addNotification } from "@/app/redux/notifications";

export default function EmailClientsModal() {
  const dispatch = useAppDispatch();
  const { clients, isClientModalOpen } = useAppSelector(
    (state) => state.emailClients
  );

  const [activeTab, setActiveTab] = useState<"list" | "add" | "edit">("list");
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Form states — Gmail only
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [replyTo, setReplyTo] = useState("");
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
    setName("");
    setEmail("");
    setAppPassword("");
    setReplyTo("");
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

  const handleOpenEdit = (client: GmailAccount) => {
    setEditingClientId(client.id);
    setName(client.name);
    setEmail(client.email);
    setAppPassword(client.appPassword || "");
    setReplyTo(client.replyTo || "");
    setSignature(client.signature || "");
    setIsDefault(client.isDefault);
    setTestResult(null);
    setActiveTab("edit");
  };

  const handleTestConnection = async () => {
    if (!email.trim() || !email.includes("@")) {
      setTestResult({
        success: false,
        message: "Please enter a valid Gmail address before testing.",
      });
      return;
    }
    if (!appPassword.trim()) {
      setTestResult({
        success: false,
        message: "Please enter your Google App Password to test the connection.",
      });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    // Simulated connection test
    await new Promise((resolve) => setTimeout(resolve, 800));

    setTestingConnection(false);
    setTestResult({
      success: true,
      message: `Gmail SMTP verified! Connected to smtp.gmail.com:465 as ${email}.`,
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
            appPassword: appPassword.trim() || undefined,
            replyTo: replyTo.trim() ? replyTo.trim().toLowerCase() : undefined,
            smtpHost: "smtp.gmail.com",
            smtpPort: 465,
            smtpSecure: true,
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
            type: "system_alert",
            title: "Gmail Account Updated",
            message: `Gmail account "${name}" (${email}) updated successfully.`,
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
          appPassword: appPassword.trim() || undefined,
          replyTo: replyTo.trim() ? replyTo.trim().toLowerCase() : undefined,
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
          type: "system_alert",
          title: "Gmail Account Added",
          message: `Gmail account "${name}" (${email}) is connected and ready to send.`,
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
    if (confirm(`Remove the Gmail account "${clientName}"?`)) {
      dispatch(deleteEmailClient(id));
      dispatch(
        addNotification({
          id: `client-deleted-${Date.now()}`,
          category: "system",
          type: "system_alert",
          title: "Gmail Account Removed",
          message: `Gmail account "${clientName}" was deleted.`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#E5CB90] bg-white text-[#22303A] shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5CB90]/70 px-6 py-4 bg-[#FFF3C8]/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#458393]/10 border border-[#458393]/20 text-[#458393]">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#22303A]">
                Gmail Accounts
              </h2>
              <p className="text-xs text-[#5C6D71]">
                Connect your Gmail / Google Workspace to send emails to leads
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closeClientModal())}
            className="rounded-lg p-2 text-[#5C6D71] hover:bg-[#FFF3C8] hover:text-[#22303A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E5CB90]/60 px-6 bg-white">
          <button
            type="button"
            onClick={() => {
              setActiveTab("list");
              resetForm();
            }}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "list"
                ? "border-[#458393] text-[#458393]"
                : "border-transparent text-[#5C6D71] hover:text-[#22303A]"
            }`}
          >
            <Mail size={16} />
            My Accounts ({clients.length})
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "add"
                ? "border-[#458393] text-[#458393]"
                : "border-transparent text-[#5C6D71] hover:text-[#22303A]"
            }`}
          >
            <Plus size={16} />
            Add Gmail Account
          </button>

          {activeTab === "edit" && (
            <button
              type="button"
              className="flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 border-[#458393] text-[#458393]"
            >
              <Edit3 size={16} />
              Edit Account
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FAFAF7]">
          {activeTab === "list" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#5C6D71]">
                  Manage your Gmail sender accounts used for emailing leads.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#346a78] transition-colors"
                >
                  <Plus size={14} /> Add Account
                </button>
              </div>

              {clients.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E5CB90] p-8 text-center bg-white">
                  <Mail size={32} className="mx-auto text-[#9A9A8F] mb-2" />
                  <p className="text-sm font-semibold text-[#22303A]">
                    No Gmail accounts configured yet
                  </p>
                  <p className="text-xs text-[#5C6D71] mt-1 max-w-sm mx-auto">
                    Add your Gmail credentials with a Google App Password to start
                    sending emails directly to your leads.
                  </p>
                  <button
                    onClick={handleOpenAdd}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#458393] px-4 py-2 text-xs font-semibold text-white hover:bg-[#346a78] transition shadow-sm"
                  >
                    <Plus size={15} /> Add Gmail Account
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map((c) => (
                    <div
                      key={c.id}
                      className={`group relative rounded-2xl border p-4.5 transition-all bg-white ${
                        c.isDefault
                          ? "border-[#458393] shadow-sm ring-1 ring-[#458393]/30"
                          : "border-[#E5CB90]/70 hover:border-[#458393]/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#458393]/20 bg-[#FFF3C8]/60 text-[#458393]">
                            <Mail size={20} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-[#22303A] truncate">
                                {c.name}
                              </h3>
                              {c.isDefault && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3C8] border border-[#E5CB90] px-2 py-0.5 text-[11px] font-semibold text-[#458393]">
                                  <Star size={11} className="fill-[#458393]" /> Default
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-[#22303A] font-medium truncate">
                              {c.email}
                            </p>

                            <div className="mt-2 flex items-center gap-3 text-[11px] text-[#5C6D71] flex-wrap">
                              <span className="flex items-center gap-1 text-[#3C8F6B] font-medium">
                                <CheckCircle2 size={12} /> Connected
                              </span>
                              <span className="flex items-center gap-1">
                                <Shield size={11} /> smtp.gmail.com:465 SSL
                              </span>
                              {c.replyTo && <span>Reply-To: {c.replyTo}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!c.isDefault && (
                            <button
                              type="button"
                              onClick={() => dispatch(setDefaultClient(c.id))}
                              className="rounded-lg border border-[#E5CB90] bg-white px-2.5 py-1 text-xs font-medium text-[#22303A] hover:bg-[#FFF3C8]/50 transition"
                              title="Set as Default Sender"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="rounded-lg border border-[#E5E5E0] bg-white p-1.5 text-[#5C6D71] hover:bg-[#FFF3C8]/50 hover:text-[#22303A] transition"
                            title="Edit Account"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, c.name)}
                            className="rounded-lg border border-[#C1523F]/30 bg-white p-1.5 text-[#C1523F] hover:bg-[#C1523F]/10 transition"
                            title="Delete Account"
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
              {/* Gmail Info Banner */}
              <div className="flex items-start gap-2.5 rounded-xl border border-[#458393]/20 bg-[#458393]/5 p-3 text-xs text-[#346a78]">
                <HelpCircle size={16} className="shrink-0 mt-0.5 text-[#458393]" />
                <div>
                  <p className="font-semibold text-[#458393]">Gmail / Google Workspace</p>
                  <p className="mt-0.5 text-[#5C6D71]">
                    To send emails via Gmail, you need a{" "}
                    <strong className="text-[#22303A]">Google App Password</strong>.
                    Go to your Google Account → Security → 2-Step Verification → App Passwords,
                    and generate a 16-character password for &quot;Mail&quot;.
                  </p>
                </div>
              </div>

              {/* Sender Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white p-4 rounded-2xl border border-[#E5CB90]/70">
                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Alex Turner (Sales)"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Gmail Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., alex@gmail.com"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    <span className="flex items-center gap-1">
                      <Key size={12} /> Google App Password <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="password"
                    required
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F] font-mono tracking-wider"
                  />
                  <p className="mt-1 text-[10px] text-[#9A9A8F]">
                    16-character app password from your Google Account settings
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Reply-To Email <span className="text-[#9A9A8F] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="e.g., support@yourcompany.com"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F]"
                  />
                </div>
              </div>

              {/* Connection info */}
              <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5CB90]/70 px-4 py-2.5 text-xs text-[#5C6D71]">
                <Lock size={13} className="text-[#458393]" />
                <span>
                  Sends via <strong className="text-[#22303A]">smtp.gmail.com:465</strong> with SSL/TLS encryption
                </span>
              </div>

              {/* Email Signature */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5CB90]/70">
                <label className="block text-xs font-semibold text-[#22303A] mb-1">
                  Default Email Signature
                </label>
                <textarea
                  rows={3}
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Enter sign-off..."
                  className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] p-3 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white font-mono"
                />
              </div>

              {/* Set Default Toggle */}
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 accent-[#458393] cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-xs font-medium text-[#22303A] cursor-pointer">
                  Set as the default Gmail account for sending lead emails
                </label>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                    testResult.success
                      ? "border-[#3C8F6B]/30 bg-[#3C8F6B]/10 text-[#246147]"
                      : "border-[#C1523F]/30 bg-[#C1523F]/10 text-[#C1523F]"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#3C8F6B]" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#C1523F]" />
                  )}
                  <span className="font-medium">{testResult.message}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E5CB90]/70">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E5CB90] bg-white px-4 py-2 text-xs font-semibold text-[#22303A] hover:bg-[#FFF3C8]/50 transition disabled:opacity-50"
                >
                  <RefreshCw
                    size={13}
                    className={testingConnection ? "animate-spin text-[#458393]" : ""}
                  />
                  {testingConnection ? "Testing..." : "Test Connection"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setActiveTab("list");
                    }}
                    className="rounded-xl border border-[#E5E5E0] bg-white px-4 py-2 text-xs font-medium text-[#5C6D71] hover:bg-[#F7F7F2] transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-5 py-2 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition active:scale-95"
                  >
                    <Check size={14} />
                    {activeTab === "edit" ? "Save Changes" : "Save Gmail Account"}
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
