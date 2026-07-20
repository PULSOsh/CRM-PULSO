import { auth } from "@/lib/auth";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db, schema } from "@pulso/database";
import { eq, sql } from "drizzle-orm";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const unreadResult = await db.select({ count: sql<number>`count(*)` }).from(schema.adminNotifications).where(eq(schema.adminNotifications.isRead, false));
  const unreadCount = Number(unreadResult[0]?.count ?? 0);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar user={session.user as any} unreadCount={unreadCount} />
      <div className="min-w-0 flex-1">
        <Topbar isDemo={process.env.DEMO_MODE === "true"} />
        <main className="mx-auto w-full max-w-[1600px] p-4 pb-24 md:p-6 lg:p-8">{children}</main>
      </div>
      <MobileNav unreadCount={unreadCount} />
    </div>
  );
}
