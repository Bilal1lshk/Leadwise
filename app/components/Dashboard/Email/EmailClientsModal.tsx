"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Send,
  Mail,
  ChevronDown,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAppSelector } from "@/app/redux/hooks";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional prefilled recipient, e.g. when emailing a specific lead */
  defaultTo?: string;
  defaultSubject?: string;
}

export default function SendEmailModal({
  isOpen,
  onClose,
  defaultTo = "",
  defaultSubject = "",
}: SendEmailModalProps) {
  const { clients } = useAppSelector((state) => state.emailClients);

  const defaultClientId = useMemo(
    () => clients.find((c) => c.isDefault)?.id || clients[0]?.id || "",
    [clients]
  );

  const [fromClientId, setFromClientId] = useState(defaultClientId);
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [appendSignature, setAppendSignature] = useState(true);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const selectedClient = clients.find((c) => c.id === fromClientId);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setTo(defaultTo);
    setCc("");
    setBcc("");
    setShowCcBcc(false);
    setSubject(defaultSubject);
    setBody("");
    setResult(null);
    onClose();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sending email...");
  
    setResult(null);

    if (!selectedClient) {
      setResult({ success: false, message: "Select a Gmail account to send from." });
      return;
    }
    if (!selectedClient.appPassword) {
      setResult({
        success: false,
        message: `No App Password saved for ${selectedClient.email}. Edit the account and add one first.`,
      });
      return;
    }
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setResult({ success: false, message: "To, subject, and body are all required." });
      return;
    }

    setSending(true);

    // Turn plain-text body into simple HTML (preserve line breaks)
    const bodyHtml = body.trim().replace(/\n/g, "<br/>");
    const signatureHtml = selectedClient.signature
      ? selectedClient.signature.trim().replace(/\n/g, "<br/>")
      : "";
    const html =
      appendSignature && signatureHtml
        ? `${bodyHtml}<br/><br/>${signatureHtml}`
        : bodyHtml;

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp: {
            host: selectedClient.smtpHost,
            port: selectedClient.smtpPort,
            secure: selectedClient.smtpSecure,
            user: selectedClient.email,
            pass: selectedClient.appPassword,
          },
          from: {
            name: selectedClient.name,
            email: selectedClient.email,
          },
          replyTo: selectedClient.replyTo,
          to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject,
          html,
          text: body,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send email.");
      }

      setResult({ success: true, message: `Email sent to ${to}.` });
      setTo(defaultTo);
      setCc("");
      setBcc("");
      setSubject(defaultSubject);
      setBody("");
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Something went wrong." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-[#E5CB90] bg-white text-[#22303A] shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5CB90]/70 px-6 py-4 bg-[#FFF3C8]/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#458393]/10 border border-[#458393]/20 text-[#458393]">
              <Send size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#22303A]">Compose Email</h2>
              <p className="text-xs text-[#5C6D71]">Send directly from your connected Gmail account</p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="rounded-lg p-2 text-[#5C6D71] hover:bg-[#FFF3C8] hover:text-[#22303A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAFAF7]">
          {clients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5CB90] p-6 text-center bg-white">
              <Mail size={28} className="mx-auto text-[#9A9A8F] mb-2" />
              <p className="text-sm font-semibold text-[#22303A]">No Gmail accounts connected</p>
              <p className="text-xs text-[#5C6D71] mt-1">
                Add a Gmail account first before composing an email.
              </p>
            </div>
          ) : (
            <>
              {/* From */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5CB90]/70 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Send From
                  </label>
                  <div className="relative">
                    <select
                      value={fromClientId}
                      onChange={(e) => setFromClientId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 pr-8 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email}){c.isDefault ? " — Default" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A8F]"
                    />
                  </div>
                </div>

                {/* To */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#22303A]">
                      To <span className="text-red-500">*</span>
                    </label>
                    {!showCcBcc && (
                      <button
                        type="button"
                        onClick={() => setShowCcBcc(true)}
                        className="text-[11px] font-medium text-[#458393] hover:text-[#346a78]"
                      >
                        Add Cc/Bcc
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="lead@example.com, another@example.com"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F]"
                  />
                </div>

                {showCcBcc && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#22303A] mb-1">Cc</label>
                      <input
                        type="text"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        placeholder="Optional"
                        className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#22303A] mb-1">Bcc</label>
                      <input
                        type="text"
                        value={bcc}
                        onChange={(e) => setBcc(e.target.value)}
                        placeholder="Optional"
                        className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F]"
                      />
                    </div>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Following up on your inquiry"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F]"
                  />
                </div>
              </div>

              {/* Body */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5CB90]/70">
                <label className="block text-xs font-semibold text-[#22303A] mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message..."
                  className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] p-3 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white"
                />

                {selectedClient?.signature && (
                  <label className="mt-2 flex items-center gap-2 text-[11px] text-[#5C6D71]">
                    <input
                      type="checkbox"
                      checked={appendSignature}
                      onChange={(e) => setAppendSignature(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#458393] cursor-pointer"
                    />
                    Append default signature
                  </label>
                )}
              </div>

              {/* Attachment placeholder (not wired to backend yet) */}
              <div className="flex items-center gap-2 rounded-xl bg-white border border-dashed border-[#E5CB90]/70 px-4 py-2.5 text-[11px] text-[#9A9A8F]">
                <Paperclip size={13} />
                <span>Attachments aren&apos;t supported yet</span>
              </div>

              {/* Result */}
              {result && (
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                    result.success
                      ? "border-[#3C8F6B]/30 bg-[#3C8F6B]/10 text-[#246147]"
                      : "border-[#C1523F]/30 bg-[#C1523F]/10 text-[#C1523F]"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#3C8F6B]" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#C1523F]" />
                  )}
                  <span className="font-medium">{result.message}</span>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5CB90]/70">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-xl border border-[#E5E5E0] bg-white px-4 py-2 text-xs font-medium text-[#5C6D71] hover:bg-[#F7F7F2] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || clients.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-5 py-2 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition active:scale-95 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}