import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type EmailProviderType = "smtp" | "gmail" | "outlook" | "api";

export interface EmailClient {
  id: string;
  name: string; // e.g., "Sales Outreach" or "Alex Turner"
  email: string; // e.g., "alex@mycompany.com"
  replyTo?: string;
  provider: EmailProviderType;
  isDefault: boolean;
  signature?: string;
  // SMTP specific details
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  username?: string;
  // Status
  status: "connected" | "disconnected" | "error";
  lastVerifiedAt?: string;
  createdAt: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: "outreach" | "followup" | "proposal" | "custom";
  subject: string;
  body: string;
}

export interface SentEmailLog {
  id: string;
  leadId: string;
  leadName?: string;
  leadEmail: string;
  clientId: string;
  clientEmail: string;
  clientName: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  status: "sent" | "delivered" | "opened" | "clicked" | "failed";
  scheduledFor?: string;
  sentAt: string;
}

interface EmailClientsState {
  clients: EmailClient[];
  templates: EmailTemplate[];
  sentLogs: SentEmailLog[];
  selectedClientId: string | null;
  isClientModalOpen: boolean;
  isComposerOpen: boolean;
  composerPreselectedLeads: Array<{
    id: string;
    personId: string;
    email: string;
    company?: string;
    estimatedValue?: number;
  }>;
}

const DEFAULT_CLIENTS: EmailClient[] = [
  {
    id: "client-default-1",
    name: "Primary Sales (Google Workspace)",
    email: "sales@yourcompany.com",
    replyTo: "support@yourcompany.com",
    provider: "gmail",
    isDefault: true,
    signature: "--\nBest regards,\nSales Team\nLeadWise CRM | leadwise.io",
    status: "connected",
    lastVerifiedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "client-default-2",
    name: "Executive Outreach (Custom SMTP)",
    email: "founder@yourcompany.com",
    provider: "smtp",
    smtpHost: "mail.yourcompany.com",
    smtpPort: 587,
    smtpSecure: true,
    username: "founder@yourcompany.com",
    isDefault: false,
    signature: "--\nWarm regards,\nFounder & CEO\nSchedule a call: cal.com/leadwise",
    status: "connected",
    lastVerifiedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-1",
    name: "👋 Initial Introduction & Discovery",
    category: "outreach",
    subject: "Quick question regarding {{lead_name}}'s pipeline strategy",
    body: `Hi {{lead_name}},

I noticed you're leading growth initiatives and wanted to reach out. We help companies streamline their sales pipelines, boost team conversion rates, and automate follow-ups.

Would you be open to a brief 10-minute chat this Thursday to see how we could assist your team?

Best regards,
{{sender_name}}`,
  },
  {
    id: "tpl-2",
    name: "📊 Demo & Value Follow-up",
    category: "followup",
    subject: "Resources & next steps for {{lead_name}}",
    body: `Hi {{lead_name}},

Great speaking with you recently! As promised, here are the key highlights and solutions we discussed tailored to your estimated opportunity value of {{estimated_value}}.

Please let me know if you have questions or if you'd like to schedule our technical deep-dive next week.

Best,
{{sender_name}}`,
  },
  {
    id: "tpl-3",
    name: "💼 Formal Proposal & Pricing Review",
    category: "proposal",
    subject: "Proposal Overview for {{lead_name}}",
    body: `Hi {{lead_name}},

Attached is our customized proposal covering the implementation timeline and commercial terms.

We are ready to start onboarding as soon as your team is set. Let me know when you'd like to finalize the agreement.

Warm regards,
{{sender_name}}`,
  },
  {
    id: "tpl-4",
    name: "⚡ Re-engagement & Checking In",
    category: "custom",
    subject: "Checking in - {{lead_name}}",
    body: `Hi {{lead_name}},

Hope you're having a productive week! Just following up to see if you had any questions regarding our previous discussion.

Happy to jump on a quick sync whenever convenient.

Best,
{{sender_name}}`,
  },
];

// Helper to safely access localStorage on client-side
const loadStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = <T>(key: string, data: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

const initialClients = loadStorage<EmailClient[]>("leadwise_email_clients", DEFAULT_CLIENTS);
const initialTemplates = loadStorage<EmailTemplate[]>("leadwise_email_templates", DEFAULT_TEMPLATES);
const initialLogs = loadStorage<SentEmailLog[]>("leadwise_email_logs", [
  {
    id: "log-1",
    leadId: "lead-sample-1",
    leadName: "Acme Corp",
    leadEmail: "contact@acme.com",
    clientId: "client-default-1",
    clientEmail: "sales@yourcompany.com",
    clientName: "Primary Sales",
    subject: "Introductory Meeting & Platform Demo",
    body: "Hi Acme team, thanks for connecting with us today. Looking forward to our discussion!",
    status: "opened",
    sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]);

const defaultActiveClient = initialClients.find((c) => c.isDefault)?.id || initialClients[0]?.id || null;

const initialState: EmailClientsState = {
  clients: initialClients,
  templates: initialTemplates,
  sentLogs: initialLogs,
  selectedClientId: defaultActiveClient,
  isClientModalOpen: false,
  isComposerOpen: false,
  composerPreselectedLeads: [],
};

const emailClientsSlice = createSlice({
  name: "emailClients",
  initialState,
  reducers: {
    addEmailClient: (state, action: PayloadAction<Omit<EmailClient, "id" | "createdAt">>) => {
      const newClient: EmailClient = {
        ...action.payload,
        id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
      };

      if (newClient.isDefault || state.clients.length === 0) {
        state.clients.forEach((c) => {
          c.isDefault = false;
        });
        newClient.isDefault = true;
        state.selectedClientId = newClient.id;
      }

      state.clients.push(newClient);
      saveStorage("leadwise_email_clients", state.clients);
    },

    updateEmailClient: (state, action: PayloadAction<EmailClient>) => {
      const index = state.clients.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        if (action.payload.isDefault) {
          state.clients.forEach((c) => {
            c.isDefault = false;
          });
        }
        state.clients[index] = action.payload;
        saveStorage("leadwise_email_clients", state.clients);
      }
    },

    deleteEmailClient: (state, action: PayloadAction<string>) => {
      state.clients = state.clients.filter((c) => c.id !== action.payload);
      if (state.selectedClientId === action.payload) {
        const nextDefault = state.clients.find((c) => c.isDefault) || state.clients[0];
        state.selectedClientId = nextDefault ? nextDefault.id : null;
      }
      saveStorage("leadwise_email_clients", state.clients);
    },

    setDefaultClient: (state, action: PayloadAction<string>) => {
      state.clients.forEach((c) => {
        c.isDefault = c.id === action.payload;
      });
      state.selectedClientId = action.payload;
      saveStorage("leadwise_email_clients", state.clients);
    },

    setSelectedClientId: (state, action: PayloadAction<string | null>) => {
      state.selectedClientId = action.payload;
    },

    openClientModal: (state) => {
      state.isClientModalOpen = true;
    },

    closeClientModal: (state) => {
      state.isClientModalOpen = false;
    },

    openComposer: (
      state,
      action: PayloadAction<
        Array<{
          id: string;
          personId: string;
          email: string;
          company?: string;
          estimatedValue?: number;
        }>
      >
    ) => {
      state.composerPreselectedLeads = action.payload;
      state.isComposerOpen = true;
    },

    closeComposer: (state) => {
      state.isComposerOpen = false;
      state.composerPreselectedLeads = [];
    },

    saveTemplate: (state, action: PayloadAction<Omit<EmailTemplate, "id">>) => {
      const newTemplate: EmailTemplate = {
        ...action.payload,
        id: `tpl-${Date.now()}`,
      };
      state.templates.push(newTemplate);
      saveStorage("leadwise_email_templates", state.templates);
    },

    deleteTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter((t) => t.id !== action.payload);
      saveStorage("leadwise_email_templates", state.templates);
    },

    sendEmailLog: (
      state,
      action: PayloadAction<Omit<SentEmailLog, "id" | "sentAt">>
    ) => {
      const newLog: SentEmailLog = {
        ...action.payload,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sentAt: new Date().toISOString(),
      };
      state.sentLogs.unshift(newLog);
      saveStorage("leadwise_email_logs", state.sentLogs);
    },
  },
});

export const {
  addEmailClient,
  updateEmailClient,
  deleteEmailClient,
  setDefaultClient,
  setSelectedClientId,
  openClientModal,
  closeClientModal,
  openComposer,
  closeComposer,
  saveTemplate,
  deleteTemplate,
  sendEmailLog,
} = emailClientsSlice.actions;

export default emailClientsSlice.reducer;
