import { NextRequest, NextResponse } from "next/server";
import { mewsPost, STAYS_SERVICE_ID } from "../mews/config";

export async function GET() {
  try {
    const now = new Date();
    const startUtc = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endUtc = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const data = await mewsPost("reservations/getAll", {
      ServiceIds: [STAYS_SERVICE_ID],
      StartUtc: startUtc,
      EndUtc: endUtc,
      Extent: {
        Reservations: true,
        Customers: true,
      },
    });

    const reservations = (data.Reservations || [])
      .slice(0, 50)
      .map(
        (r: {
          Id: string;
          State: string;
          StartUtc: string;
          EndUtc: string;
          AdultCount: number;
          ChildCount: number;
          CustomerId: string;
          RatePlanId: string;
          CreatedUtc: string;
        }) => ({
          id: r.Id,
          state: r.State,
          startUtc: r.StartUtc,
          endUtc: r.EndUtc,
          adultCount: r.AdultCount,
          childCount: r.ChildCount,
          customerId: r.CustomerId,
          ratePlanId: r.RatePlanId,
          createdUtc: r.CreatedUtc,
        })
      );

    const customers = Object.fromEntries(
      (data.Customers || []).map(
        (c: { Id: string; FirstName: string; LastName: string; Email: string }) => [
          c.Id,
          { firstName: c.FirstName, lastName: c.LastName, email: c.Email },
        ]
      )
    );

    return NextResponse.json({ reservations, customers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ratePlanId, startUtc, endUtc, adultCount, childCount, customerId } =
      await req.json();

    if (!ratePlanId || !startUtc || !endUtc) {
      return NextResponse.json(
        { error: "ratePlanId, startUtc, and endUtc are required" },
        { status: 400 }
      );
    }

    const reservation: Record<string, unknown> = {
      ServiceId: STAYS_SERVICE_ID,
      RatePlanId: ratePlanId,
      StartUtc: startUtc,
      EndUtc: endUtc,
      AdultCount: adultCount || 1,
      ChildCount: childCount || 0,
    };

    if (customerId) {
      reservation.CustomerId = customerId;
    }

    const data = await mewsPost("reservations/add", {
      Reservations: [reservation],
    });

    return NextResponse.json({ reservation: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
