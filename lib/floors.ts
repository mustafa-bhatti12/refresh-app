/** Fixed office floors — not stored in a floors table. */
export const OFFICE_FLOORS = [
  "Basement",
  "Ground Floor",
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "4th Floor",
] as const;

export type OfficeFloor = (typeof OFFICE_FLOORS)[number];
