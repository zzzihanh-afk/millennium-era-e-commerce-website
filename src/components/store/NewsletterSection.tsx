import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscribeNewsletter } from '@/services/store';
import { toast } from 'sonner';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await subscribeNewsletter(email.trim());
      setSubscribed(true);
      toast.success('Thank you for subscribing to Millennium Era!');
    } catch (err: any) {
      toast.error(err.message || 'Subscription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-neutral-900 text-white relative overflow-hidden border-t border-b border-neutral-800">
      {/* Background accents */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <div className="w-12 h-12 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center mx-auto mb-4 text-brand-red">
          <Mail className="w-6 h-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
          Subscribe to the Era Club
        </h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto mb-8">
          Be the first to receive updates on limited-edition luxury drops, VIP discounts,
          and exclusive member privileges.
        </p>

        {subscribed ? (
          <div className="inline-flex items-center gap-2 p-4 bg-green-950/60 border border-green-800 text-green-300 rounded-lg text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span>You're officially on the VIP list. Welcome to Millennium Era!</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 text-sm bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition"
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-red hover:bg-brand-red-dark text-white font-bold px-6 py-3 h-auto rounded-md shadow-md transition"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        )}

        <p className="text-[11px] text-gray-500 mt-4">
          We respect your privacy. Unsubscribe at any time. No spam ever.
        </p>
      </div>
    </section>
  );
};
