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
  User,
  Mail,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Bold,
  Italic,
  List,
  Link2,
  Calendar,
  Layers,
  ArrowRight,
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
  { tag: "{{lead_name}}", label: "Lead Name / ID" },
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

  // Initialize recipients from preselected leads
  useEffect(() => {
    if (composerPreselectedLeads.length > 0) {
      setToRecipients(composerPreselectedLeads.map((l) => l.email));
      if (!subject && composerPreselectedLeads.length === 1) {
        const lead = composerPreselectedLeads[0];
        setSubject(`Regarding partnership with ${lead.personId || "Lead"}`);
      }
    } else {
      setToRecipients([]);
    }
  }, [composerPreselectedLeads]);

  // Handle template switch
  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;

    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setSubject(tpl.subject);
      setBody(tpl.body);
    }
  };

  // Insert merge tag into body or subject
  const handleInsertTag = (tag: string) => {
    setBody((prev) => prev + " " + tag);
  };

  // Formatting helpers
  const handleFormat = (type: "bold" | "italic" | "list" | "link") => {
    if (type === "bold") setBody((prev) => prev + " **bold text** ");
    if (type === "italic") setBody((prev) => prev + " *italicized text* ");
    if (type === "list") setBody((prev) => prev + "\n- Point 1\n- Point 2\n");
    if (type === "link") setBody((prev) => prev + " [link title](https://example.com) ");
  };

  // File upload simulation
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

  // Compute rendered preview for the first lead
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
      from: activeClient ? `${activeClient.name} <${activeClient.email}>` : "No client configured",
      subject: renderedSubject || "(No subject)",
      body: renderedBody,
      signature: activeClient?.signature || "",
    };
  }, [composerPreselectedLeads, toRecipients, subject, body, activeClient]);

  // Save new template
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
        type: "system",
        title: "Template Saved",
        message: `Template "${newTemplateName}" is now available for future outreach.`,
        time: "Just now",
        timestamp: Date.now(),
        unread: true,
        priority: "low",
      })
    );
  };

  // Send Email Action
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

    // Simulate network latency / delivery processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Log sent emails for each recipient
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

    // Notify User
    dispatch(
      addNotification({
        id: `email-sent-${Date.now()}`,
        category: "leads",
        type: "system",
        title: isScheduled ? "Email Scheduled" : "Email Sent Successfully",
        message: isScheduled
          ? `Email scheduled for ${leadsToSend.length} recipient(s) on ${scheduledDate} at ${scheduledTime} using ${activeClient.email}.`
          : `Email sent to ${leadsToSend.length} recipient(s) via ${activeClient.email} (${activeClient.name}).`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.22 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#263248] bg-[#111827] text-white shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#263248] px-5 py-3.5 bg-[#0D1421]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Send size={17} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Send Email to Lead
                {composerPreselectedLeads.length > 1 && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-medium text-blue-400 border border-blue-500/30">
                    {composerPreselectedLeads.length} Leads (Bulk)
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Compose with personalization tags, reusable templates, and custom sender client
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch between Compose and Preview */}
            <div className="flex rounded-lg border border-[#263248] bg-[#0A101C] p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
                  activeTab === "compose"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Edit3 size={13} />
                Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition ${
                  activeTab === "preview"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye size={13} />
                Preview
              </button>
            </div>

            <button
              type="button"
              onClick={() => dispatch(closeComposer())}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#263248] hover:text-white transition"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "compose" ? (
            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* SENDER CLIENT SELECTION BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-300 shrink-0">
                    From (Sending Client):
                  </span>

                  {clients.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400 font-medium">
                        ⚠️ No sender client configured
                      </span>
                      <button
                        type="button"
                        onClick={() => dispatch(openClientModal())}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500"
                      >
                        <Plus size={12} /> Add Client Now
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex-1 min-w-[220px]">
                      <select
                        value={activeClient?.id || ""}
                        onChange={(e) => dispatch(setSelectedClientId(e.target.value))}
                        className="w-full appearance-none rounded-lg border border-[#263248] bg-[#0D1421] px-3 py-1.5 pr-8 text-xs font-medium text-white outline-none focus:border-blue-500"
                      >
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email}) {c.isDefault ? "★ Default" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => dispatch(openClientModal())}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0D1421] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <Plus size={13} />
                    Manage Clients ({clients.length})
                  </button>
                </div>
              </div>

              {/* RECIPIENTS ROW */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    To (Recipient Leads) <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(!showCcBcc)}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    {showCcBcc ? "Hide CC/BCC" : "+ Add CC / BCC"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#263248] bg-[#0D1421] p-2 min-h-[42px]">
                  {toRecipients.map((rec, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-white"
                    >
                      <Mail size={12} className="text-blue-400" />
                      {rec}
                      <button
                        type="button"
                        onClick={() =>
                          setToRecipients((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-slate-400 hover:text-red-400 transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}

                  <input
                    type="email"
                    placeholder={toRecipients.length === 0 ? "Enter recipient email and press enter..." : "Add more..."}
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
                    className="flex-1 min-w-[140px] bg-transparent text-xs text-white outline-none placeholder:text-slate-500 px-2"
                  />
                </div>
              </div>

              {/* CC & BCC FIELDS */}
              {showCcBcc && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">CC Email</label>
                    <input
                      type="email"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="manager@yourcompany.com"
                      className="w-full rounded-xl border border-[#263248] bg-[#0D1421] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">BCC Email</label>
                    <input
                      type="email"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="archive@yourcompany.com"
                      className="w-full rounded-xl border border-[#263248] bg-[#0D1421] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* TEMPLATES & SUBJECT ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Load Email Template
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#263248] bg-[#0D1421] px-3 py-2 pr-8 text-xs text-slate-200 outline-none focus:border-blue-500"
                    >
                      <option value="">-- Select a template --</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Subject Line <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Next steps regarding our collaboration"
                    className="w-full rounded-xl border border-[#263248] bg-[#0D1421] px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* MERGE TAGS QUICK INSERTER */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-400" /> Insert Variable:
                </span>
                {MERGE_TAGS.map(({ tag, label }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono text-blue-300 hover:border-blue-500 hover:bg-blue-500/10 transition"
                    title={`Click to insert ${tag}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* BODY EDITOR & TOOLBAR */}
              <div className="rounded-xl border border-[#263248] bg-[#0D1421] overflow-hidden">
                {/* Editor Toolbar */}
                <div className="flex items-center justify-between border-b border-[#263248] px-3 py-1.5 bg-[#0A101C]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleFormat("bold")}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Bold"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat("italic")}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Italic"
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat("list")}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Bullet List"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormat("link")}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Insert Link"
                    >
                      <Link2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSaveTemplatePrompt(true)}
                      className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1 transition"
                    >
                      <FileText size={12} /> Save Draft as Template
                    </button>
                  </div>
                </div>

                {/* Body Textarea */}
                <textarea
                  rows={8}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email body here. Use variables like {{lead_name}} for dynamic personalization..."
                  className="w-full bg-transparent p-3.5 text-xs leading-relaxed text-slate-200 outline-none resize-y placeholder:text-slate-600 font-sans"
                />

                {/* Signature Preview strip */}
                {activeClient?.signature && (
                  <div className="border-t border-[#263248] px-3.5 py-2 bg-[#090E17] text-[11px] text-slate-500 font-mono">
                    <p className="font-semibold text-slate-400">Attached Signature:</p>
                    <pre className="whitespace-pre-wrap font-sans text-slate-400 mt-0.5">
                      {activeClient.signature}
                    </pre>
                  </div>
                )}
              </div>

              {/* SAVE TEMPLATE PROMPT MODAL / POPOVER */}
              {saveTemplatePrompt && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3.5 space-y-2">
                  <p className="text-xs font-semibold text-white">
                    Save this message as a reusable template
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Template title (e.g. Q4 Sales Pitch)"
                      className="flex-1 rounded-lg border border-[#263248] bg-[#0D1421] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveAsTemplate}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaveTemplatePrompt(false)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ATTACHMENTS & SCHEDULING ROW */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* Attachments */}
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition">
                    <Paperclip size={14} />
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
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] text-slate-200"
                        >
                          <span className="max-w-[120px] truncate">{att.name}</span>
                          <span className="text-[10px] text-slate-400">
                            ({Math.round(att.size / 1024)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-slate-400 hover:text-red-400 ml-1"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduling Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScheduled(!isScheduled)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      isScheduled
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Clock size={14} />
                    {isScheduled ? "Scheduled Send" : "Schedule for Later"}
                  </button>
                </div>
              </div>

              {/* SCHEDULE PICKER */}
              {isScheduled && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <Calendar size={16} className="text-amber-400 shrink-0" />
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <input
                      type="date"
                      required={isScheduled}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="rounded-lg border border-[#263248] bg-[#0D1421] px-3 py-1 text-xs text-white outline-none focus:border-amber-500"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="rounded-lg border border-[#263248] bg-[#0D1421] px-3 py-1 text-xs text-white outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-slate-400">
                      The email will be sent automatically at the chosen time.
                    </span>
                  </div>
                </div>
              )}

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-between border-t border-[#263248] pt-4">
                <button
                  type="button"
                  onClick={() => dispatch(closeComposer())}
                  className="rounded-xl border border-[#263248] px-4 py-2 text-xs font-medium text-slate-400 hover:bg-[#263248] hover:text-white transition"
                >
                  Discard Draft
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSending || toRecipients.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} className={isSending ? "animate-pulse" : ""} />
                    {isSending
                      ? "Sending Email..."
                      : isScheduled
                      ? "Schedule Email"
                      : `Send Email to ${toRecipients.length} Lead${
                          toRecipients.length > 1 ? "s" : ""
                        }`}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* PREVIEW TAB */
            <div className="space-y-4">
              <div className="rounded-xl border border-[#263248] bg-[#0D1421] p-5 space-y-4">
                <div className="space-y-2 border-b border-[#263248] pb-4">
                  <div className="flex items-center text-xs">
                    <span className="w-16 font-semibold text-slate-400">From:</span>
                    <span className="text-slate-200 font-mono">{previewData.from}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-16 font-semibold text-slate-400">To:</span>
                    <span className="text-blue-400 font-mono">{previewData.to}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-16 font-semibold text-slate-400">Subject:</span>
                    <span className="text-white font-medium">{previewData.subject}</span>
                  </div>
                </div>

                {/* Rendered Email Card */}
                <div className="rounded-xl bg-white text-[#22303A] p-6 shadow-md min-h-[220px]">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                    {previewData.body || "No email content written yet."}
                  </div>

                  {previewData.signature && (
                    <div className="mt-6 pt-4 border-t border-slate-200 whitespace-pre-wrap text-xs text-slate-600 font-sans">
                      {previewData.signature}
                    </div>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-[#0A101C] p-3 text-xs text-slate-400">
                    <p className="font-semibold text-slate-300 mb-1">
                      Attachments ({attachments.length}):
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {attachments.map((att) => (
                        <span
                          key={att.id}
                          className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] text-slate-200"
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
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  ← Back to Compose
                </button>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSending || toRecipients.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow"
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
