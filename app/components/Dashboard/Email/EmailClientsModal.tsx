"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  X,
  Server,
  Plus,
  Star,
  Trash2,
  Pencil,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  addEmailClient,
  closeClientModal,
  deleteEmailClient,
  GmailAccount,
  setDefaultClient,
  updateEmailClient,
} from "@/app/redux/emailClients";

const EMPTY_FORM = {
  name: "",
  email: "",
  appPassword: "",
  replyTo: "",
  signature: "",
  isDefault: false,
};

export default function EmailClientsModal() {
  const dispatch = useAppDispatch();
  const { isClientModalOpen, clients } = useAppSelector((state) => state.emailClients);

  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isClientModalOpen) {
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  }, [isClientModalOpen]);

  if (!mounted || !isClientModalOpen) return null;

  const handleClose = () => dispatch(closeClientModal());

  const startAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, isDefault: clients.length === 0 });
    setShowForm(true);
  };

  const startEdit = (client: GmailAccount) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      email: client.email,
      appPassword: client.appPassword || "",
      replyTo: client.replyTo || "",
      signature: client.signature || "",
      isDefault: client.isDefault,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      appPassword: form.appPassword.trim() || undefined,
      replyTo: form.replyTo.trim() || undefined,
      signature: form.signature.trim() || undefined,
      isDefault: form.isDefault,
      status: "connected" as const,
    };

    if (editingId) {
      const existing = clients.find((c) => c.id === editingId);
      if (!existing) return;

      dispatch(
        updateEmailClient({
          ...existing,
          ...payload,
        })
      );
    } else {
      dispatch(addEmailClient(payload));
    }

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#E5CB90] bg-white text-[#22303A] shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[#E5CB90]/70 px-6 py-4 bg-[#FFF3C8]/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#458393]/10 border border-[#458393]/20 text-[#458393]">
              <Server size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#22303A]">SMTP Accounts</h2>
              <p className="text-xs text-[#5C6D71]">
                Manage Gmail / Google Workspace senders for outreach
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-[#5C6D71] hover:bg-[#FFF3C8] hover:text-[#22303A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAFAF7]">
          {!showForm ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#5C6D71]">
                  {clients.length} account{clients.length !== 1 ? "s" : ""} configured
                </p>
                <button
                  type="button"
                  onClick={startAdd}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition"
                >
                  <Plus size={14} />
                  Add Account
                </button>
              </div>

              {clients.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E5CB90] p-8 text-center bg-white">
                  <Mail size={28} className="mx-auto text-[#9A9A8F] mb-2" />
                  <p className="text-sm font-semibold text-[#22303A]">No SMTP accounts yet</p>
                  <p className="text-xs text-[#5C6D71] mt-1 mb-4">
                    Add a Gmail account with an App Password to start sending emails.
                  </p>
                  <button
                    type="button"
                    onClick={startAdd}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-4 py-2 text-xs font-semibold text-white hover:bg-[#346a78]"
                  >
                    <Plus size={14} />
                    Add Your First Account
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="rounded-2xl border border-[#E5CB90]/70 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-[#22303A]">{client.name}</h3>
                            {client.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3C8] border border-[#E5CB90] px-2 py-0.5 text-[10px] font-semibold text-[#458393]">
                                <Star size={10} className="fill-current" />
                                Default
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#3C8F6B]">
                              <CheckCircle2 size={11} />
                              {client.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#458393] font-mono mt-0.5">{client.email}</p>
                          {client.replyTo && (
                            <p className="text-[11px] text-[#5C6D71] mt-1">
                              Reply-To: {client.replyTo}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!client.isDefault && (
                            <button
                              type="button"
                              onClick={() => dispatch(setDefaultClient(client.id))}
                              className="rounded-lg p-2 text-[#5C6D71] hover:bg-[#FFF3C8] hover:text-[#458393] transition"
                              title="Set as default"
                            >
                              <Star size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(client)}
                            className="rounded-lg p-2 text-[#5C6D71] hover:bg-[#FFF3C8] hover:text-[#22303A] transition"
                            title="Edit account"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => dispatch(deleteEmailClient(client.id))}
                            className="rounded-lg p-2 text-[#5C6D71] hover:bg-[#C1523F]/10 hover:text-[#C1523F] transition"
                            title="Delete account"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#22303A]">
                  {editingId ? "Edit SMTP Account" : "Add SMTP Account"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                  className="text-xs font-medium text-[#5C6D71] hover:text-[#22303A]"
                >
                  Back to list
                </button>
              </div>

              <div className="rounded-2xl border border-[#E5CB90]/70 bg-white p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Alex Turner (Sales)"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Gmail Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="sales@yourcompany.com"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">
                    Google App Password
                  </label>
                  <input
                    type="password"
                    value={form.appPassword}
                    onChange={(e) => setForm((prev) => ({ ...prev, appPassword: e.target.value }))}
                    placeholder="16-character app password"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">Reply-To</label>
                  <input
                    type="email"
                    value={form.replyTo}
                    onChange={(e) => setForm((prev) => ({ ...prev, replyTo: e.target.value }))}
                    placeholder="support@yourcompany.com"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] px-3 py-2 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#22303A] mb-1">Signature</label>
                  <textarea
                    rows={4}
                    value={form.signature}
                    onChange={(e) => setForm((prev) => ({ ...prev, signature: e.target.value }))}
                    placeholder="--&#10;Best regards,&#10;Your Name"
                    className="w-full rounded-xl border border-[#E5CB90] bg-[#FAFAF7] p-3 text-xs text-[#22303A] outline-none focus:border-[#458393] focus:bg-white resize-y"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-[#5C6D71]">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    className="h-3.5 w-3.5 accent-[#458393] cursor-pointer"
                  />
                  Set as default sender
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5CB90]/70">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-[#E5E5E0] bg-white px-4 py-2 text-xs font-medium text-[#5C6D71] hover:bg-[#F7F7F2] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#458393] px-5 py-2 text-xs font-semibold text-white shadow hover:bg-[#346a78] transition"
                >
                  {editingId ? "Save Changes" : "Add Account"}
                </button>
              </div>
            </form>
          )}
        </div>

        {!showForm && (
          <div className="flex items-center justify-end border-t border-[#E5CB90]/70 px-6 py-4 bg-white">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-[#E5E5E0] bg-white px-4 py-2 text-xs font-medium text-[#5C6D71] hover:bg-[#F7F7F2] transition"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
