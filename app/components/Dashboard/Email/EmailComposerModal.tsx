"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  X,
  Send,
  Mail,
  ChevronDown,
  Plus,
  Server,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  closeComposer,
  openClientModal,
  sendEmailLog,
  setSelectedClientId,
} from "@/app/redux/emailClients";
import { addNotification } from "@/app/redux/notifications";

export default function EmailComposerModal() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isComposerOpen, composerLeads, clients, selectedClientId } = useAppSelector(
    (state) => state.emailClients
  );

  const activeClient = useMemo(() => {
    return (
      clients.find((c) => c.id === selectedClientId) ||
      clients.find((c) => c.isDefault) ||
      clients[0] ||
      null
    );
  }, [clients, selectedClientId]);

  const [to, setTo] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [appendSignature, setAppendSignature] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isComposerOpen) return;

    setTo(composerLeads.map((lead) => lead.email).join(", "));
    setShowCcBcc(false);
    setCc("");
    setBcc("");
    setSubject(
      composerLeads.length === 1
        ? `Regarding sales opportunity with ${composerLeads[0].personId || "Lead"}`
        : ""
    );
    setBody("");
    setAppendSignature(true);
    setSendError(null);
    setIsSending(false);
  }, [isComposerOpen, composerLeads]);

  const handleComposeWithAI = () => {
    const params = new URLSearchParams();
    if (to) params.set("to", to.trim());
    if (subject) params.set("subject", subject.trim());
    if (body) params.set("body", body.trim());
    if (composerLeads.length > 0) {
      params.set(
        "leads",
        composerLeads.map((l) => `${l.personId}:${l.email}`).join(",")
      );
    }
    dispatch(closeComposer());
    router.push(`/dashboard/email-ai${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);

    if (!activeClient) {
      dispatch(openClientModal());
      return;
    }

    if (!activeClient.appPassword) {
      setSendError(
        `No App Password saved for ${activeClient.email}. Edit the account and add one first.`
      );
      return;
    }

    if (!to.trim() || !subject.trim() || !body.trim()) {
      return;
    }

    setIsSending(true);

    const bodyHtml = body.trim().replace(/\n/g, "<br/>");
    const signatureHtml = activeClient.signature
      ? activeClient.signature.trim().replace(/\n/g, "<br/>")
      : "";
    const html =
      appendSignature && signatureHtml
        ? `${bodyHtml}<br/><br/>${signatureHtml}`
        : bodyHtml;

    try {
      const { data } = await axios.post("/api/Email/Clientmail", {
        smtp: {
          host: activeClient.smtpHost,
          port: activeClient.smtpPort,
          secure: activeClient.smtpSecure,
          user: activeClient.email,
          pass: activeClient.appPassword,
        },
        from: {
          name: activeClient.name,
          email: activeClient.email,
        },
        replyTo: activeClient.replyTo,
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        html,
        text: body,
      });
      if (!data.success) {
        throw new Error(data.error || "Failed to send email.");
      }

      const leadsToLog =
        composerLeads.length > 0
          ? composerLeads
          : to.split(",").map((email) => ({
              id: `manual-${Date.now()}`,
              personId: email.trim().split("@")[0],
              email: email.trim(),
            }));

      leadsToLog.forEach((lead) => {
        dispatch(
          sendEmailLog({
            leadId: lead.id,
            leadName: lead.personId,
            leadEmail: lead.email,
            clientId: activeClient.id,
            clientEmail: activeClient.email,
            clientName: activeClient.name,
            subject: subject.replaceAll("{{lead_name}}", lead.personId),
            body: body.replaceAll("{{lead_name}}", lead.personId),
            status: "delivered",
          })
        );
      });

      dispatch(
        addNotification({
          id: `email-sent-${Date.now()}`,
          category: "leads",
          type: "system_alert",
          title: "Email Sent Successfully",
          message: `Email sent to ${leadsToLog.length} recipient(s) via ${activeClient.email}.`,
          time: "Just now",
          timestamp: Date.now(),
          unread: true,
          priority: "high",
          actionLabel: "View Leads",
          actionUrl: "/dashboard/leads",
        })
      );

      dispatch(closeComposer());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted || !isComposerOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-[#E5CB90] bg-white text-[#22303A] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[#E5CB90]/70 px-6 py-4 bg-[#FFF3C8]/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#458393]/10 border border-[#458393]/20 text-[#458393]">
              <Mail size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#22303A] flex items-center gap-2">
                Send Email to Lead
                {composerLeads.length > 1 && (
                  <span className="rounded-full bg-[#FFF3C8] border border-[#E5CB90] px-2.5 py-0.5 text-[11px] font-semibold text-[#458393]">
                    {composerLeads.length} Leads
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#5C6D71]">
                Compose and send from your connected SMTP account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dispatch(closeComposer())}
            className="rounded-lg p-2 text-[#5C6D71] hover:bg-[#FFF3C8] hover:text-[#22303A] transition"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSendEmail} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAFAF7]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#E5CB90] bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="text-xs font-semibold text-[#22303A] shrink-0">
                From (SMTP Sender):
              </span>

              {clients.length === 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#C1523F] font-semibold">
                    No SMTP account added
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch(openClientModal())}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#458393] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#346a78]"
                  >
                    <Plus size={12} /> Add SMTP Now
                  </button>
                </div>
              ) : (
                <div className="relative flex-1 min-w-[200px]">
                  <select
                    value={activeClient?.id || ""}
                    onChange={(e) => dispatch(setSelectedClientId(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-1.5 pr-8 text-xs font-medium text-[#22303A] outline-none focus:border-[#458393]"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email}) {c.isDefault ? "★ Default" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5C6D71]"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => dispatch(openClientModal())}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5CB90] bg-white px-3 py-1.5 text-xs font-semibold text-[#22303A] hover:bg-[#FFF3C8]/40 transition shrink-0"
            >
              <Server size={13} className="text-[#458393]" />
              SMTP Accounts ({clients.length})
            </button>
          </div>

          {composerLeads.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#E5CB90]/70 bg-white p-3">
              <span className="text-xs font-semibold text-[#5C6D71] mr-1">Recipients:</span>
              {composerLeads.map((lead) => (
                <span
                  key={lead.id}
                  className="inline-flex items-center rounded-lg bg-[#FFF3C8]/60 border border-[#E5CB90] px-2.5 py-1 text-xs font-medium text-[#22303A]"
                >
                  {lead.personId}
                </span>
              ))}
            </div>
          )}

          <div className="bg-white p-3.5 rounded-2xl border border-[#E5CB90]/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#22303A]">
                To (Recipient Leads) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-xs font-semibold text-[#458393] hover:underline"
              >
                {showCcBcc ? "Hide CC/BCC" : "+ Add CC / BCC"}
              </button>
            </div>

            <input
              type="text"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="lead@example.com, another@example.com"
              className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs font-medium text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F]"
            />
          </div>

          {showCcBcc && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-[#E5CB90]/70">
              <div>
                <label className="block text-xs font-medium text-[#5C6D71] mb-1">CC Email</label>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="manager@yourcompany.com"
                  className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-1.5 text-xs text-[#22303A] outline-none focus:border-[#458393]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C6D71] mb-1">BCC Email</label>
                <input
                  type="email"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="archive@yourcompany.com"
                  className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-1.5 text-xs text-[#22303A] outline-none focus:border-[#458393]"
                />
              </div>
            </div>
          )}

          <div className="bg-white p-3.5 rounded-2xl border border-[#E5CB90]/70">
            <label className="block text-xs font-semibold text-[#22303A] mb-1">
              Subject Line 
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Next steps regarding our collaboration"
              className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3.5 py-2 text-xs font-medium text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F]"
            />
          </div>

          <div className="rounded-2xl border border-[#E5CB90] bg-white overflow-hidden shadow-sm">
            <label className="block text-xs font-semibold text-[#22303A] px-4 pt-3.5 pb-1">
              Message 
            </label>
            <textarea
              rows={8}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email body here..."
              className="w-full bg-[#FAFAF7] p-4 text-xs leading-relaxed text-[#22303A] outline-none resize-y placeholder:text-[#9A9A8F] font-sans border-t border-[#E5CB90]/60"
            />

            {activeClient?.signature && (
              <label className="flex items-center gap-2 border-t border-[#E5CB90]/60 px-4 py-2.5 bg-white text-[11px] text-[#5C6D71]">
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

          {sendError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#C1523F]/30 bg-[#C1523F]/10 p-3 text-xs text-[#C1523F]">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="font-medium">{sendError}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[#E5CB90]/70 pt-4">
            <button
              type="button"
              onClick={() => dispatch(closeComposer())}
              className="rounded-xl border border-[#E5E5E0] bg-white px-4 py-2 text-xs font-medium text-[#5C6D71] hover:bg-[#F7F7F2]"
            >
              Discard Draft
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleComposeWithAI}
                title="Use AI to draft this email"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9A24A]/40 bg-[#FFF8E0] px-4 py-2 text-xs font-semibold text-[#7A5B1A] hover:bg-[#FFF3C8] transition active:scale-95"
              >
                <Sparkles size={13} />
                Compose with AI
              </button>
              <button
              type="submit"
              disabled={isSending || !to.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#458393] px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition active:scale-95 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send Email
                  {composerLeads.length > 1 ? ` to ${composerLeads.length} Leads` : ""}
                </>
              )}
            </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}
