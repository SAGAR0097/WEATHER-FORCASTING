import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WEATHER_INTERPRETATION: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "Sun" },
  1: { label: "Mainly clear", icon: "CloudSun" },
  2: { label: "Partly cloudy", icon: "CloudSun" },
  3: { label: "Overcast", icon: "Cloud" },
  45: { label: "Fog", icon: "CloudFog" },
  48: { label: "Depositing rime fog", icon: "CloudFog" },
  51: { label: "Drizzle: Light", icon: "CloudDrizzle" },
  53: { label: "Drizzle: Moderate", icon: "CloudDrizzle" },
  55: { label: "Drizzle: Dense intensity", icon: "CloudDrizzle" },
  61: { label: "Rain: Slight", icon: "CloudRain" },
  63: { label: "Rain: Moderate", icon: "CloudRain" },
  65: { label: "Rain: Heavy intensity", icon: "CloudRain" },
  71: { label: "Snow fall: Slight", icon: "CloudSnow" },
  73: { label: "Snow fall: Moderate", icon: "CloudSnow" },
  75: { label: "Snow fall: Heavy intensity", icon: "CloudSnow" },
  95: { label: "Thunderstorm: Slight or moderate", icon: "CloudLightning" },
};
