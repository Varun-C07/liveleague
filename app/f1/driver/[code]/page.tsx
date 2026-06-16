import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { driverProfile } from "@/lib/sports/f1-driver";
import { DriverProfile } from "@/components/f1/DriverProfile";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `${code.toUpperCase()} — F1 Driver Profile` };
}

export default async function DriverPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = await driverProfile(code);
  if (!profile) notFound();
  return <DriverProfile p={profile} />;
}
