import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Search, Mail, MessageSquare, Check, Sparkles, AlertCircle, PhoneCall } from 'lucide-react';

interface FaqItem {
  id: string;
  q: string;
  a: string;
  category: 'rider' | 'driver' | 'payment';
}

const FAQ_DATABASE: FaqItem[] = [
  {
    id: 'faq_1',
    q: 'How does the 1km driver priority queue matching system work?',
    a: 'When a passenger orders a ride in Colectivo, the system searches the available idle drivers starting from the closest 1km concentric zone. If multiple idle drivers are found within that zone, priority is given based on who has been parked/idle the longest (First-In, First-Out). If no driver is found, it automatically expands the search zone and broadcasts to other standby partners.',
    category: 'driver',
  },
  {
    id: 'faq_2',
    q: 'Why does my driver-partner console stop receiving ride requests?',
    a: 'We operate on a transparent driver wallet deposit system. Potential partners can execute up to 3 rides daily completely for free. After logging 3 completed trips, the console stops matching rides to you once your active wallet balance is strictly ₹0 or less. Top up your balance to restore match eligibility.',
    category: 'payment',
  },
  {
    id: 'faq_3',
    q: 'How do I top up my digital wallet as a passenger?',
    a: 'You can tap on your balance inside your passenger hub wallet and choose from fast increments like ₹50, ₹100, or ₹500. This balance is securely retained and deducted during completed rides.',
    category: 'rider',
  },
  {
    id: 'faq_4',
    q: 'How can I apply an active discount promo code to my trip?',
    a: 'Open the passenger ride choosing console, and enter promo codes like "URBANRIDE50" into the coupon input area. This grants an instantaneous discount applied directly on your final ride estimation invoice!',
    category: 'rider',
  },
  {
    id: 'faq_5',
    q: 'What are the document verification steps for new vehicles?',
    a: 'New driver accounts are initialized in a safety inspection verification status. Municipal administrators inside the "Admin Audits" panel will check your driver license file and state commercial insurance file to approve or block vehicles appropriately.',
    category: 'driver',
  },
  {
    id: 'faq_6',
    q: 'What causes dynamic tariff fare increases (Surge Multiplier)?',
    a: 'Fares adapt instantaneously depending on localized density. When bad monsoon weather (weather = rainy) or peak evening periods (weather = night) are active in a specific city grid sector, a surge multiplier is triggered to bring more idle drivers onto active streets.',
    category: 'payment',
  },
];

export default function WebsiteSupport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rider' | 'driver' | 'payment'>('all');
  
  // Ticket contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactTopic, setContactTopic] = useState('rider_dispatch');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter FAQs
  const filteredFaqs = FAQ_DATABASE.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitTicket = (e: FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setIsSubmitted(true);
    setTimeout(() => {
      // Clear form after delay
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div className="w-full bg-slate-50 text-slate-800 flex flex-col gap-12 font-sans select-none text-left" id="website_support_page">
      {/* Header section */}
      <div className="flex flex-col gap-2 max-w-4xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full w-fit">
          <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-rose-600 font-mono text-[10px] font-bold uppercase tracking-wider">Help Desk & FAQ Archive</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">
          How can we help you navigate?
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Search our comprehensive driver and rider documentation below, or send an interactive inquiry dispatch ticket straight to our customer success administrators.
        </p>
      </div>

      {/* Main split dashboard: FAQs left, Contact right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-5xl mx-auto w-full">
        {/* FAQ Area (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search matching questions or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans shadow-inner"
              />
            </div>

            {/* Category switches */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold font-mono">
              {(['all', 'rider', 'driver', 'payment'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition-all ${
                    selectedCategory === cat
                      ? 'bg-white text-black shadow-sm'
                      : 'text-slate-500 hover:text-black hover:bg-slate-200/45'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 font-sans">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map(faq => (
                <div key={faq.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
                  <div className="flex items-start gap-2.5">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold tracking-tight">Q</span>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-relaxed font-display">{faq.q}</h4>
                  </div>
                  <div className="mt-3 pl-7 text-xs text-slate-600 leading-relaxed font-sans prose prose-slate">
                    {faq.a}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold">No questions found matching your criteria.</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="text-indigo-600 font-mono text-[10px] font-bold underline mt-1 cursor-pointer">Clear filters</button>
              </div>
            )}
          </div>
        </div>

        {/* Support Ticket Submission Card (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Mail className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-[13px] text-slate-900 uppercase font-mono tracking-tight">Send Support Ticket</h3>
              <p className="text-[10px] text-slate-400">Offline administrative sandbox dispatch</p>
            </div>
          </div>

          {isSubmitted ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold rounded-full mb-1">DISPATCHED SUCCESS</span>
                <h4 className="font-bold text-sm text-slate-900 tracking-tight">Ticket Recorded Successfully!</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-[210px] mx-auto mt-2">
                  Our operations support team has routed this ticket to active moderators inside the region.
                </p>
              </div>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-4 px-4 py-1.5 bg-slate-900 text-white font-bold font-mono text-[9px] rounded-lg tracking-wide hover:bg-slate-800 transition-all uppercase cursor-pointer"
              >
                Send Another Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="flex flex-col gap-4 text-xs font-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Your Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rider"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Email Address:</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Routing Topic:</label>
                <select
                  value={contactTopic}
                  onChange={(e) => setContactTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="rider_dispatch">Rider Dispatch Issues</option>
                  <option value="wallet_refund">Wallet and Refund Queries</option>
                  <option value="driver_audit">Partner Clearance Auditing</option>
                  <option value="technical_bug">Technical Grid Coordinates Bug</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Your Message:</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain your coordinates dispatch situation..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] tracking-wider rounded-xl transition-all uppercase cursor-pointer"
              >
                Dispatch Ticket
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Emergency helpline list */}
      <section className="bg-slate-900 text-white p-5 rounded-2xl max-w-5xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <PhoneCall className="w-5 h-5 text-rose-400 animate-bounce" />
          <div>
            <h4 className="font-extrabold text-xs">24/7 Platform Safety Operations Helpline</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Municipal monitoring coordinates always active</p>
          </div>
        </div>
        <span className="font-mono text-sm font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-550/30">
          +91 (555) 999-COLECTIVO
        </span>
      </section>
    </div>
  );
}
