"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Room = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  imageIds: string[];
  bedCount: number;
  extraBedCount: number;
  spaceType: string;
  available: number | null;
  totalPrice: number | null;
};

type Rate = { id: string; name: string; description: string };
type BookingStep = "dates" | "rate" | "details" | "confirm";

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  // Booking state
  const [bookingStep, setBookingStep] = useState<BookingStep>("dates");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    setCheckIn(fmt(tomorrow));
    setCheckOut(fmt(dayAfter));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/rooms?roomId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setRoom(d.room);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function fmt(d: Date) {
    return d.toISOString().split("T")[0];
  }

  function fetchRates() {
    setLoadingRates(true);
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => setRates(d.rates || []))
      .catch(() => setRates([]))
      .finally(() => setLoadingRates(false));
  }

  function proceedFromDates() {
    if (rates.length === 0) fetchRates();
    setBookingStep("rate");
  }

  async function handleSubmit() {
    if (!selectedRate || !room) return;
    setSubmitting(true);
    setResult(null);
    setErrorMsg("");

    try {
      const custRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const custData = await custRes.json();
      if (!custRes.ok)
        throw new Error(custData.error || "Failed to create customer");

      const customerId = custData.customer?.Id;

      const resRes = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratePlanId: selectedRate.id,
          startUtc: new Date(checkIn).toISOString(),
          endUtc: new Date(checkOut).toISOString(),
          adultCount: adults,
          childCount: children,
          customerId,
        }),
      });
      const resData = await resRes.json();
      if (!resRes.ok)
        throw new Error(resData.error || "Failed to create reservation");

      setResult("success");
    } catch (err) {
      setResult("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-80 rounded-xl bg-gray-100" />
          <div className="h-6 w-1/3 rounded bg-gray-100" />
          <div className="h-4 w-2/3 rounded bg-gray-50" />
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-red-600">{error || "Room not found."}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-gray-600 hover:underline">
          &larr; Back to listings
        </Link>
      </div>
    );
  }

  const images = room.imageIds.length > 0 ? room.imageIds : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        &larr; Back to listings
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left: Images + Details */}
        <div className="lg:col-span-3">
          {/* Image gallery */}
          {images.length > 0 ? (
            <div>
              <div className="relative h-80 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-96">
                <Image
                  src={images[activeImage]}
                  alt={room.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  unoptimized
                />
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {images.map((url, i) => (
                    <button
                      key={url}
                      onClick={() => setActiveImage(i)}
                      className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        i === activeImage
                          ? "border-gray-900"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`${room.name} ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-xl bg-gray-100 text-5xl text-gray-300">
              {room.spaceType === "Apartment"
                ? "\uD83C\uDFE2"
                : room.spaceType === "Villa"
                  ? "\uD83C\uDFE1"
                  : "\uD83D\uDECF\uFE0F"}
            </div>
          )}

          {/* Room info */}
          <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {room.spaceType} &middot; {room.bedCount} bed
                  {room.bedCount !== 1 && "s"}
                  {room.extraBedCount > 0 &&
                    ` + ${room.extraBedCount} extra`}
                </p>
              </div>
              {room.totalPrice !== null && nights > 0 && (
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ${Math.round(room.totalPrice)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${Math.round(room.totalPrice / nights)}/night
                  </div>
                </div>
              )}
            </div>

            {room.description && (
              <p className="mt-4 leading-relaxed text-gray-600">
                {room.description}
              </p>
            )}

            {room.available !== null && (
              <p className="mt-3 text-sm text-gray-400">
                {room.available} room{room.available !== 1 && "s"} available
              </p>
            )}
          </div>
        </div>

        {/* Right: Booking card */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Book this room
            </h2>

            {result === "success" ? (
              <div className="py-6 text-center">
                <div className="mb-2 text-3xl text-green-600">&#10003;</div>
                <h3 className="text-lg font-bold text-gray-900">Confirmed!</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {checkIn} to {checkOut} &middot; {nights} night
                  {nights !== 1 && "s"}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <a
                    href="/reservations"
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    View Reservations
                  </a>
                  <button
                    onClick={() => {
                      setResult(null);
                      setBookingStep("dates");
                      setSelectedRate(null);
                      setFirstName("");
                      setLastName("");
                      setEmail("");
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Book Again
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Progress dots */}
                <div className="mb-5 flex gap-1.5">
                  {(["dates", "rate", "details", "confirm"] as const).map(
                    (step, i) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full ${
                          i <=
                          ["dates", "rate", "details", "confirm"].indexOf(
                            bookingStep
                          )
                            ? "bg-gray-900"
                            : "bg-gray-200"
                        }`}
                      />
                    )
                  )}
                </div>

                {/* Step: Dates */}
                {bookingStep === "dates" && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-gray-700">
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
                      <span className="mb-1 block text-sm font-medium text-gray-700">
                        Check-out
                      </span>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-gray-700">
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
                        <span className="mb-1 block text-sm font-medium text-gray-700">
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
                    </div>
                    <button
                      onClick={proceedFromDates}
                      disabled={!checkIn || !checkOut || checkIn >= checkOut}
                      className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {/* Step: Rate */}
                {bookingStep === "rate" && (
                  <div className="space-y-2">
                    {loadingRates ? (
                      <p className="text-sm text-gray-500">Loading rates...</p>
                    ) : rates.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No rates available.
                      </p>
                    ) : (
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {rates.slice(0, 8).map((rate) => (
                          <button
                            key={rate.id}
                            onClick={() => {
                              setSelectedRate(rate);
                              setBookingStep("details");
                            }}
                            className="w-full rounded-lg border border-gray-200 p-3 text-left transition hover:border-gray-400"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {rate.name}
                            </div>
                            {rate.description && (
                              <div className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                                {rate.description}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setBookingStep("dates")}
                      className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                  </div>
                )}

                {/* Step: Details */}
                {bookingStep === "details" && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-gray-700">
                        First Name
                      </span>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-gray-700">
                        Last Name
                      </span>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-gray-700">
                        Email
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                      />
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBookingStep("rate")}
                        className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setBookingStep("confirm")}
                        disabled={
                          !firstName.trim() ||
                          !lastName.trim() ||
                          !email.trim()
                        }
                        className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step: Confirm */}
                {bookingStep === "confirm" && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Rate</dt>
                          <dd className="font-medium text-gray-900">
                            {selectedRate?.name}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Check-in</dt>
                          <dd className="font-medium text-gray-900">
                            {checkIn}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Check-out</dt>
                          <dd className="font-medium text-gray-900">
                            {checkOut}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Guests</dt>
                          <dd className="font-medium text-gray-900">
                            {adults} adult{adults !== 1 && "s"}
                            {children > 0 &&
                              `, ${children} child${
                                children !== 1 ? "ren" : ""
                              }`}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Guest</dt>
                          <dd className="font-medium text-gray-900">
                            {firstName} {lastName}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {result === "error" && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {errorMsg}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setBookingStep("details")}
                        className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                      >
                        {submitting ? "Booking..." : "Confirm Booking"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
