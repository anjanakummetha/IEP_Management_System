"use client";

import { Card } from "@/app/components/ui/Card";
import { ShieldCheck } from "lucide-react";
import type { ServiceRow } from "@/app/students/[id]/page";

interface ServicesAccommodationsSectionProps {
  services: ServiceRow[];
}

export function ServicesAccommodationsSection({ services }: ServicesAccommodationsSectionProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={16} className="text-blue-500" />
        <h2 className="text-sm font-semibold text-slate-800">Services & Accommodations</h2>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-2">
          No services or accommodations on file. Upload an IEP PDF to extract service information.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Service / Accommodation", "Frequency", "Duration", "Provider"].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium pb-3 pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 pr-4 font-medium text-slate-800">{s.type}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {s.frequency ?? <span className="text-slate-400 italic text-xs">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {s.duration ?? <span className="text-slate-400 italic text-xs">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {s.provider ?? <span className="text-slate-400 italic text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
