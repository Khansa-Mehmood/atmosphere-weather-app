// 🔑 Replace with your actual OpenWeatherMap API Key
const API_KEY = "YOUR_API_KEY_HERE";

// Select UI Elements
const cityInput = document.getElementById("cityInput");
const locationBtn = document.getElementById("locationBtn");
const cityNameDisplay = document.getElementById("cityNameDisplay");

const tempDisplay = document.getElementById("tempDisplay");
const weatherEmoji = document.getElementById("weatherEmoji");
const weatherDesc = document.getElementById("weatherDesc");
const highTemp = document.getElementById("highTemp");
const lowTemp = document.getElementById("lowTemp");

const humidityDisplay = document.getElementById("humidityDisplay");
const windDisplay = document.getElementById("windDisplay");
const feelsLikeDisplay = document.getElementById("feelsLikeDisplay");
const uvDisplay = document.getElementById("uvDisplay");

const forecastGrid = document.getElementById("forecastGrid");
const errorBanner = document.getElementById("errorBanner");
const errorMsg = document.getElementById("errorMsg");

// 1. Fetch Weather by City using Open-Meteo Geocoding
async function getWeatherByCity(city) {
  try {
    hideError();
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("Location not found. Try searching another city!");
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    fetchWeatherData(latitude, longitude, `${name}, ${country}`);
  } catch (err) {
    showError(err.message);
  }
}

// 2. Fetch Detailed Current & Forecast Weather Data
async function fetchWeatherData(lat, lon, locationLabel) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load weather data.");

    const data = await res.json();
    renderUI(data, locationLabel);
  } catch (err) {
    showError(err.message);
  }
}

// 3. Render Dashboard UI
function renderUI(data, locationLabel) {
  const current = data.current;
  const daily = data.daily;

  cityNameDisplay.innerText = locationLabel;
  tempDisplay.innerText = Math.round(current.temperature_2m);
  humidityDisplay.innerText = `${current.relative_humidity_2m}%`;
  windDisplay.innerText = `${Math.round(current.wind_speed_10m)} km/h`;
  feelsLikeDisplay.innerText = `${Math.round(current.apparent_temperature)}°C`;
  uvDisplay.innerText = `${Math.round(daily.uv_index_max[0])} High`;

  highTemp.innerText = `${Math.round(daily.temperature_2m_max[0])}°C`;
  lowTemp.innerText = `${Math.round(daily.temperature_2m_min[0])}°C`;

  // Determine Condition Info
  const condition = getWeatherInfo(current.weather_code);
  weatherEmoji.innerText = condition.emoji;
  weatherDesc.innerText = condition.text;
  document.body.className = condition.themeClass;

  // Build 5-Day Forecast
  forecastGrid.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const date = new Date(daily.time[i]);
    const dayName = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
    const fCond = getWeatherInfo(daily.weather_code[i]);

    const cardHtml = `
      <div class="forecast-card">
        <div class="day">${dayName}</div>
        <div class="f-emoji">${fCond.emoji}</div>
        <div class="f-temp">${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</div>
      </div>
    `;
    forecastGrid.insertAdjacentHTML("beforeend", cardHtml);
  }
}

// Helper to map weather codes to stickers & themes
function getWeatherInfo(code) {
  if (code === 0) return { emoji: "☀️", text: "Clear Sky", themeClass: "theme-clear" };
  if (code >= 1 && code <= 3) return { emoji: "⛅", text: "Partly Cloudy", themeClass: "theme-clouds" };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { emoji: "🌧️", text: "Rainy", themeClass: "theme-rain" };
  if (code >= 71 && code <= 77) return { emoji: "❄️", text: "Snowy", themeClass: "theme-snow" };
  if (code >= 95) return { emoji: "⛈️", text: "Thunderstorm", themeClass: "theme-thunder" };
  return { emoji: "🌫️", text: "Foggy", themeClass: "theme-clouds" };
}

// Geolocation
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude, "Your Location"),
      () => showError("Location permission denied.")
    );
  } else {
    showError("Geolocation unsupported.");
  }
}

function showError(msg) {
  errorBanner.classList.remove("hidden");
  errorMsg.innerText = msg;
}

function hideError() {
  errorBanner.classList.add("hidden");
}

// Listeners
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && cityInput.value.trim() !== "") {
    getWeatherByCity(cityInput.value.trim());
  }
});

locationBtn.addEventListener("click", getUserLocation);

// Default starting location
getWeatherByCity("New York");