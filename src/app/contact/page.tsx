"use client";

import { useState } from "react";
import Navbar from "../../components/landing/hero";
import SiteFooter from "../../components/layout/site-footer";
import {
  Mail,
  Send,
  User,
  MessageSquare,
  Tag,
  CheckCircle,
  Globe,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { FaGithub } from "react-icons/fa6";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    // Open mailto link as fallback
    const mailtoLink = `mailto:dhruvesh.shyara.cg@gmail.com?subject=${encodeURIComponent(
      form.subject || "HireLens Contact"
    )}&body=${encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    )}`;

    window.open(mailtoLink, "_blank");
    setStatus("sent");

    // Reset after 4 seconds
    setTimeout(() => {
      setStatus("idle");
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 4000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-violet-100 rounded-full blur-3xl opacity-40" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold mb-6 animate-fade-in">
            <Mail size={12} />
            Get in Touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-5 animate-fade-in delay-100">
            Contact <span className="gradient-text">Us</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
            Have questions, feedback, or collaboration ideas? We&apos;d love to hear from you.
            Drop us a message and we&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* ── Contact Content ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Form — takes 3 cols */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/30">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1">
                  Send a Message
                </p>
                <h2 className="text-xl font-bold text-slate-900">Contact Form</h2>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                    <User size={14} className="text-indigo-500" />
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                    <Mail size={14} className="text-indigo-500" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                    <Tag size={14} className="text-indigo-500" />
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300"
                  >
                    <option value="">Select a subject...</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Collaboration">Collaboration</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div className="relative">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                    <MessageSquare size={14} className="text-indigo-500" />
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us what's on your mind..."
                    required
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all shadow-sm hover:border-slate-300"
                  />
                  <span className="absolute bottom-3 right-4 text-[11px] text-slate-400 font-mono">
                    {form.message.length} chars
                  </span>
                </div>

                {/* Submit */}
                {status === "sent" ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium animate-fade-in">
                    <CheckCircle size={16} />
                    Message sent! We&apos;ll get back to you soon.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={status === "sending" || !form.name || !form.email || !form.message}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                    {status === "sending" ? "Sending…" : "Send Message"}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Info Sidebar — takes 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                    <Mail size={15} className="text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Email</p>
                    <a href="mailto:teamvelox.charusat@gmail.com" className="text-sm text-slate-700 hover:text-indigo-600 transition-colors">
                      
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 border border-violet-100">
                    <MapPin size={15} className="text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Location</p>
                    <p className="text-sm text-slate-700">India</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                    <GraduationCap size={15} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Team</p>
                    <p className="text-sm text-slate-700">Velox</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Follow Us</h3>
              <div className="space-y-3">
                <a
                  href="https://github.com/Dhruvesh1611/Team-Velox-AI-RESUME-OPTIMIZER"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
                    <FaGithub size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">GitHub</p>
                    <p className="text-xs text-slate-400">View source code</p>
                  </div>
                </a>
                <a
                  href="https://www.dhruveshshyara.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
                    <Globe size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 group-hover:text-violet-600 transition-colors">Placeholder</p>

                  </div>
                </a>
              </div>
            </div>

            {/* Quick FAQ */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Quick FAQ</h3>
              <div className="space-y-3">
                {[
                  { q: "Is HireLens free?", a: "Yes! The core features are completely free to use." },
                  { q: "How accurate are the resumes?", a: "We only use real data from your portfolio — nothing fabricated." },
                  { q: "What about data privacy?", a: "We don't store your personal data beyond the session." },
                ].map((faq) => (
                  <div key={faq.q}>
                    <p className="text-xs font-semibold text-indigo-700">{faq.q}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
