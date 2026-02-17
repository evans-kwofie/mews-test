"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type Room = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  bedCount: number;
  extraBedCount: number;
  spaceType: string;
  available: number | null;
  totalPrice: number | null;
};

export default function HomePage() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [searched, setSearched] = useState(false);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    setCheckIn(fmt(tomorrow));
    setCheckOut(fmt(dayAfter));
  }, []);

  function fmt(d: Date) {
    return d.toISOString().split("T")[0];
  }

  const fetchRooms = useCallback(
    async (withAvailability: boolean) => {
      setLoading(true);
      try {
        let url = "/api/rooms";
        if (withAvailability && checkIn && checkOut) {
          const start = new Date(checkIn).toISOString().split(".")[0] + "Z";
          const end = new Date(checkOut).toISOString().split(".")[0] + "Z";
          url += `?startUtc=${start}&endUtc=${end}&adults=${adults}&children=${children}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setRooms(data.rooms || []);
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    },
    [checkIn, checkOut, adults, children]
  );

  useEffect(() => {
    fetchRooms(false);
  }, [fetchRooms]);

  function handleSearch() {
    setSearched(true);
    fetchRooms(true);
  }

  const nights =
    checkIn && checkOut
      ? Math.max(
          1,
          Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              86400000
          )
        )
      : 0;

  const visibleRooms = searched
    ? rooms.filter((r) => r.available === null || r.available > 0)
    : rooms;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Search Bar */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">
              Check-in
            </span>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">
              Check-out
            </span>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">
              Adults
            </span>
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">
              Children
            </span>
            <select
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={!checkIn || !checkOut || checkIn >= checkOut}
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {searched
            ? `${visibleRooms.length} places available`
            : "Explore stays at Mews Hotel"}
        </h1>
        {searched && nights > 0 && (
          <p className="text-sm text-gray-500">
            {nights} night{nights !== 1 && "s"} &middot; {adults} adult
            {adults !== 1 && "s"}
            {children > 0 &&
              `, ${children} child${children !== 1 ? "ren" : ""}`}
          </p>
        )}
      </div>

      {/* Room grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200"
            >
              <div className="h-48 rounded-t-xl bg-gray-100" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 rounded bg-gray-100" />
                <div className="h-3 w-full rounded bg-gray-50" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
            >
              <div className="relative h-48 w-full bg-gray-100">
                {room.imageUrl ? (
                  <Image
                    src={room.imageUrl}
                    alt={room.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-gray-300">
                    {room.spaceType === "Apartment"
                      ? "\uD83C\uDFE2"
                      : room.spaceType === "Villa"
                        ? "\uD83C\uDFE1"
                        : "\uD83D\uDECF\uFE0F"}
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-700 backdrop-blur">
                  {room.spaceType}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{room.name}</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  {room.bedCount} bed{room.bedCount !== 1 && "s"}
                  {room.extraBedCount > 0 && ` + ${room.extraBedCount} extra`}
                </p>
                {room.description && (
                  <p className="mt-1.5 text-sm text-gray-400 line-clamp-2">
                    {room.description}
                  </p>
                )}
                {room.totalPrice !== null && nights > 0 && (
                  <p className="mt-2 text-sm">
                    <span className="font-semibold text-gray-900">
                      ${Math.round(room.totalPrice)}
                    </span>{" "}
                    <span className="text-gray-500">
                      total &middot; ${Math.round(room.totalPrice / nights)}
                      /night
                    </span>
                  </p>
                )}
                {searched && room.available !== null && (
                  <p className="mt-1 text-xs text-gray-400">
                    {room.available} room{room.available !== 1 && "s"} left
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
