"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  CheckCircle2,
  Clock,
  Eye,
  MousePointerClick,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  User,
  Paperclip,
  Server,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import { openComposer, SentEmailLog } from "@/app/redux/emailClients";

interface EmailHistoryTabProps {
  leadId?: string;
  leadEmail?: string;
  leadName?: string;
  estimatedValue?: number;
}

const STATUS_BADGES: Record<
  SentEmailLog["status"],
  { label: string; bg: string; text: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  sent: { label: "Sent", bg: "bg-[#DCE9EC]", text: "text-[#2E5B65]", icon: Send },
  delivered: { label: "Delivered", bg: "bg-[#3C8F6B]/15", text: "text-[#246147]", icon: CheckCircle2 },
  opened: { label: "Opened", bg: "bg-[#458393]/15", text: "text-[#458393]", icon: Eye },
  clicked: { label: "Link Clicked", bg: "bg-[#C9A24A]/15", text: "text-[#7A5B1A]", icon: MousePointerClick },
  failed: { label: "Failed", bg: "bg-[#C1523F]/15", text: "text-[#C1523F]", icon: AlertCircle },
};

export default function EmailHistoryTab({
  leadId,
  leadEmail,
  leadName,
  estimatedValue,
}: EmailHistoryTabProps) {
  const dispatch = useAppDispatch();
  const { sentLogs } = useAppSelector((state) => state.emailClients);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const relevantLogs = sentLogs.filter((log) => {
    if (!leadId && !leadEmail) return true;
    return (
      (leadId && log.leadId === leadId) ||
      (leadEmail && log.leadEmail?.toLowerCase() === leadEmail?.toLowerCase())
    );
  });

  const handleCompose = () => {
    dispatch(
      openComposer([
        {
          id: leadId || `lead-${Date.now()}`,
          personId: leadName || "Lead",
          email: leadEmail || "",
          estimatedValue,
        },
      ])
    );
  };

  return (
    <div className="rounded-2xl border border-[#E5CB90]/70 bg-white p-5 text-[#22303A] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E0] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF3C8]/70 border border-[#E5CB90] text-[#458393]">
            <Mail size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#22303A]">
              Email Communication History (Nodemailer)
            </h3>
            <p className="text-xs text-[#5C6D71]">
              {relevantLogs.length} email{relevantLogs.length === 1 ? "" : "s"} logged with this lead
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCompose}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition active:scale-95"
        >
          <Send size={13} />
          Compose New Email
        </button>
      </div>

      {/* List */}
      {relevantLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5CB90] p-6 text-center bg-[#FFF3C8]/20">
          <Mail size={24} className="mx-auto text-[#9A9A8F] mb-2" />
          <p className="text-xs font-semibold text-[#22303A]">
            No emails recorded for this lead yet
          </p>
          <p className="text-xs text-[#5C6D71] mt-0.5">
            Click &quot;Compose New Email&quot; above to reach out via your Nodemailer SMTP client.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {relevantLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const badge = STATUS_BADGES[log.status] || STATUS_BADGES.sent;
            const Icon = badge.icon;

            return (
              <div
                key={log.id}
                className="rounded-2xl border border-[#E5CB90]/70 bg-[#FAFAF7] transition hover:border-[#458393]/60 overflow-hidden"
              >
                {/* Summary */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5CB90] text-[#458393]">
                      <Mail size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#22303A] truncate">
                        {log.subject}
                      </p>
                      <p className="text-[11px] text-[#5C6D71] truncate">
                        From: <span className="font-medium text-[#22303A]">{log.clientName}</span> ({log.clientEmail})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text}`}
                    >
                      <Icon size={11} />
                      {badge.label}
                    </span>

                    <span className="text-xs text-[#5C6D71]">
                      {new Date(log.sentAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {isExpanded ? (
                      <ChevronUp size={15} className="text-[#5C6D71]" />
                    ) : (
                      <ChevronDown size={15} className="text-[#5C6D71]" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#E5E5E0] bg-white p-4 text-xs text-[#22303A] space-y-3"
                    >
                      <div className="whitespace-pre-wrap leading-relaxed font-sans bg-[#FAFAF7] p-3.5 rounded-xl border border-[#E5E5E0]">
                        {log.body}
                      </div>

                      {log.attachments && log.attachments.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-[#5C6D71] flex items-center gap-1">
                            <Paperclip size={12} /> Attachments:
                          </span>
                          {log.attachments.map((att) => (
                            <span
                              key={att.id}
                              className="rounded-lg bg-[#FAFAF7] border border-[#E5CB90] px-2.5 py-1 text-xs text-[#22303A]"
                            >
                              {att.name} ({Math.round(att.size / 1024)} KB)
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompose();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#458393] hover:underline"
                        >
                          <Send size={11} /> Send Follow-up Email
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
