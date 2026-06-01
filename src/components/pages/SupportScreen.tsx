import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LifeBuoy, MessageCircle, Mail, Phone, ChevronDown, ChevronUp,
  CheckCircle2, ExternalLink, BookOpen, Video, FileText, Zap,
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Card } from '../atoms/Card';
import { FormField } from '../molecules/FormField';
import { PageHeader } from '../organisms/PageHeader';

const FAQS = [
  { q: 'How do I process a refund?',                  a: 'Go to Orders, select the order, click the "..." menu and choose "Issue Refund". Enter the amount and confirm. The refund will be processed to the original payment method within 3–5 business days.' },
  { q: 'How do I add a new menu item?',               a: 'Navigate to Menu Management, click "Add New Item", fill in the name, category, price, ingredients and status, then click Save. The item will immediately appear in the POS.' },
  { q: 'How do I set up the kitchen printer?',        a: 'Go to Settings → Printer & Hardware. Enter your printer model and IP address, enable Kitchen Ticket Printing, then click "Test Printer Connection" to verify.' },
  { q: 'Can I export my sales data?',                 a: 'Yes. Go to Reports & Analytics, select your date range (Today, This Week, This Month, or This Year), then click "Export CSV". A file will download with all KPIs, revenue trends, and top items.' },
  { q: 'How do I manage staff permissions?',          a: 'Go to Staff Management and click "Permissions". You can also manage terminal access users in Settings → User Management where you can add, activate/deactivate, or remove users.' },
  { q: 'How does the loyalty points system work?',    a: 'Customers earn 0.1 points per $1 spent. At 1000 points they qualify for a reward. You can view and manage points in the Customers section and send offers directly from the guest detail panel.' },
  { q: 'How do I send an order to the kitchen?',      a: 'Build your order in the POS screen, then click "Send to Kitchen" in the sidebar. A confirmation modal will show all pending items. Confirm to send tickets to the kitchen printer and update order status.' },
  { q: 'What payment methods are supported?',         a: 'The POS supports Card (credit/debit), Cash, and Tap (contactless/NFC). Payment method buttons appear at checkout. You can configure default methods in Settings → POS & Payments.' },
];

const RESOURCES = [
  { icon: BookOpen, label: 'Documentation',    desc: 'Full user guide and API docs',   href: '#' },
  { icon: Video,    label: 'Video Tutorials',  desc: 'Step-by-step walkthrough videos', href: '#' },
  { icon: FileText, label: 'Release Notes',    desc: 'Latest updates and changelog',   href: '#' },
  { icon: Zap,      label: 'Quick Start Guide',desc: 'Get up and running in 5 minutes', href: '#' },
];

export function SupportScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }, 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 overflow-y-auto min-h-full max-w-4xl">
      <PageHeader title="Support Center" subtitle="Get help, browse resources, or contact our team." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: MessageCircle, label: 'Live Chat',    desc: 'Chat with support',      action: 'Start Chat',    color: 'text-primary',   bg: 'bg-primary/10'   },
          { icon: Mail,          label: 'Email Support',desc: 'support@restaurant-pos.com', action: 'Send Email', color: 'text-secondary', bg: 'bg-secondary/10' },
          { icon: Phone,         label: 'Phone Support',desc: '+1 800-POS-HELP',            action: 'Call Now',      color: 'text-tertiary',  bg: 'bg-tertiary/10'  },
        ].map((c, i) => (
          <Card key={i} interactive className="hover:border-primary/30">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <p className="font-semibold text-on-surface text-sm">{c.label}</p>
            <p className="text-xs text-on-surface-variant mt-0.5 mb-3">{c.desc}</p>
            <Button variant="ghost" size="sm" className="text-primary px-0">{c.action} →</Button>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-bold font-headline text-on-surface mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-surface-container-high rounded-2xl border border-outline-variant overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-bright transition-colors">
                  <span className="text-sm font-medium text-on-surface pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <p className="px-4 pb-4 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant pt-3">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-bold font-headline text-on-surface mb-4">Send a Message</h2>
            <form onSubmit={handleSubmit} className="bg-surface-container-high rounded-2xl border border-outline-variant p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Your Name">
                  <Input value={name} onChange={setName} placeholder="Marcus V." fullWidth className="bg-surface-container-low" />
                </FormField>
                <FormField label="Email">
                  <Input type="email" value={email} onChange={setEmail} placeholder="you@email.com" fullWidth className="bg-surface-container-low" />
                </FormField>
              </div>
              <FormField label="Subject">
                <Input value={subject} onChange={setSubject} placeholder="e.g. Printer not connecting" fullWidth className="bg-surface-container-low" />
              </FormField>
              <FormField label="Message">
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Describe your issue in detail…"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
              </FormField>
              <Button
                type="submit"
                variant={submitted ? 'secondary' : 'primary'}
                disabled={!submitted && (!name.trim() || !email.trim() || !message.trim())}
                className={`w-full justify-center ${submitted ? 'bg-secondary/15 border-secondary/30 text-secondary' : ''}`}
                icon={submitted ? <CheckCircle2 className="w-4 h-4" /> : undefined}
              >
                {submitted ? 'Message Sent!' : 'Send Message'}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="font-bold font-headline text-on-surface mb-4">Resources</h2>
            <div className="space-y-2">
              {RESOURCES.map((r, i) => (
                <a key={i} href={r.href}
                  className="flex items-center gap-3 p-3.5 bg-surface-container-high rounded-xl border border-outline-variant hover:border-primary/30 hover:bg-surface-bright transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <r.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{r.label}</p>
                    <p className="text-xs text-on-surface-variant">{r.desc}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
