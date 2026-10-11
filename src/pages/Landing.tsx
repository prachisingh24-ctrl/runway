import { motion } from 'framer-motion';
import { ArrowRight, FlaskConical, HeartPulse, PiggyBank, Sparkles } from 'lucide-react';
import { loginWithRedirect } from 'zitejs/auth';
import { Button } from '@project/components/ui/button';

const features = [
  { icon: FlaskConical, title: 'Simulate first', text: 'Run any purchase through the what-if engine and see the fallout before you pay.' },
  { icon: HeartPulse, title: 'Health Score', text: 'One number for your money vibe — with a breakdown of exactly what moves it.' },
  { icon: PiggyBank, title: 'Goals that move', text: 'Watch every choice push your savings goals closer or further away.' },
];

export default function Landing() {
  const go = () => loginWithRedirect();
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="text-2xl font-bold tracking-tight">run<span className="text-primary">way</span></span>
        <Button variant="outline" onClick={go}>Sign in</Button>
      </header>

      <section className="relative max-w-6xl mx-auto px-6 pt-10 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-0 w-80 h-80 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Money game, but make it real
          </div>
          <h1 className="mt-5 text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            ₹10,000. 30 days.<br /><span className="text-primary">Make it last.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-md">
            Test every spend before you make it. Watch your balance, daily allowance, goals and health score react in real time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={go} className="rounded-full px-7">Start your runway <ArrowRight className="w-4 h-4 ml-1" /></Button>
            <Button size="lg" variant="ghost" onClick={go} className="rounded-full">I have an account</Button>
          </div>
          <div className="mt-10 flex gap-8 font-mono text-sm">
            <div><p className="text-2xl font-bold text-foreground">30</p><p className="text-muted-foreground">day runway</p></div>
            <div><p className="text-2xl font-bold text-foreground">6</p><p className="text-muted-foreground">live metrics</p></div>
            <div><p className="text-2xl font-bold text-foreground">0</p><p className="text-muted-foreground">bank logins</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
          <img src="https://images.fillout.com/889031/ntsppvuale/generated-images/ntC2NjHMqRkRUVFPo3mkia/img_FELgS4Cwi_DPuE_H.jpg" alt="Phone showing Runway" className="w-full aspect-[4/3] object-cover rounded-3xl border border-border shadow-2xl" />
          <div className="absolute -bottom-6 -left-4 md:-left-10 bg-card border border-border rounded-2xl px-5 py-4 shadow-xl">
            <p className="text-xs text-muted-foreground">Today's allowance</p>
            <p className="text-2xl font-bold font-mono text-primary">₹219</p>
          </div>
          <div className="absolute -top-5 -right-3 bg-accent text-accent-foreground rounded-2xl px-4 py-3 shadow-xl text-sm font-semibold">Health 82 · Thriving</div>
        </motion.div>
      </section>

      <section className="bg-card/50 border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-background p-6">
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><f.icon className="w-5 h-5" /></div>
              <p className="mt-4 text-lg font-semibold">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Your future self is watching. 👀</h2>
        <p className="mt-3 text-muted-foreground">Free. Takes 60 seconds to set up.</p>
        <Button size="lg" onClick={go} className="mt-6 rounded-full px-8">Get started</Button>
      </section>
      <footer className="text-center text-xs text-muted-foreground pb-8">© 2026 Runway · Built for broke-but-smart humans</footer>
    </div>
  );
}
