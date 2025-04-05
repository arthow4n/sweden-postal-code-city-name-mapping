type PostalCode = {
  city: string;
  postalCode: string;
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

const postalCodeCityNameMapping: Record<string, string> = {};
const range = Array(90000)
  .fill(0)
  .map((v, i) => (i + 10000).toString());

for (const postalCode of range) {
  console.log(
    `${new Date().toISOString()} Fetching for ${postalCode}/${range.length}`
  );
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 3000);
  });
  const codes = await fetchPostNumbers(postalCode);
  for (const code of codes) {
    postalCodeCityNameMapping[code.postalCode] = code.city;
  }
}

await Deno.writeTextFile(
  "./postalcodes.json",
  JSON.stringify(postalCodeCityNameMapping, null, 2)
);
