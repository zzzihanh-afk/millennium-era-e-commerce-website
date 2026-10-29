import React, { useState } from 'react';
import { MapPin, Phone, Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitContactInquiry } from '@/services/store';
import { toast } from 'sonner';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitContactInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSent(true);
      toast.success('Your message has been received! Our support team will respond shortly.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50/60 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Contact & Support
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            Have questions about an order or our luxury collection? We're available 7 days a week.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details (5 cols) */}
          <div className="lg:col-span-5 bg-brand-charcoal text-white rounded-2xl p-8 space-y-8 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-brand-gold mb-2">Get in Touch</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Connect with our customer care representatives for wholesale inquiries, order tracking, and assistance.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Commercial Head Office</p>
                  <p className="text-gray-400">123, Main Commercial Area, Dhaka & Chattogram, Bangladesh</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-gold flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Hotline & WhatsApp</p>
                  <p className="text-gray-400">+880 1712 345678</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-gold flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Direct Email</p>
                  <p className="text-gray-400">support@millenniumera.com</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <a
                href="https://wa.me/8801712345678"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-xs transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            {sent ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Message Delivered</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Thank you for reaching out. A customer support specialist will review your inquiry and contact you via phone or email.
                </p>
                <Button
                  onClick={() => setSent(false)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahat Islam"
                      className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Order Tracking or Product Inquiry"
                      className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we assist you today?"
                    className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs h-10 px-6 rounded-md shadow-sm flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
