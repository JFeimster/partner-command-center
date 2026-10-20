"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, ArrowUpRight, CircleCheck, ClipboardList, Home, LayoutGrid, Link2, Menu, PanelLeftClose, PanelLeftOpen, Settings2, UserRound, Users, X } from "lucide-react";
import { Brand } from "./brand";

const partnerNav = [
  { label: "Overview", href: "/dashboard", icon: Home },
  { label: "Onboarding", href: "/dashboard/onboarding", icon: CircleCheck },
  { label: "Business profile", href: "/dashboard/profile", icon: UserRound },
  { label: "Referrals", href: "/dashboard/referrals", icon: ClipboardList },
  { label: "Tracking links", href: "/dashboard/links", icon: Link2 },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
  { label: "Resources", href: "/resources", icon: LayoutGrid },
  { label: "Settings", href: "/dashboard/settings", icon: Settings2 },
];
const operatorNav = [
  { label: "Overview", href: "/operator", icon: Home },
  { label: "Applications", href: "/operator/applications", icon: ClipboardList },
  { label: "Partners", href: "/operator/partners", icon: Users },
  { label: "Follow-up tasks", href: "/operator/tasks", icon: Activity },
  { label: "Activity history", href: "/operator/activity", icon: Activity },
];

export function WorkspaceShell({
  children, mode, name, organization,
}: {
  children: React.ReactNode;
  mode: "partner" | "operator";
  name?: string;
  organization?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = mode === "operator" ? operatorNav : partnerNav;

  return (
    <div className={`workspace ${collapsed ? "workspace--collapsed" : ""}`}>
      <a className="skip-link" href="#workspace-main">Skip to workspace</a>
      <aside className={`workspace-sidebar ${mobileOpen ? "workspace-sidebar--open" : ""}`} aria-label={`${mode} navigation`}>
        <div className="workspace-sidebar__head">
          <Brand compact={collapsed} href={mode === "operator" ? "/operator" : "/dashboard"} />
          <button type="button" className="icon-button workspace-sidebar__collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button type="button" className="icon-button workspace-sidebar__mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <div className="workspace-sidebar__group-label">{mode === "operator" ? "OPERATIONS" : "WORKSPACE"}</div>
        <nav className="workspace-sidebar__nav">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="workspace-sidebar__foot">
          <span className="workspace-sidebar__foot-label">{mode === "operator" ? "Operator workspace" : "Partner workspace"}</span>
          <Link href="/" title="Public site">Public site <ArrowUpRight size={15} /></Link>
        </div>
      </aside>
      {mobileOpen && <button type="button" className="workspace-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <div className="workspace-body">
        <header className="workspace-topbar">
          <button type="button" className="icon-button workspace-topbar__menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="workspace-topbar__location"><span>PARTNER COMMAND</span><span className="workspace-topbar__slash">/</span><strong>{mode === "operator" ? "Operations" : "Partner workspace"}</strong></div>
          <div className="workspace-topbar__identity"><span className="workspace-topbar__online" aria-hidden="true" /><span>{organization || name || (mode === "operator" ? "Operator" : "Partner")}</span></div>
        </header>
        <main className="workspace-main" id="workspace-main">{children}</main>
      </div>
    </div>
  );
}
