"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import { useAppDispatch } from "@/app/redux/hooks";
import { openComposerWithDraft } from "@/app/redux/emailClients";
import {
  Sparkles,
  ArrowLeft,
  Mail,
  Wand2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Send,
  AtSign,
  Target,
  ListChecks,
  Clock,
  Trash2,
  Bold,
  Building2,
  Tag,
  PersonStanding,
  Banknote,
  StickyNote,
} from "lucide-react";

interface ToneOption {
  label: string;
  value: string;
}

const TONES: ToneOption[] = [
  { label: "Professional", value: "professional but warm" },
  { label: "Friendly", value: "friendly" },
  { label: "Persuasive", value: "persuasive" },
  { label: "Formal", value: "formal" },
  { label: "Casual", value: "casual" },
  { label: "Enthusiastic", value: "enthusiastic" },
];

const STATUS_OPTIONS = ["", "new", "contacted", "qualified", "proposal", "won", "lost"];

const SOURCE_OPTIONS = ["", "website", "referral", "ad", "cold_call", "other"];

const LEAD_STATUSES: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const LEAD_SOURCES: Record<string, string> = {
  website: "Website",
  referral: "Referral",
  ad: "Ad",
  cold_call: "Cold Call",
  other: "Other",
};

interface GenerateResponse {
  success?: boolean;
  subject?: string;
  body?: string;
  response?: string;
  error?: string;
  detail?: string;
}

const API_ENDPOINT = "/api/Email/AIGenerate";

const inputClass =
  "w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3.5 py-2.5 text-sm text-[#22303A] outline-none focus:border-[#458393] focus:bg-white placeholder:text-[#9A9A8F] transition-colors";

const parseAIResult = (raw: string): { subject: string; body: string } => {
  const cleaned = raw.trim();
  const subjectMatch = cleaned.match(/^SUBJECT:\s*(.+)$/im);
  const bodyStart = cleaned.search(/\n(?:BODY|MESSAGE):/i);

  if (subjectMatch) {
    const subject = subjectMatch[1].trim();
    const body =
      bodyStart >= 0
        ? cleaned.slice(bodyStart).replace(/^(BODY|MESSAGE):/i, "").trim()
        : cleaned;
    return { subject, body };
  }

  const firstLineBreak = cleaned.indexOf("\n");
  if (firstLineBreak > 0 && firstLineBreak < 160) {
    return {
      subject: cleaned.slice(0, firstLineBreak).trim(),
      body: cleaned.slice(firstLineBreak).trim(),
    };
  }

  return { subject: "", body: cleaned };
};

const extractGenerated = (
  data: GenerateResponse
): { subject: string; body: string } => {
  if (typeof data.subject === "string" && typeof data.body === "string") {
    return { subject: data.subject, body: data.body };
  }

  if (typeof data.response === "string" && data.response.trim()) {
    return parseAIResult(data.response);
  }

  throw new Error("The AI service returned an empty response.");
};

export default function EmailAIComposer() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTo = searchParams.get("to") || "";
  const initialBody = searchParams.get("body") || "";
  const initialSender = searchParams.get("sender") || "";
  const initialValue = searchParams.get("value") || "";
  const leadsParam = searchParams.get("leads") || "";

  const [to, setTo] = useState(initialTo);
  const [leadName, setLeadName] = useState("");
  const [senderName, setSenderName] = useState(initialSender);
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [estimatedValue, setEstimatedValue] = useState(initialValue);
  const [notes, setNotes] = useState("");
  const [goal, setGoal] = useState(initialBody);
  const [tone, setTone] = useState<string>("professional but warm");
  const [keyPoints, setKeyPoints] = useState("");
  const [lengthHint, setLengthHint] = useState("concise, medium");

  const [subject, setSubject] = useState("");
  const [generatedBody, setGeneratedBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  useEffect(() => {
    if (leadsParam) {
      const leadList = leadsParam.split(",").map((entry) => {
        const [name, email] = entry.split(":");
        return { name: name || "Lead", email: email || "" };
      });
      if (leadList.length > 0) {
        setTo(leadList.map((lead) => lead.email).filter(Boolean).join(", "));
        if (leadList.length === 1 && !leadName) {
          setLeadName(leadList[0].name);
        }
      }
    }
  }, [leadsParam, leadName]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const leadEmail = to.split(",").map((v) => v.trim()).filter(Boolean)[0] || "";
    const resolvedName = leadName.trim() || leadEmail.split("@")[0] || "Lead";

    if (!leadEmail) {
      setError("Add the lead's email address.");
      return;
    }

    if (!goal.trim()) {
      setError("Describe what the email should be about.");
      return;
    }

    setIsGenerating(true);

    const extraInstructions = [
      keyPoints.trim() ? `Key points to include:\n${keyPoints.trim()}` : "",
      lengthHint.trim() ? `Expected length: ${lengthHint.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const payload = {
      lead_name: resolvedName,
      lead_email: leadEmail,
      company: company.trim() || null,
      status: status.trim() || null,
      source: source.trim() || null,
      estimated_value:
        estimatedValue.trim() !== "" &&
        !Number.isNaN(Number(estimatedValue))
          ? Number(estimatedValue)
          : null,
      notes: notes.trim() || null,
      goal: goal.trim(),
      tone: tone.trim() || "professional but warm",
      sender_name: senderName.trim() || null,
      extra_instructions: extraInstructions.trim() || null,
    };

    try {
      const { data } = await axios.post<GenerateResponse>(API_ENDPOINT, payload);

      if (data.error) {
        throw new Error(data.detail || data.error);
      }

      const parsed = extractGenerated(data);
      setSubject(parsed.subject);
      setGeneratedBody(parsed.body);
    } catch (err: unknown) {
      let message = "Something went wrong. Please try again.";
      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          "The AI service is unavailable. Please try again.";
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyGenerated = () => {
    const leadList = leadsParam
      .split(",")
      .map((entry) => {
        const [name, email] = entry.split(":");
        return { name: name || "Lead", email: email || "" };
      })
      .filter((lead) => lead.email)
      .map((lead, index) => ({
        id: `ai-lead-${Date.now()}-${index}`,
        personId: lead.name,
        email: lead.email,
        estimatedValue:
          estimatedValue.trim() !== "" &&
          !Number.isNaN(Number(estimatedValue))
            ? Number(estimatedValue)
            : undefined,
      }));

    const fallbackLeads =
      leadList.length > 0
        ? leadList
        : [
            {
              id: `ai-lead-${Date.now()}`,
              personId: leadName.trim() || "Lead",
              email: to.split(",").map((v) => v.trim()).filter(Boolean)[0] || "",
              estimatedValue:
                estimatedValue.trim() !== "" &&
                !Number.isNaN(Number(estimatedValue))
                  ? Number(estimatedValue)
                  : undefined,
            },
          ];

    dispatch(
      openComposerWithDraft({
        leads: fallbackLeads,
        draft: {
          subject,
          body: generatedBody,
        },
      })
    );

    router.push("/dashboard/leads");
  };

  const copyText = async (text: string, target: "subject" | "body") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(target);
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  };

  const handleClear = () => {
    setGoal("");
    setKeyPoints("");
    setNotes("");
    setLengthHint("concise, medium");
    setSubject("");
    setGeneratedBody("");
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[#FFF3C8] text-[#22303A]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5CB90] bg-white px-3 py-2 text-xs font-semibold text-[#22303A] shadow-sm hover:bg-[#FFF3C8]/60 hover:border-[#458393] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Leads
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#C9A24A]/40 bg-[#FFF8E0] text-[#C9A24A]">
              <Wand2 size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#22303A] flex items-center gap-2">
                Compose Email with AI
              </h1>
              <p className="text-xs text-[#5C6D71]">
                Describe the email and let AI draft the perfect message for your leads.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E5CB90] bg-white px-3 py-1 text-[11px] font-semibold text-[#458393]">
            <Sparkles size={12} />
            AI Powered Draft
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleGenerate}
              className="space-y-4 rounded-2xl border border-[#E5CB90] bg-white p-5 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-[#22303A] flex items-center gap-2">
                <AtSign size={15} className="text-[#458393]" />
                Define Your Email
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#5C6D71]">
                    Lead name <span className="text-[#C1523F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Sarah Mitchell"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#5C6D71]">
                    Lead email <span className="text-[#C1523F]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="lead@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#5C6D71] flex items-center gap-1">
                    <Building2 size={12} className="text-[#458393]" />
                    Company <span className="text-[#9A9A8F]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#5C6D71] flex items-center gap-1">
                    <PersonStanding size={12} className="text-[#458393]" />
                    Sender name <span className="text-[#9A9A8F]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Alex Turner"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#5C6D71] flex items-center gap-1">
                    <Tag size={12} className="text-[#458393]" />
                    Status <span className="text-[#9A9A8F]">(optional)</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s || "none"} value={s}>
                        {s ? (LEAD_STATUSES[s] || s) : "Select status"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#5C6D71] flex items-center gap-1">
                    <Tag size={12} className="text-[#458393]" />
                    Source <span className="text-[#9A9A8F]">(optional)</span>
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className={inputClass}
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s || "none"} value={s}>
                        {s ? (LEAD_SOURCES[s] || s) : "Select source"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5C6D71] flex items-center gap-1">
                  <Banknote size={12} className="text-[#458393]" />
                  Estimated value <span className="text-[#9A9A8F]">(optional, USD)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="e.g. 25000"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5C6D71] flex items-center gap-1">
                  <StickyNote size={12} className="text-[#458393]" />
                  Context / notes <span className="text-[#9A9A8F]">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Met at the trade show, interested in the CRM"
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5C6D71] flex items-center gap-1">
                  <Target size={12} className="text-[#458393]" />
                  What is the email about? <span className="text-[#C1523F]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Introduce LeadWise CRM, share our ROI stats, and ask for a 15-minute demo call"
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5C6D71]">Tone</label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        tone === t.value
                          ? "border-[#458393] bg-[#458393] text-white"
                          : "border-[#E5CB90] bg-[#FAFAF7] text-[#5C6D71] hover:bg-[#FFF3C8]/60"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5C6D71] flex items-center gap-1">
                  <ListChecks size={12} className="text-[#458393]" />
                  Key points to include <span className="text-[#9A9A8F]">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="e.g. Free onboarding, 30% higher conversion, personalized follow-ups"
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#5C6D71] flex items-center gap-1">
                  <Clock size={12} className="text-[#458393]" />
                  Expected length <span className="text-[#9A9A8F]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={lengthHint}
                  onChange={(e) => setLengthHint(e.target.value)}
                  placeholder="e.g. short, concise; or 3-4 paragraphs"
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-[#C1523F]/30 bg-[#C1523F]/10 p-3 text-xs text-[#C1523F]">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#458393] px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={14} />
                      Generate with AI
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center rounded-xl border border-[#E5E5E0] bg-white px-3.5 py-2.5 text-xs font-medium text-[#5C6D71] hover:bg-[#F7F7F2] transition disabled:opacity-50"
                  aria-label="Clear draft"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* Right: Result */}
          <div className="lg:col-span-3">
            <div className="flex h-full flex-col rounded-2xl border border-[#E5CB90] bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#E5CB90]/70 px-5 py-4 bg-[#FFF3C8]/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#458393]/10 border border-[#458393]/20 text-[#458393]">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#22303A]">Generated Email</h2>
                    <p className="text-xs text-[#5C6D71]">Review, edit, and use your AI draft</p>
                  </div>
                </div>

                {generatedBody && (
                  <button
                    type="button"
                    onClick={handleApplyGenerated}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition active:scale-95"
                  >
                    <Send size={13} />
                    Use in Composer
                  </button>
                )}
              </div>

              {isGenerating ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">
                  <div className="relative">
                    <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-[#E5CB90] border-t-[#458393]" />
                    <Sparkles className="absolute inset-0 m-auto h-6 w-6 animate-pulse text-[#C9A24A]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#22303A]">Crafting your email…</p>
                    <p className="text-xs text-[#5C6D71] mt-1">Tuning tone, structure, and copy. One moment.</p>
                  </div>
                </div>
              ) : generatedBody ? (
                <div className="flex flex-1 flex-col space-y-4 p-5">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#22303A] flex items-center gap-1">
                        <Bold size={12} className="text-[#458393]" />
                        Subject Line
                      </label>
                      <button
                        type="button"
                        onClick={() => copyText(subject, "subject")}
                        disabled={!subject}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5CB90] bg-[#FAFAF7] px-2.5 py-1 text-[11px] font-semibold text-[#458393] hover:bg-[#FFF3C8]/60 transition disabled:opacity-50"
                      >
                        {copied === "subject" ? <Check size={11} /> : <Copy size={11} />}
                        {copied === "subject" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#22303A] flex items-center gap-1">
                        <Mail size={12} className="text-[#458393]" />
                        Email Body
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => copyText(generatedBody, "body")}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E5CB90] bg-[#FAFAF7] px-2.5 py-1 text-[11px] font-semibold text-[#458393] hover:bg-[#FFF3C8]/60 transition"
                        >
                          {copied === "body" ? <Check size={11} /> : <Copy size={11} />}
                          {copied === "body" ? "Copied" : "Copy"}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyText(`${subject}\n\n${generatedBody}`, "body")}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E5CB90] bg-[#FAFAF7] px-2.5 py-1 text-[11px] font-semibold text-[#458393] hover:bg-[#FFF3C8]/60 transition"
                        >
                          <Copy size={11} />
                          Copy All
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={16}
                      value={generatedBody}
                      onChange={(e) => setGeneratedBody(e.target.value)}
                      className={`${inputClass} flex-1 resize-y font-sans leading-relaxed bg-[#FFFDF8]`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGeneratedBody("")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E0] bg-white px-4 py-2 text-xs font-medium text-[#5C6D71] hover:bg-[#F7F7F2] transition"
                    >
                      <Trash2 size={13} />
                      Discard Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyGenerated}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-5 py-2 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition active:scale-95"
                    >
                      <Send size={13} />
                      Use in Email Composer
                    </button>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF8E0] border border-[#E5CB90] text-[#C9A24A]">
                    <Wand2 size={28} />
                  </div>
                  <p className="text-sm font-semibold text-[#22303A]">No email generated yet</p>
                  <p className="max-w-sm text-xs leading-relaxed text-[#5C6D71]">
                    Describe what you want to say in the form, pick a tone and length, then hit{" "}
                    <span className="font-semibold text-[#458393]">Generate with AI</span> to see a
                    ready-to-send draft here.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}