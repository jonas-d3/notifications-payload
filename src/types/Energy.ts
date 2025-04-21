export type EnergyLevel = "" | "zzz" | "low" | "med" | "hi";
export type EnergyDataPoint = {
  time: string;
  value: EnergyLevel;
};
