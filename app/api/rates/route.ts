import { NextResponse } from "next/server";
import { mewsPost, STAYS_SERVICE_ID } from "../mews/config";

// Curated rate IDs to feature — these are the meaningful ones on the demo env
const FEATURED_IDS = new Set([
  "60af06cd-0889-4560-a72b-ab3a00b6e90f", // Fully Flexible Rate
  "2ae098c8-5b8c-4622-8141-ab3a00c6457e", // Non-Refundable
  "12f42bd4-e581-4961-8dfe-ab3a00cea0c1", // Breakfast Included - flexible
  "efd5de0d-36ee-4271-92a2-ab3a00ceed24", // Breakfast Included - non-refundable
  "60fa4e51-51c7-4e06-a753-abab00cad949", // Weekend Culinary Package (if exists)
  "aac0dfce-82a5-4798-b643-abbe008b7098", // Direct Booking (if exists)
]);

// Fallback descriptions for well-known rates that lack them
const FALLBACK_DESC: Record<string, string> = {
  "Fully Flexible Rate":
    "Free cancellation up to 24 hours before check-in. Maximum flexibility for your travel plans.",
  "Non-Refundable":
    "Best available price with no cancellation. Ideal when your plans are set in stone.",
  "Breakfast Included - flexible cancellation":
    "Start every morning with a full breakfast buffet. Free cancellation up to 24 hours before arrival.",
  "Breakfast Included - non-refundable":
    "Enjoy daily breakfast at our best non-refundable price. Great value for confirmed stays.",
  "Weekend Culinary Package":
    "A weekend getaway featuring curated dining experiences and local culinary tours.",
  "Direct booking":
    "Book directly with us for the best guaranteed rate and exclusive perks.",
  "Weekend deal":
    "Special weekend pricing for Friday through Sunday stays.",
  "Standard rate 7d cancellation fee":
    "Standard rate with free cancellation up to 7 days before check-in.",
  "Multi-Day Rates":
    "Discounted pricing for extended stays of 3 nights or more.",
  "July Rates":
    "Special seasonal pricing for July stays. Limited availability.",
  "Owner":
    "Zero payment rate for property owners of apartments, rentals, and rooms.",
};

export async function GET() {
  try {
    const data = await mewsPost("rates/getAll", {
      ServiceIds: [STAYS_SERVICE_ID],
      Extent: {
        Rates: true,
        RateGroups: false,
        RateRestrictions: false,
      },
    });

    const allRates = (data.Rates || [])
      .filter(
        (r: { IsActive: boolean; IsPublic: boolean }) => r.IsActive && r.IsPublic
      )
      .map(
        (r: {
          Id: string;
          Name: string | Record<string, string>;
          ShortName: string | Record<string, string>;
          Description: string | Record<string, string>;
        }) => {
          const name =
            typeof r.Name === "string"
              ? r.Name
              : r.Name?.["en-US"] ||
                (typeof r.ShortName === "string"
                  ? r.ShortName
                  : r.ShortName?.["en-US"]) ||
                "Unnamed Rate";

          const rawDesc =
            typeof r.Description === "string"
              ? r.Description
              : r.Description?.["en-US"] || "";

          const description = rawDesc || FALLBACK_DESC[name] || "";

          return {
            id: r.Id,
            name,
            description,
            featured: FEATURED_IDS.has(r.Id),
          };
        }
      );

    // Featured first, then the rest
    const featured = allRates.filter(
      (r: { featured: boolean }) => r.featured
    );
    const others = allRates.filter(
      (r: { featured: boolean }) => !r.featured
    );
    const rates = [...featured, ...others];

    return NextResponse.json({ rates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
