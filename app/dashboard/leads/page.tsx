"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  Flame,
  Users,
  TrendingUp,
  CircleDollarSign,
  RefreshCw,
  Download,
  Mail,
  Server,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useAppDispatch } from "@/app/redux/hooks";
import { setAllLeads } from "@/app/redux/leads";
import { openComposer, openClientModal } from "@/app/redux/emailClients";
import EmailComposerModal from "@/app/components/Dashboard/Email/EmailComposerModal";
import  EmailClientsModal from "@/app/components/Dashboard/Email/EmailClientsModal";

/* =========================================================
   TYPES
========================================================= */

type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

type LeadPriority = "low" | "medium" | "high";

type LeadSource =
  | "website"
  | "referral"
  | "ad"
  | "cold_call"
  | "other";

interface Lead {
  _id: string;
  id?: string;
  name?: string;
  personId: string;
  email: string;
  assignedTo?: string;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  estimatedValue?: number;
  lastContactedAt?: string;
  createdAt: string;
}

interface LeadsResponse {
  message?: string;
  data?: Lead[];
  success?: boolean;
}

/* =========================================================
   LIGHT WEBSITE STYLES & STATUS CONFIG
========================================================= */

const statusStyles: Record<LeadStatus, string> = {
  new: "bg-[#E9ECEE] text-[#3D4D51] border border-[#D5DADC]",
  contacted: "bg-[#DCE9EC] text-[#2E5B65] border border-[#BFD6DC]",
  qualified: "bg-[#458393] text-white border border-[#346a78]",
  proposal: "bg-[#C9A24A] text-white border border-[#B08D3D]",
  won: "bg-[#3C8F6B] text-white border border-[#307557]",
  lost: "bg-[#C1523F] text-white border border-[#A64332]",
};

const priorityStyles: Record<LeadPriority, string> = {
  low: "text-[#5C6D71]",
  medium: "text-[#C9A24A] font-semibold",
  high: "text-[#C1523F] font-semibold",
};

const priorityDotStyles: Record<LeadPriority, string> = {
  low: "bg-[#9A9A8F]",
  medium: "bg-[#C9A24A]",
  high: "bg-[#C1523F]",
};

/* =========================================================
   HELPERS
========================================================= */

const formatLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatSource = (value?: string): string => {
  if (!value) return "Unknown";
  return value.replaceAll("_", " ");
};

const formatCurrency = (value?: number): string => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (
  value?: string,
  fallback = "Never contacted"
): string => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name?: string): string => {
  if (!name?.trim()) return "LD";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

/* =========================================================
   LEADS PAGE
========================================================= */

export default function LeadsPage() {
  const dispatch = useAppDispatch();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  /* FETCH LEADS */
  const getLeads = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get<LeadsResponse>(
        "/api/dashboardapi/Leads/AllLead",
        {
          withCredentials: true,
        }
      );

      const apiLeads = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setLeads(apiLeads);
      dispatch(setAllLeads(apiLeads));
    } catch (err) {
      setLeads([]);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Unable to load leads. Please try again."
        );
      } else {
        setError("Unable to load leads. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void getLeads();
  }, []);

  /* FILTERED LEADS */
  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        lead.personId?.toLowerCase().includes(query) ||
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.source?.toLowerCase().includes(query) ||
        lead.assignedTo?.toLowerCase().includes(query) ||
        lead.status?.toLowerCase().includes(query) ||
        lead.priority?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || lead.priority === priorityFilter;

      const matchesSource =
        sourceFilter === "all" || lead.source === sourceFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesSource
      );
    });
  }, [
    leads,
    search,
    statusFilter,
    priorityFilter,
    sourceFilter,
  ]);

  /* STATISTICS */
  const highPriorityLeads = useMemo(() => {
    return leads.filter((lead) => lead.priority === "high").length;
  }, [leads]);

  const qualifiedLeads = useMemo(() => {
    return leads.filter((lead) => lead.status === "qualified").length;
  }, [leads]);

  const totalValue = useMemo(() => {
    return leads.reduce(
      (sum, lead) => sum + (Number(lead.estimatedValue) || 0),
      0
    );
  }, [leads]);

  /* SELECTION */
  const toggleSelectLead = (id: string): void => {
    setSelectedLeads((previous) => {
      if (previous.includes(id)) {
        return previous.filter((leadId) => leadId !== id);
      }
      return [...previous, id];
    });
  };

  const toggleSelectAll = (): void => {
    if (filteredLeads.length === 0) return;

    const filteredIds = filteredLeads.map((lead) => lead._id);
    const allSelected = filteredIds.every((id) =>
      selectedLeads.includes(id)
    );

    if (allSelected) {
      setSelectedLeads((previous) =>
        previous.filter((id) => !filteredIds.includes(id))
      );
      return;
    }

    setSelectedLeads((previous) => [
      ...new Set([...previous, ...filteredIds]),
    ]);
  };

  const clearFilters = (): void => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSourceFilter("all");
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    sourceFilter !== "all";

  /* EXPORT CSV */
  const handleExportCSV = (): void => {
    const list = filteredLeads.length > 0 ? filteredLeads : leads;
    if (list.length === 0) return;

    const headers = [
      "Lead ID",
      "Email",
      "Assigned To",
      "Status",
      "Priority",
      "Source",
      "Estimated Value",
      "Created At",
    ];
    const rows = list.map((lead) => [
      `"${lead.personId || lead.name || lead._id || ""}"`,
      `"${lead.email || ""}"`,
      `"${lead.assignedTo || ""}"`,
      `"${lead.status || ""}"`,
      `"${lead.priority || ""}"`,
      `"${lead.source || ""}"`,
      lead.estimatedValue ?? 0,
      `"${lead.createdAt ? new Date(lead.createdAt).toISOString().split("T")[0] : ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `leads_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-[#FFF3C8] text-[#22303A]">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10">

        {/* ================= PAGE HEADER ================= */}
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-[#22303A] sm:text-3xl">
                  Leads
                </h1>

                <span className="rounded-full border border-[#E5CB90] bg-white px-3 py-0.5 text-xs font-semibold text-[#458393] shadow-xs">
                  {leads.length} total leads
                </span>
              </div>

              <p className="mt-1 max-w-xl text-xs sm:text-sm text-[#5C6D71]">
                Manage prospects, configure your Nodemailer SMTP accounts, and send outreach emails.
              </p>
            </div>

            {/* ACTION BUTTONS (HIGH CONTRAST & CLEAR TEXT) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => dispatch(openClientModal())}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#E5CB90] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#22303A] shadow-sm transition-all hover:bg-[#FFF3C8]/60 hover:border-[#458393] active:scale-95"
                title="Configure Nodemailer SMTP email senders"
              >
                <Server size={16} className="text-[#458393]" />
                SMTP Accounts
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={leads.length === 0}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#E5CB90] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#22303A] shadow-sm transition-all hover:bg-[#FFF3C8]/60 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                title="Export leads to CSV"
              >
                <Download size={16} className="text-[#5C6D71]" />
                Export CSV
              </button>

              <Link
                href="/dashboard/leads/create"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#458393] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#346a78] transition-all active:scale-95"
              >
                <Plus size={17} />
                Add New Lead
              </Link>
            </div>
          </div>
        </header>

        {/* ================= ERROR ALERT ================= */}
        {error && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#C1523F]/30 bg-[#C1523F]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#C1523F]">
                Something went wrong
              </p>
              <p className="mt-0.5 text-xs text-[#7A3B30]">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => void getLeads()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C1523F]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#C1523F] hover:bg-[#C1523F]/10"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* ================= STAT CARDS ================= */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total Leads"
            value={loading ? "—" : leads.length}
            description="All active prospects in database"
            iconBg="bg-[#FFF3C8]/80 text-[#458393] border border-[#E5CB90]"
          />

          <StatCard
            icon={Flame}
            label="High Priority"
            value={loading ? "—" : highPriorityLeads}
            description="Need immediate engagement"
            iconBg="bg-[#C1523F]/10 text-[#C1523F] border border-[#C1523F]/30"
          />

          <StatCard
            icon={TrendingUp}
            label="Qualified Leads"
            value={loading ? "—" : qualifiedLeads}
            description="Ready for pitch and closing"
            iconBg="bg-[#458393]/10 text-[#458393] border border-[#458393]/30"
          />

          <StatCard
            icon={CircleDollarSign}
            label="Pipeline Value"
            value={loading ? "—" : formatCurrency(totalValue)}
            description="Estimated total opportunity"
            iconBg="bg-[#3C8F6B]/10 text-[#3C8F6B] border border-[#3C8F6B]/30"
          />
        </div>

        {/* ================= FILTER BAR ================= */}
        <div className="mb-5 rounded-2xl border border-[#E5CB90]/70 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_180px_180px]">
            {/* Search Input */}
            <div className="relative sm:col-span-2 xl:col-span-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A8F]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads by name, email, source..."
                className="h-10 w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] pl-10 pr-4 text-xs sm:text-sm font-medium text-[#22303A] outline-none transition-colors placeholder:text-[#9A9A8F] focus:border-[#458393] focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                ["all", "All Statuses"],
                ["new", "New"],
                ["contacted", "Contacted"],
                ["qualified", "Qualified"],
                ["proposal", "Proposal"],
                ["won", "Won"],
                ["lost", "Lost"],
              ]}
            />

            {/* Priority Filter */}
            <FilterSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                ["all", "All Priorities"],
                ["high", "High Priority"],
                ["medium", "Medium Priority"],
                ["low", "Low Priority"],
              ]}
            />

            {/* Source Filter */}
            <FilterSelect
              value={sourceFilter}
              onChange={setSourceFilter}
              options={[
                ["all", "All Sources"],
                ["website", "Website"],
                ["referral", "Referral"],
                ["ad", "Advertisement"],
                ["cold_call", "Cold Call"],
                ["other", "Other"],
              ]}
            />
          </div>
        </div>

        {/* ================= LEADS TABLE CONTAINER ================= */}
        <div className="overflow-hidden rounded-2xl border border-[#E5CB90]/70 bg-white shadow-sm">

          {/* TOOLBAR */}
          <div className="flex flex-col gap-3 border-b border-[#E5E5E0] bg-[#FFF3C8]/30 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <SlidersHorizontal size={16} className="text-[#5C6D71]" />
              <span className="text-xs sm:text-sm font-medium text-[#5C6D71]">
                Showing{" "}
                <span className="font-bold text-[#22303A]">
                  {filteredLeads.length}
                </span>{" "}
                leads
              </span>

              {selectedLeads.length > 0 && (
                <span className="rounded-full bg-[#FFF3C8] border border-[#E5CB90] px-3 py-0.5 text-xs font-semibold text-[#458393]">
                  {selectedLeads.length} selected
                </span>
              )}
            </div>

            {/* BULK ACTION BUTTON */}
            {selectedLeads.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const selected = leads.filter((l) =>
                      selectedLeads.includes(l._id)
                    );
                    dispatch(
                      openComposer(
                        selected.map((l) => ({
                          id: l._id,
                          personId: l.personId || l.name || "Lead",
                          email: l.email,
                          estimatedValue: l.estimatedValue,
                        }))
                      )
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#458393] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition active:scale-95"
                >
                  <Mail size={14} />
                  Email {selectedLeads.length} Selected Lead{selectedLeads.length > 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>

          {/* LOADING STATE */}
          {loading && <LoadingState />}

          {/* DESKTOP TABLE */}
          {!loading && filteredLeads.length > 0 && (
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px] table-fixed">
                <colgroup>
                  <col className="w-[48px]" />
                  <col className="w-[25%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                </colgroup>

                {/* TABLE HEADER */}
                <thead>
                  <tr className="border-b border-[#E5E5E0] bg-[#FAFAF7]">
                    <th className="px-5 py-3.5 text-left">
                      <input
                        type="checkbox"
                        checked={
                          filteredLeads.length > 0 &&
                          filteredLeads.every((l) => selectedLeads.includes(l._id))
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4 cursor-pointer accent-[#458393]"
                        aria-label="Select all leads"
                      />
                    </th>

                    <TableHeader>Lead</TableHeader>
                    <TableHeader>Source</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Priority</TableHeader>
                    <TableHeader align="right">Estimated Value</TableHeader>
                    <TableHeader align="right">Actions</TableHeader>
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody className="divide-y divide-[#F0F0EA]">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead._id}
                      onClick={() => {
                        window.location.href = `/dashboard/leads/${lead._id}`;
                      }}
                      className="cursor-pointer transition-colors hover:bg-[#FFF3C8]/30"
                    >
                      {/* CHECKBOX */}
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectLead(lead._id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 cursor-pointer accent-[#458393]"
                        />
                      </td>

                      {/* LEAD NAME & EMAIL */}
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3C8]/80 border border-[#E5CB90] text-xs font-bold text-[#458393]">
                            {getInitials(lead.personId || lead.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#22303A]">
                              {lead.personId || lead.name || "Unnamed Lead"}
                            </p>
                            <p className="truncate text-xs text-[#5C6D71]">
                              {lead.email || "No email provided"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SOURCE */}
                      <td className="px-5 py-4">
                        <span className="block truncate text-xs sm:text-sm capitalize font-medium text-[#5C6D71]">
                          {formatSource(lead.source)}
                        </span>
                      </td>

                      {/* STATUS BADGE */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            statusStyles[lead.status] || "bg-[#E9ECEE] text-[#3D4D51]"
                          }`}
                        >
                          {formatLabel(lead.status)}
                        </span>
                      </td>

                      {/* PRIORITY */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              priorityDotStyles[lead.priority] || "bg-slate-400"
                            }`}
                          />
                          <span
                            className={`text-xs sm:text-sm capitalize ${
                              priorityStyles[lead.priority] || "text-[#5C6D71]"
                            }`}
                          >
                            {lead.priority}
                          </span>
                        </div>
                      </td>

                      {/* ESTIMATED VALUE */}
                      <td className="px-5 py-4 text-right">
                        <span className="whitespace-nowrap text-xs sm:text-sm font-bold text-[#22303A]">
                          {formatCurrency(lead.estimatedValue)}
                        </span>
                      </td>

                      {/* ACTIONS: CLEAR & HIGH CONTRAST BUTTON */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(
                                openComposer([
                                  {
                                    id: lead._id,
                                    personId: lead.personId || lead.name || "Lead",
                                    email: lead.email,
                                    estimatedValue: lead.estimatedValue,
                                  },
                                ])
                              );
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#346a78] transition active:scale-95"
                            title={`Send email to ${lead.personId}`}
                          >
                            <Mail size={13} />
                            Send Email
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MOBILE CARDS VIEW */}
          {!loading && filteredLeads.length > 0 && (
            <div className="divide-y divide-[#E5E5E0] lg:hidden">
              {filteredLeads.map((lead) => (
                <div
                  key={lead._id}
                  className="p-4 transition-colors hover:bg-[#FFF3C8]/30 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/dashboard/leads/${lead._id}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF3C8] border border-[#E5CB90] text-xs font-bold text-[#458393]">
                        {getInitials(lead.personId || lead.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#22303A]">
                          {lead.personId || lead.name || "Unnamed Lead"}
                        </p>
                        <p className="truncate text-xs text-[#5C6D71]">
                          {lead.email || "No email provided"}
                        </p>
                      </div>
                    </Link>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        statusStyles[lead.status] || "bg-slate-200"
                      }`}
                    >
                      {formatLabel(lead.status)}
                    </span>

                    <span className="rounded-full border border-[#E5CB90] bg-[#FFF3C8]/40 px-2.5 py-0.5 text-xs font-medium text-[#5C6D71] capitalize">
                      {lead.priority} priority
                    </span>

                    <span className="rounded-full border border-[#E5CB90] bg-white px-2.5 py-0.5 text-xs font-bold text-[#22303A]">
                      {formatCurrency(lead.estimatedValue)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#E5E5E0]">
                    <span className="text-xs text-[#5C6D71]">
                      Source: {formatSource(lead.source)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(
                          openComposer([
                            {
                              id: lead._id,
                              personId: lead.personId || lead.name || "Lead",
                              email: lead.email,
                              estimatedValue: lead.estimatedValue,
                            },
                          ])
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#346a78]"
                    >
                      <Mail size={13} /> Send Email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && filteredLeads.length === 0 && (
            <EmptyState
              hasActiveFilters={hasActiveFilters}
              clearFilters={clearFilters}
            />
          )}
        </div>
      </div>

      {/* ================= MODALS ================= */}
      <EmailComposerModal />
      <EmailClientsModal />
    </main>
  );
}

/* =========================================================
   SUBCOMPONENTS
========================================================= */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconBg,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  description: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E5CB90]/70 bg-white p-4.5 shadow-sm transition hover:border-[#458393]/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#5C6D71]">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#22303A]">
            {value}
          </p>
          <p className="mt-0.5 text-xs text-[#9A9A8F]">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3.5 pr-9 text-xs sm:text-sm font-medium text-[#22303A] outline-none focus:border-[#458393] focus:bg-white cursor-pointer"
      >
        {options.map(([optVal, label]) => (
          <option key={optVal} value={optVal}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6D71]"
      />
    </div>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3.5 ${
        align === "right" ? "text-right" : "text-left"
      } text-xs font-bold uppercase tracking-wider text-[#5C6D71]`}
    >
      {children}
    </th>
  );
}

function LoadingState() {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 w-4 bg-[#E5CB90]/40 rounded" />
          <div className="h-10 w-10 bg-[#E5CB90]/40 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[#E5CB90]/40 rounded w-1/4" />
            <div className="h-2.5 bg-[#E5CB90]/30 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  clearFilters,
}: {
  hasActiveFilters: boolean;
  clearFilters: () => void;
}) {
  return (
    <div className="px-4 py-14 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF3C8] text-[#458393]">
        <Users size={24} />
      </div>
      <p className="text-base font-semibold text-[#22303A]">No leads found</p>
      <p className="mt-1 text-xs text-[#5C6D71]">
        {hasActiveFilters
          ? "No leads matched your current filter criteria."
          : "You haven't added any leads yet."}
      </p>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-3 text-xs font-semibold text-[#458393] hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}