import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  GitCompare,
  Store,
  Layers,
  History,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowUpRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-[#19201d] font-sans antialiased selection:bg-[#15803d]/20 selection:text-[#15803d]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e6e4df]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#111916] text-[#4ade80] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#111916]">
                VERIDEX
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-[#7d8b82] font-medium px-2 py-0.5 rounded bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                Intelligent Product Catalog &amp; Sync
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#5c6660]">
            <a href="#workflow" className="hover:text-[#19201d] transition-colors">
              Three-Way Sync
            </a>
            <a href="#features" className="hover:text-[#19201d] transition-colors">
              Platform Features
            </a>
            <a href="#inspector" className="hover:text-[#19201d] transition-colors">
              Pre-Flight Diff
            </a>
            <a href="#woocommerce" className="hover:text-[#19201d] transition-colors">
              WooCommerce Sync
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/app/catalog"
              className="px-3.5 py-1.5 text-xs font-medium text-[#5c6660] hover:text-[#19201d] hover:bg-[#f4f2ec] rounded-md transition-colors"
            >
              Live Demo
            </Link>
            <Link
              to="/app/overview"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#15803d] hover:bg-[#166534] text-white text-xs font-semibold shadow-xs transition-all"
            >
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#15803d]" />
          <span>AI proposes. Rules verify. You stay in control.</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#111916] max-w-4xl mx-auto leading-[1.12]">
          VERIDEX <br className="hidden sm:inline" />
          <span className="text-[#15803d]">Intelligent Product Catalog &amp; Sync Platform</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#5c6660] max-w-2xl mx-auto leading-relaxed">
          Keep your product catalog accurate across PIM and WooCommerce with AI-assisted enrichment,
          deterministic validation, and conflict-aware three-way synchronization.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/app/overview"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white text-sm font-semibold shadow-xs transition-all"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/app/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-[#f4f2ec] text-[#19201d] border border-[#e6e4df] text-sm font-semibold transition-all shadow-2xs"
          >
            <span>Explore Catalog</span>
            <ArrowUpRight className="w-4 h-4 text-[#8a948e]" />
          </Link>
        </div>

        {/* Hero Product Intelligence Workflow Visualization */}
        <div id="workflow" className="mt-16 bg-white border border-[#e6e4df] rounded-xl p-6 sm:p-8 shadow-xs max-w-5xl mx-auto text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#f4f2ec]">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#15803d]">
                Three-Way Synchronization Pipeline
              </div>
              <div className="text-sm font-semibold text-[#111916] mt-0.5">
                Baseline Snapshot ➔ PIM Intelligence ➔ Deterministic Guardrails ➔ WooCommerce Live
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#7d8b82]">
              <span className="w-2 h-2 rounded-full bg-[#15803d]" />
              VERIDEX Guardrail Engine Active
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            {/* Step 1 */}
            <div className="p-4 rounded-lg bg-slate-50 border border-[#e6e4df]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#8a948e]">01</span>
                <Database className="w-4 h-4 text-[#5c6660]" />
              </div>
              <div className="font-semibold text-xs text-[#111916]">PIM Master</div>
              <p className="text-[11px] text-[#5c6660] mt-1 leading-snug">
                Canonical product catalog repository with full specification matrices.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-lg bg-slate-50 border border-[#e6e4df]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#8a948e]">02</span>
                <Sparkles className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div className="font-semibold text-xs text-[#111916]">AI Analysis</div>
              <p className="text-[11px] text-[#5c6660] mt-1 leading-snug">
                Autonomous heuristic &amp; LLM agents propose fixes for descriptions &amp; attributes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-lg bg-slate-50 border border-[#e6e4df]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#8a948e]">03</span>
                <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
              </div>
              <div className="font-semibold text-xs text-[#111916]">Rules Verify</div>
              <p className="text-[11px] text-[#5c6660] mt-1 leading-snug">
                Deterministic guardrails block large price spikes (&gt;30%) and missing SKUs.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-lg bg-slate-50 border border-[#e6e4df]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#8a948e]">04</span>
                <GitCompare className="w-4 h-4 text-[#b45309]" />
              </div>
              <div className="font-semibold text-xs text-[#111916]">Human Approval</div>
              <p className="text-[11px] text-[#5c6660] mt-1 leading-snug">
                Three-way diff &amp; source-of-truth policies guide user approval with blast-radius score.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-4 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#15803d]">05</span>
                <Store className="w-4 h-4 text-[#15803d]" />
              </div>
              <div className="font-semibold text-xs text-[#166534]">WooCommerce Sync</div>
              <p className="text-[11px] text-[#166534] mt-1 leading-snug">
                Atomic synchronization, immutable audit ledger, and 1-click rollback.
              </p>
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-[#e6e4df] flex flex-col sm:flex-row items-center gap-4">
            <img
              src="/assets/robot-assistant.png"
              alt="VERIDEX AI Assistant"
              className="w-16 h-16 object-contain shrink-0 drop-shadow-sm"
            />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-[#111916]">
                Apex Pro Wireless Headphones — Quality Score: 57/100
              </div>
              <p className="text-[#5c6660] mt-0.5">
                AI Assistant generated improved SEO description &amp; identified category conflict
                with remote WooCommerce target.
              </p>
            </div>
            <Link
              to="/app/ai-review"
              className="px-3.5 py-1.5 rounded-md bg-[#111916] text-white font-medium text-xs hover:bg-[#1f2d25] transition-colors shrink-0"
            >
              Review Suggestions →
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="py-16 px-6 bg-white border-y border-[#e6e4df]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111916] tracking-tight">
              Enterprise Catalog Precision Without the Guesswork
            </h2>
            <p className="mt-2 text-sm text-[#5c6660]">
              Built for ecommerce directors, catalog managers, and merchandising teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-5 rounded-lg border border-[#e6e4df] bg-[#fbfaf8] hover:border-[#cbd5e1] transition-all">
              <div className="w-8 h-8 rounded-md bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center mb-3">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-[#111916]">The Problem</h3>
              <p className="text-xs text-[#5c6660] mt-2 leading-relaxed">
                Messy CSVs, conflicting prices, missing images, and footwear tags assigned to
                wireless headphones break consumer trust and waste team hours.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-lg border border-[#e6e4df] bg-[#fbfaf8] hover:border-[#cbd5e1] transition-all">
              <div className="w-8 h-8 rounded-md bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-[#111916]">Automated Intelligence</h3>
              <p className="text-xs text-[#5c6660] mt-2 leading-relaxed">
                Heuristic rules and multi-modal AI scan every SKU in seconds, calculating health
                scores and proposing high-converting copy with 1 click.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-lg border border-[#e6e4df] bg-[#fbfaf8] hover:border-[#cbd5e1] transition-all">
              <div className="w-8 h-8 rounded-md bg-[#fef3c7] text-[#b45309] flex items-center justify-center mb-3">
                <GitCompare className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-[#111916]">Pre-Flight Dry Runs</h3>
              <p className="text-xs text-[#5c6660] mt-2 leading-relaxed">
                Never push blind updates. The Inspector generates a side-by-side field diff and
                lets you resolve stock or price conflicts before touching production.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-lg border border-[#e6e4df] bg-[#fbfaf8] hover:border-[#cbd5e1] transition-all">
              <div className="w-8 h-8 rounded-md bg-[#f0fdf4] text-[#15803d] flex items-center justify-center mb-3">
                <Store className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-[#111916]">Flawless WooCommerce Sync</h3>
              <p className="text-xs text-[#5c6660] mt-2 leading-relaxed">
                Immutable sync logs track every outbound payload. Preview your changes in an
                integrated live mock storefront before publishing live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-[#15803d]">
            Engineered Capabilities
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111916] tracking-tight mt-1">
            Everything Required for Storefront-Ready Catalogs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-lg bg-white border border-[#e6e4df] shadow-2xs">
            <Database className="w-5 h-5 text-[#15803d] mb-3" />
            <h3 className="font-semibold text-sm text-[#111916]">Catalog Repository</h3>
            <p className="text-xs text-[#5c6660] mt-1.5 leading-relaxed">
              Manage SKUs, categories, regular &amp; sale pricing, and stock levels in a high-density,
              sortable enterprise table with keyboard navigation.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-white border border-[#e6e4df] shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#7c3aed] mb-3" />
            <h3 className="font-semibold text-sm text-[#111916]">AI Review Workspace</h3>
            <p className="text-xs text-[#5c6660] mt-1.5 leading-relaxed">
              Autonomous agents spot missing metadata, score product copy from 0 to 100, and
              generate SEO titles and bullets with one-click approval.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-white border border-[#e6e4df] shadow-2xs">
            <Layers className="w-5 h-5 text-[#15803d] mb-3" />
            <h3 className="font-semibold text-sm text-[#111916]">Attribute &amp; Taxonomy Matrix</h3>
            <p className="text-xs text-[#5c6660] mt-1.5 leading-relaxed">
              Configure Color, Connectivity, Material, and Size attributes with slug mappings ready
              for WooCommerce variation sets.
            </p>
          </div>

          <div id="inspector" className="p-5 rounded-lg bg-white border border-[#e6e4df] shadow-2xs">
            <GitCompare className="w-5 h-5 text-[#b45309] mb-3" />
            <h3 className="font-semibold text-sm text-[#111916]">Pre-Flight Diff Inspector</h3>
            <p className="text-xs text-[#5c6660] mt-1.5 leading-relaxed">
              Field-level side-by-side reconciliation between PIM canonical state and WooCommerce.
              Choose whether to keep PIM or WooCommerce values.
            </p>
          </div>

          <div id="woocommerce" className="p-5 rounded-lg bg-white border border-[#e6e4df] shadow-2xs">
            <Store className="w-5 h-5 text-[#15803d] mb-3" />
            <h3 className="font-semibold text-sm text-[#111916]">Storefront Sandbox Preview</h3>
            <p className="text-xs text-[#5c6660] mt-1.5 leading-relaxed">
              Verify how synchronized products render to customers with real pricing, badges, and
              stock indicators before real shoppers encounter them.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-white border border-[#e6e4df] shadow-2xs">
            <History className="w-5 h-5 text-[#5c6660] mb-3" />
            <h3 className="font-semibold text-sm text-[#111916]">Immutable Audit Trail</h3>
            <p className="text-xs text-[#5c6660] mt-1.5 leading-relaxed">
              Every sync, conflict resolution, and AI enrichment is logged with timestamp, changed
              fields, and raw JSON payloads for auditing.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="py-16 px-6 bg-[#111916] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-[#1b2e23] border border-[#2e4736] text-[#4ade80] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to make your catalog storefront-ready?
          </h2>
          <p className="mt-3 text-sm text-[#9ea8a2] max-w-xl mx-auto leading-relaxed">
            Eliminate sync discrepancies, elevate product quality with AI, and publish to
            WooCommerce with total peace of mind.
          </p>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/app/overview"
              className="px-6 py-3 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white text-sm font-semibold transition-all shadow-md"
            >
              Open Workspace Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-[#e6e4df] text-center text-xs text-[#7d8b82]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>VERIDEX · Intelligent Product Catalog &amp; Sync Platform</div>
          <div>React · TypeScript · Vite · Node.js · Express</div>
        </div>
      </footer>
    </div>
  );
};
