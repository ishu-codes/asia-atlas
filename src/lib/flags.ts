/**
 * Every ethnicity currently present in the database maps to an ISO 3166-1
 * alpha-2 country code. Values are the lower-case codes used by flag-icons
 * (`fi fi-kr`). Ethnicities that are not in this record fall back to a globe
 * icon in the UI.
 */
export const ETHNICITY_TO_COUNTRY: Record<string, string> = {
  Chinese: "cn",
  Filipino: "ph",
  Indonesian: "id",
  Japanese: "jp",
  Korean: "kr",
  Malaysian: "my",
  Thai: "th",
  Vietnamese: "vn",
};

export function countryCodeForEthnicity(ethnicity: string): string | undefined {
  return ETHNICITY_TO_COUNTRY[ethnicity];
}
