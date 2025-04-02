import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as ical from "npm:node-ical";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const withCors = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const { icsUrl, educatorId } = await req.json();

    if (!icsUrl || !educatorId) {
      return withCors({ error: "Missing icsUrl or educatorId" }, 400);
    }

    const icsRes = await fetch(icsUrl);
    if (!icsRes.ok) {
      return withCors({ error: "Failed to fetch ICS file" }, 500);
    }

    const icsText = await icsRes.text();

    // Strip problematic HTML comment lines (Outlook-specific)
    const cleanedIcsText = icsText
      .split("\n")
      .filter((line) => !line.trim().startsWith("<!--"))
      .join("\n");

    const parsedData = ical.parseICS(cleanedIcsText);

    // DEBUG: Log how many total entries were found
    const totalParsed = Object.keys(parsedData).length;
    console.log(`Total parsed ICS entries: ${totalParsed}`);

    // Filter only VEVENT types
    const events = Object.values(parsedData).filter((event: any) => {
      const isValid = event?.type === "VEVENT" && event?.start && event?.end;
      if (!isValid) {
        console.log("Skipped non-event or incomplete item:", event);
      }
      return isValid;
    });

    console.log(`Parsed ${events.length} valid VEVENTs`);

    if (events.length === 0) {
      return withCors({ message: "No valid calendar events found." }, 200);
    }

    const entries = events.map((event: any) => ({
      fkEducatorID: educatorId,
      start_datetime: new Date(event.start).toISOString(),
      end_datetime: new Date(event.end).toISOString(),
      summary: event.summary || "Available",
      is_all_day:
        event.datetype === "date" ||
        (!event.start.getHours && !event.end.getHours),
    }));

    const { error } = await supabase.from("availability").insert(entries);

    if (error) {
      console.error("Supabase insert error:", error);
      return withCors({ error: error.message }, 500);
    }

    return withCors({ message: `Imported ${entries.length} events.` }, 200);
  } catch (err) {
    console.error("Unexpected error:", err);
    return withCors({ error: err.message }, 500);
  }
});
