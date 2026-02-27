import { GoogleGenAI } from "@google/genai";

export async function getWeatherInsights(weatherData: any, cityName: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    return "Check the forecast and plan your day accordingly!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The current weather in ${cityName} is ${weatherData.temperature}°C with a weather code of ${weatherData.weatherCode}. 
      The max temp today is ${weatherData.daily.temperatureMax[0]}°C and min is ${weatherData.daily.temperatureMin[0]}°C.
      Provide a brief, friendly 2-sentence insight about what to wear or what activity is best for this weather.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Stay safe and enjoy your day!";
  }
}
