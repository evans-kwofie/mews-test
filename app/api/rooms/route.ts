import { NextRequest, NextResponse } from "next/server";
import {
  bookingEnginePost,
  BE_HOTEL_ID,
  BE_CONFIGURATION_ID,
  MEWS_IMAGE_BASE,
} from "../mews/config";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const startUtc = params.get("startUtc");
    const endUtc = params.get("endUtc");
    const adults = Number(params.get("adults") || "2");
    const children = Number(params.get("children") || "0");

    // 1. Get hotel info (room categories with metadata + images)
    const hotelData = await bookingEnginePost("hotels/get", {
      HotelId: BE_HOTEL_ID,
    });

    const categoryMap = new Map<
      string,
      {
        id: string;
        name: string;
        description: string;
        imageUrl: string | null;
        imageIds: string[];
        bedCount: number;
        extraBedCount: number;
        spaceType: string;
      }
    >();

    for (const cat of hotelData.RoomCategories || []) {
      const name = cat.Name?.["en-US"] || cat.Name?.["en-GB"] || Object.values(cat.Name || {})[0] || "Unnamed";
      const desc = cat.Description?.["en-US"] || cat.Description?.["en-GB"] || Object.values(cat.Description || {})[0] || "";
      const firstImage = (cat.ImageIds || [])[0];

      categoryMap.set(cat.Id, {
        id: cat.Id,
        name: name as string,
        description: desc as string,
        imageUrl: firstImage ? `${MEWS_IMAGE_BASE}/${firstImage}` : null,
        imageIds: (cat.ImageIds || []).map((id: string) => `${MEWS_IMAGE_BASE}/${id}`),
        bedCount: cat.NormalBedCount || 0,
        extraBedCount: cat.ExtraBedCount || 0,
        spaceType: cat.SpaceType || "Room",
      });
    }

    // 2. If dates provided, fetch availability + pricing
    let availabilityMap = new Map<
      string,
      { available: number; priceUsd: number | null }
    >();

    if (startUtc && endUtc) {
      try {
        const availData = await bookingEnginePost("hotels/getAvailability", {
          HotelId: BE_HOTEL_ID,
          ConfigurationId: BE_CONFIGURATION_ID,
          StartUtc: startUtc,
          EndUtc: endUtc,
          AdultCount: adults,
          ChildCount: children,
        });

        for (const rca of availData.RoomCategoryAvailabilities || []) {
          const pricing = rca.RoomOccupancyAvailabilities?.[0]?.Pricing?.[0];
          const totalUsd = pricing?.Price?.Total?.USD ?? pricing?.Price?.Total?.EUR ?? null;

          availabilityMap.set(rca.RoomCategoryId, {
            available: rca.AvailableRoomCount,
            priceUsd: totalUsd,
          });
        }
      } catch {
        // availability fetch failed — still return rooms without pricing
      }
    }

    // 3. Single room lookup?
    const roomId = params.get("roomId");
    if (roomId) {
      const cat = categoryMap.get(roomId);
      if (!cat) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }
      const avail = availabilityMap.get(roomId);
      return NextResponse.json({
        room: { ...cat, available: avail?.available ?? null, totalPrice: avail?.priceUsd ?? null },
      });
    }

    // 4. Combine into response
    const rooms = Array.from(categoryMap.values()).map((cat) => {
      const avail = availabilityMap.get(cat.id);
      return {
        ...cat,
        available: avail?.available ?? null,
        totalPrice: avail?.priceUsd ?? null,
      };
    });

    return NextResponse.json({ rooms });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
