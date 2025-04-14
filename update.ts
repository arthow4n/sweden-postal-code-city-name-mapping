type PostalCode = {
  city: string;
  postalCode: string;
};

const currentYear = new Date().getFullYear();
// Exit before GitHub Action times out.
const deadline = Date.now() + 5 * 60 * 60 * 1000;
let hasReachedDeadline = false;

const result: Record<string, string> = {};
const fetchStates = await(
  async (): Promise<
    { postalCode: string; city: string | null; fetchedAt: Date }[]
  > => {
    try {
      return JSON.parse(
        await Deno.readTextFile("./fetchStates.json"),
        (key, value) => (key === "fetchedAt" ? new Date(value) : value)
      );
    } catch {
      const past = new Date(currentYear - 1, 0, 1);
      return Array(90000)
        .fill(0)
        .map((_, i) => {
          return {
            postalCode: (i + 10000).toString(),
            city: null,
            fetchedAt: past,
          };
        });
    }
  }
)();

const save = async () => {
  await Deno.writeTextFile(
    "./fetchStates.json",
    JSON.stringify(fetchStates, null, 2)
  );

  await Deno.writeTextFile(
    "./postalcodes.json",
    JSON.stringify(result, null, 2)
  );
};

const fetchPostNumbers = async (prefix: string) => {
  return await fetch(
    `https://www.postnord.se/api/location/get-by-location?countryCode=SE&query=${encodeURIComponent(
      prefix
    )}`
  ).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return (json.postalCodes ?? []) as PostalCode[];
  });
};

// Find the latest 14 March
const lastUpdatePeriodStart =
  new Date() > new Date(currentYear, 2, 14)
    ? new Date(currentYear, 2, 14)
    : new Date(currentYear - 1, 2, 14);

for (const fetchState of fetchStates) {
  if (!hasReachedDeadline) {
    hasReachedDeadline = Date.now() >= deadline;
    if (hasReachedDeadline) {
      console.log(
        `${new Date().toISOString()} Reached deadline, wrapping up the work...`
      );
    }
  }

  if (!hasReachedDeadline && fetchState.fetchedAt < lastUpdatePeriodStart) {
    console.log(
      `${new Date().toISOString()} Fetching for ${fetchState.postalCode}`
    );
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2100);
    });

    try {
      const codes = await fetchPostNumbers(fetchState.postalCode);
      fetchState.city =
        codes.find((code) => code.postalCode === fetchState.postalCode)?.city ??
        null;
      fetchState.fetchedAt = new Date();
    } catch {
      // Commit the current progress if the API seems to be down for any reason.
      hasReachedDeadline = true;
    }
  }

  // Always reconstruct postalcodes.json even with outdated data.
  if (fetchState.city) {
    result[fetchState.postalCode] = fetchState.city;
  }
}

await save();
