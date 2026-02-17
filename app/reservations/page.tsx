"use client";

import { useEffect, useState } from "react";

type Reservation = {
  id: string;
  state: string;
  startUtc: string;
  endUtc: string;
  adultCount: number;
  childCount: number;
  customerId: string;
  createdUtc: string;
};

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
};

const STATE_COLORS: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-800",
  Optional: "bg-yellow-100 text-yellow-800",
  Canceled: "bg-red-100 text-red-800",
  Started: "bg-blue-100 text-blue-800",
  Processed: "bg-gray-100 text-gray-800",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setReservations(data.reservations || []);
        setCustomers(data.customers || {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Reservations</h1>

      {loading && <p className="text-sm text-gray-500">Loading reservations...</p>}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && reservations.length === 0 && (
        <p className="text-sm text-gray-500">No reservations found.</p>
      )}

      {!loading && reservations.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Guests</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map((r) => {
                const c = customers[r.customerId];
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c ? `${c.firstName} ${c.lastName}` : "—"}
                      {c?.email && (
                        <div className="text-xs font-normal text-gray-500">
                          {c.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(r.startUtc)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(r.endUtc)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.adultCount}A{r.childCount > 0 ? ` ${r.childCount}C` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATE_COLORS[r.state] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {r.state}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
