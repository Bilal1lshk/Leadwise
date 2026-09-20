"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Paperclip,
  Clock,
  Sparkles,
  FileText,
  Eye,
  Edit3,
  Mail,
  ChevronDown,
  Plus,
  Calendar,
  Bold,
  Italic,
  List,
  Link2,
  CheckCircle2,
  Server,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  closeComposer,
  openClientModal,
  sendEmailLog,
  saveTemplate,
  setSelectedClientId,
  EmailAttachment,
} from "@/app/redux/emailClients";
import { addNotification } from "@/app/redux/notifications";

const MERGE_TAGS = [
  { tag: "{{lead_name}}", label: "Lead Name" },
  { tag: "{{company}}", label: "Company / Org" },
  { tag: "{{email}}", label: "Lead Email" },
  { tag: "{{estimated_value}}", label: "Deal Value" },
  { tag: "{{sender_name}}", label: "Your Name" },
];

export default function EmailComposerModal() {
  const dispatch = useAppDispatch();
  const {
    isComposerOpen,
    composerPreselectedLeads,
    clients,
    selectedClientId,
    templates,
  } = useAppSelector((state) => state.emailClients);

  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");

  // Active sender client
  const activeClient = useMemo(() => {
    return (
      clients.find((c) => c.id === selectedClientId) ||
      clients.find((c) => c.isDefault) ||
      clients[0] ||
      null
    );
  }, [clients, selectedClientId]);

  // Form Fields
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [isSending, setIsSending] = useState(false);
  const [saveTemplatePrompt, setSaveTemplatePrompt] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  useEffect(() => {
    if (composerPreselectedLeads.length > 0) {
      setToRecipients(composerPreselectedLeads.map((l) => l.email));
      if (!subject && composerPreselectedLeads.length === 1) {
        const lead = composerPreselectedLeads[0];
        setSubject(`Regarding sales opportunity with ${lead.personId || "Lead"}`);
      }
    } else {
      setToRecipients([]);
    }
  }, [composerPreselectedLeads]);

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;

    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setSubject(tpl.subject);
      setBody(tpl.body);
    }
  };

  const handleInsertTag = (tag: string) => {
    setBody((prev) => prev + " " + tag);
  };

  const handleFormat = (type: "bold" | "italic" | "list" | "link") => {
    if (type === "bold") setBody((prev) => prev + " **bold text** ");
    if (type === "italic") setBody((prev) => prev + " *italicized text* ");
    if (type === "list") setBody((prev) => prev + "\n- Point 1\n- Point 2\n");
    if (type === "link") setBody((prev) => prev + " [link title](https://example.com) ");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: EmailAttachment[] = Array.from(files).map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const previewData = useMemo(() => {
    const primaryLead = composerPreselectedLeads[0] || {
      personId: "Alex Rivers",
      email: toRecipients[0] || "lead@example.com",
      company: "Acme Innovations",
      estimatedValue: 12500,
    };

    let renderedSubject = subject
      .replaceAll("{{lead_name}}", primaryLead.personId || "there")
      .replaceAll("{{person_id}}", primaryLead.personId || "there")
      .replaceAll("{{company}}", primaryLead.company || primaryLead.personId || "your organization")
      .replaceAll("{{email}}", primaryLead.email)
      .replaceAll(
        "{{estimated_value}}",
        primaryLead.estimatedValue
          ? `$${Number(primaryLead.estimatedValue).toLocaleString()}`
          : "N/A"
      )
      .replaceAll("{{sender_name}}", activeClient?.name || "Our Team");

    let renderedBody = body
      .replaceAll("{{lead_name}}", primaryLead.personId || "there")
      .replaceAll("{{person_id}}", primaryLead.personId || "there")
      .replaceAll("{{company}}", primaryLead.company || primaryLead.personId || "your organization")
      .replaceAll("{{email}}", primaryLead.email)
      .replaceAll(
        "{{estimated_value}}",
        primaryLead.estimatedValue
          ? `$${Number(primaryLead.estimatedValue).toLocaleString()}`
          : "your opportunity"
      )
      .replaceAll("{{sender_name}}", activeClient?.name || "Our Team");

    return {
      to: toRecipients.join(", ") || primaryLead.email,
      from: activeClient ? `${activeClient.name} <${activeClient.email}>` : "No SMTP account selected",
      subject: renderedSubject || "(No subject)",
      body: renderedBody,
      signature: activeClient?.signature || "",
    };
  }, [composerPreselectedLeads, toRecipients, subject, body, activeClient]);

  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim() || !body.trim()) return;

    dispatch(
      saveTemplate({
        name: newTemplateName.trim(),
        category: "custom",
        subject: subject.trim() || "Custom Template",
        body: body.trim(),
      })
    );

    setSaveTemplatePrompt(false);
    setNewTemplateName("");
    dispatch(
      addNotification({
        id: `tpl-saved-${Date.now()}`,
        category: "system",
        type: "system_alert",
        title: "Template Saved",
        message: `Template "${newTemplateName}" is now available for future outreach.`,
        time: "Just now",
        timestamp: Date.now(),
        unread: true,
        priority: "low",
      })
    );
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeClient) {
      dispatch(openClientModal());
      return;
    }

    if (toRecipients.length === 0 || !subject.trim() || !body.trim()) {
      return;
    }

    setIsSending(true);

    // Nodemailer sending simulation
    await new Promise((resolve) => setTimeout(resolve, 800));

    const leadsToSend =
      composerPreselectedLeads.length > 0
        ? composerPreselectedLeads
        : toRecipients.map((email) => ({
            id: `manual-${Date.now()}`,
            personId: email.split("@")[0],
            email,
          }));

    leadsToSend.forEach((lead) => {
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
          attachments,
          status: isScheduled ? "sent" : "delivered",
          scheduledFor: isScheduled ? `${scheduledDate} ${scheduledTime}` : undefined,
        })
      );
    });

    dispatch(
      addNotification({
        id: `email-sent-${Date.now()}`,
        category: "leads",
        type: "system_alert",
        title: isScheduled ? "Email Scheduled" : "Email Sent Successfully",
        message: isScheduled
          ? `Email scheduled for ${leadsToSend.length} recipient(s) on ${scheduledDate} at ${scheduledTime} via Nodemailer (${activeClient.email}).`
          : `Email sent to ${leadsToSend.length} recipient(s) via Nodemailer (${activeClient.email}).`,
        time: "Just now",
        timestamp: Date.now(),
        unread: true,
        priority: "high",
        actionLabel: "View Leads",
        actionUrl: "/dashboard/leads",
      })
    );

    setIsSending(false);
    dispatch(closeComposer());
  };

  if (!isComposerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#E5CB90] bg-white text-[#22303A] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5CB90]/70 px-6 py-4 bg-[#FFF3C8]/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#458393]/10 border border-[#458393]/20 text-[#458393]">
              <Mail size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#22303A] flex items-center gap-2">
                Send Email to Lead (Nodemailer SMTP)
                {composerPreselectedLeads.length > 1 && (
                  <span className="rounded-full bg-[#FFF3C8] border border-[#E5CB90] px-2.5 py-0.5 text-[11px] font-semibold text-[#458393]">
                    {composerPreselectedLeads.length} Leads (Bulk)
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#5C6D71]">
                Personalize with merge variables, templates, attachments, and live preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-[#E5CB90] bg-white p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === "compose"
                    ? "bg-[#458393] text-white shadow-sm"
                    : "text-[#5C6D71] hover:text-[#22303A]"
                }`}
              >
                <Edit3 size={13} />
                Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === "preview"
                    ? "bg-[#458393] text-white shadow-sm"
                    : "text-[#5C6D71] hover:text-[#22303A]"
                }`}
              >
                <Eye size={13} />
                Preview
              </button>
            </div>

            <button
              type="button"
              onClick={() => dispatch(closeComposer())}
              className="rounded-lg p-2 text-[#5C6D71] hover:bg-[#FFF3C8] hover:text-[#22303A] transition"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAFAF7]">
          {activeTab === "compose" ? (
            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* SENDER CLIENT SELECTION */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#E5CB90] bg-white p-3.5 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[#22303A] shrink-0">
                    From (SMTP Sender):
                  </span>

                  {clients.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#C1523F] font-semibold">
                        ⚠️ No SMTP account added
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

              {/* RECIPIENTS ROW */}
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

                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E5CB90] bg-[#FAFAF7] p-2 min-h-[42px]">
                  {toRecipients.map((rec, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#E5CB90] px-2.5 py-1 text-xs font-medium text-[#22303A]"
                    >
                      <Mail size={12} className="text-[#458393]" />
                      {rec}
                      <button
                        type="button"
                        onClick={() =>
                          setToRecipients((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-[#5C6D71] hover:text-[#C1523F] transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}

                  <input
                    type="email"
                    placeholder={toRecipients.length === 0 ? "Enter recipient email and press enter..." : "Add email..."}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !toRecipients.includes(val)) {
                          setToRecipients((prev) => [...prev, val]);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                    className="flex-1 min-w-[140px] bg-transparent text-xs text-[#22303A] outline-none placeholder:text-[#9A9A8F] px-2 font-medium"
                  />
                </div>
              </div>

              {/* CC & BCC */}
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

              {/* TEMPLATES & SUBJECT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-[#E5CB90]/70">
                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Email Template
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 pr-8 text-xs font-medium text-[#22303A] outline-none focus:border-[#458393]"
                    >
                      <option value="">-- Load a template --</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5C6D71]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Subject Line <span className="text-red-500">*</span>
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
              </div>

              {/* MERGE TAGS */}
              <div className="flex flex-wrap items-center gap-1.5 px-1">
                <span className="text-xs font-semibold text-[#5C6D71] mr-1 flex items-center gap-1">
                  <Sparkles size={13} className="text-[#C9A24A]" /> Insert Lead Variable:
                </span>
                {MERGE_TAGS.map(({ tag, label }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="inline-flex items-center rounded-lg border border-[#E5CB90] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#458393] hover:bg-[#FFF3C8]/50 transition shadow-2xs"
                    title={`Insert ${tag}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* BODY EDITOR & TOOLBAR */}
              <div className="rounded-2xl border border-[#E5CB90] bg-white overflow-hidden shadow-sm">
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-[#E5CB90]/60 px-3 py-2 bg-[#FFF3C8]/30">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleFormat("bold")}
                      className="rounded-lg p-1.5 text-[#5C6D71] hover:bg-white hover:text-[#22303A]"
                      title="Bold"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat("italic")}
                      className="rounded-lg p-1.5 text-[#5C6D71] hover:bg-white hover:text-[#22303A]"
                      title="Italic"
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat("list")}
                      className="rounded-lg p-1.5 text-[#5C6D71] hover:bg-white hover:text-[#22303A]"
                      title="Bullet List"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat("link")}
                      className="rounded-lg p-1.5 text-[#5C6D71] hover:bg-white hover:text-[#22303A]"
                      title="Insert Link"
                    >
                      <Link2 size={13} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSaveTemplatePrompt(true)}
                    className="text-xs font-semibold text-[#458393] hover:underline flex items-center gap-1"
                  >
                    <FileText size={12} /> Save Draft as Template
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  rows={8}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email body here. Use variables like {{lead_name}} for dynamic personalization..."
                  className="w-full bg-[#FAFAF7] p-4 text-xs leading-relaxed text-[#22303A] outline-none resize-y placeholder:text-[#9A9A8F] font-sans"
                />

                {/* Signature Preview */}
                {activeClient?.signature && (
                  <div className="border-t border-[#E5CB90]/60 px-4 py-2.5 bg-white text-xs text-[#5C6D71]">
                    <p className="font-semibold text-[#22303A] mb-0.5">Attached Signature:</p>
                    <pre className="whitespace-pre-wrap font-sans text-xs text-[#5C6D71]">
                      {activeClient.signature}
                    </pre>
                  </div>
                )}
              </div>

              {/* SAVE TEMPLATE PROMPT */}
              {saveTemplatePrompt && (
                <div className="rounded-2xl border border-[#458393]/40 bg-[#458393]/10 p-3.5 space-y-2">
                  <p className="text-xs font-semibold text-[#22303A]">
                    Save current message as a reusable template
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Template name (e.g. Sales Intro)"
                      className="flex-1 rounded-xl border border-[#E5CB90] bg-white px-3 py-1.5 text-xs text-[#22303A] outline-none focus:border-[#458393]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveAsTemplate}
                      className="rounded-xl bg-[#458393] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#346a78]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaveTemplatePrompt(false)}
                      className="rounded-xl border border-[#E5E5E0] bg-white px-3 py-1.5 text-xs font-medium text-[#5C6D71]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ATTACHMENTS & SCHEDULING */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* File Attachment */}
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-[#E5CB90] bg-white px-3.5 py-2 text-xs font-semibold text-[#22303A] hover:bg-[#FFF3C8]/50 transition shadow-2xs">
                    <Paperclip size={14} className="text-[#458393]" />
                    Attach File
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {attachments.map((att) => (
                        <span
                          key={att.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#E5CB90] px-2.5 py-1 text-xs text-[#22303A]"
                        >
                          <span className="max-w-[120px] truncate font-medium">{att.name}</span>
                          <span className="text-[10px] text-[#5C6D71]">
                            ({Math.round(att.size / 1024)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-[#5C6D71] hover:text-[#C1523F] ml-1"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduling */}
                <button
                  type="button"
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                    isScheduled
                      ? "border-[#C9A24A] bg-[#FFF3C8] text-[#7A5B1A]"
                      : "border-[#E5CB90] bg-white text-[#22303A] hover:bg-[#FFF3C8]/40"
                  }`}
                >
                  <Clock size={14} className="text-[#C9A24A]" />
                  {isScheduled ? "Scheduled Send" : "Schedule for Later"}
                </button>
              </div>

              {/* SCHEDULE DATE/TIME */}
              {isScheduled && (
                <div className="flex items-center gap-3 rounded-2xl border border-[#C9A24A]/40 bg-[#FFF3C8]/50 p-3">
                  <Calendar size={16} className="text-[#C9A24A] shrink-0" />
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <input
                      type="date"
                      required={isScheduled}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="rounded-xl border border-[#E5CB90] bg-white px-3 py-1 text-xs text-[#22303A] outline-none focus:border-[#458393]"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="rounded-xl border border-[#E5CB90] bg-white px-3 py-1 text-xs text-[#22303A] outline-none focus:border-[#458393]"
                    />
                    <span className="text-xs text-[#5C6D71]">
                      Emails will be automatically queued and dispatched via Nodemailer.
                    </span>
                  </div>
                </div>
              )}

              {/* ACTIONS FOOTER */}
              <div className="flex items-center justify-between border-t border-[#E5CB90]/70 pt-4">
                <button
                  type="button"
                  onClick={() => dispatch(closeComposer())}
                  className="rounded-xl border border-[#E5E5E0] bg-white px-4 py-2 text-xs font-medium text-[#5C6D71] hover:bg-[#F7F7F2]"
                >
                  Discard Draft
                </button>

                <button
                  type="submit"
                  disabled={isSending || toRecipients.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#458393] px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition active:scale-95 disabled:opacity-50"
                >
                  <Send size={14} className={isSending ? "animate-pulse" : ""} />
                  {isSending
                    ? "Sending via Nodemailer..."
                    : isScheduled
                    ? "Schedule Email"
                    : `Send Email to ${toRecipients.length} Lead${
                        toRecipients.length > 1 ? "s" : ""
                      }`}
                </button>
              </div>
            </form>
          ) : (
            /* PREVIEW TAB */
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E5CB90] bg-white p-5 space-y-4 shadow-sm">
                <div className="space-y-2 border-b border-[#E5E5E0] pb-4">
                  <div className="flex items-center text-xs">
                    <span className="w-16 font-semibold text-[#5C6D71]">From:</span>
                    <span className="text-[#22303A] font-mono font-medium">{previewData.from}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-16 font-semibold text-[#5C6D71]">To:</span>
                    <span className="text-[#458393] font-mono font-medium">{previewData.to}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-16 font-semibold text-[#5C6D71]">Subject:</span>
                    <span className="text-[#22303A] font-semibold">{previewData.subject}</span>
                  </div>
                </div>

                {/* Rendered Email Preview */}
                <div className="rounded-xl bg-[#FAFAF7] border border-[#E5E5E0] text-[#22303A] p-5 min-h-[200px]">
                  <div className="whitespace-pre-wrap text-xs leading-relaxed font-sans">
                    {previewData.body || "No email content written yet."}
                  </div>

                  {previewData.signature && (
                    <div className="mt-5 pt-4 border-t border-[#E5E5E0] whitespace-pre-wrap text-xs text-[#5C6D71] font-sans">
                      {previewData.signature}
                    </div>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="rounded-xl border border-[#E5CB90] bg-[#FFF3C8]/40 p-3 text-xs text-[#5C6D71]">
                    <p className="font-semibold text-[#22303A] mb-1">
                      Attachments ({attachments.length}):
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {attachments.map((att) => (
                        <span
                          key={att.id}
                          className="rounded-lg bg-white border border-[#E5CB90] px-2.5 py-1 text-xs text-[#22303A]"
                        >
                          📎 {att.name} ({Math.round(att.size / 1024)} KB)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("compose")}
                  className="rounded-xl border border-[#E5CB90] bg-white px-4 py-2 text-xs font-semibold text-[#22303A] hover:bg-[#FFF3C8]/40"
                >
                  ← Back to Compose
                </button>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSending || toRecipients.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#458393] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#346a78] shadow"
                >
                  <Send size={14} /> Send Now
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
