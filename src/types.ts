export interface User {
  id: number;
  username: string;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
  is_favorite: number;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  apparentTemperature: number;
  time: string;
  daily: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    weatherCode: number[];
  };
}
