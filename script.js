// Dark Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Update the year dynamically
document.getElementById('current-year').textContent = new Date().getFullYear();

// Check for saved theme in localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
    updateButtonText();
}

// Toggle Dark/Light Mode
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark-mode' : '');
    updateButtonText();
});

// Update Button Text
function updateButtonText() {
    if (body.classList.contains('dark-mode')) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
}


// Weather API Integration
const apiKey = '460c49a6f77b70e347a316f50cc24de3'; // Replace with your API key
const newsApiKey = '6c15bdd9a6da4673a7f467053cf1bac7'; // Replace with your News API key
const searchButton = document.getElementById('search-button');
const saveLocationButton = document.getElementById('save-location');
const locationInput = document.getElementById('location-input');
const weeklyWeather = document.getElementById('weekly-weather');
const savedLocationsList = document.getElementById('saved-locations');
const radarMap = document.getElementById('radar-map');
const newsUpdates = document.getElementById('news-updates');

// Chart Instances
let temperatureChart, rainfallWindChart;

// Saved Locations
let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

// Default Location
const defaultLocation = 'New York';

// Load saved locations and fetch weather for default location on page load
renderSavedLocations();
fetchWeather(defaultLocation);
fetchWeeklyWeather(defaultLocation);
updateRadarMap(defaultLocation);
fetchNews(defaultLocation);

// Event Listeners
searchButton.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        fetchWeather(location);
        fetchWeeklyWeather(location);
        updateRadarMap(location);
        fetchNews(location);
    }
});

saveLocationButton.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location && !savedLocations.includes(location)) {
        savedLocations.push(location);
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        renderSavedLocations();
    }
});

// Render Saved Locations with Temperature and Remove Option
function renderSavedLocations() {
    savedLocationsList.innerHTML = savedLocations.map(location => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${location}</span>
                    <span id="temp-${location.replace(/\s+/g, '-')}"></span>
                    <button class="btn btn-danger btn-sm" onclick="removeLocation('${location}')">Remove</button>
                </li>
            `).join('');

    // Fetch temperature for saved locations
    savedLocations.forEach(location => {
        fetchWeatherForSavedLocation(location);
    });
}

// Remove Location
function removeLocation(location) {
    savedLocations = savedLocations.filter(loc => loc !== location);
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    renderSavedLocations();
}

// Fetch Weather for Saved Location
async function fetchWeatherForSavedLocation(location) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.cod === 200) {
            const tempElement = document.getElementById(`temp-${location.replace(/\s+/g, '-')}`);
            if (tempElement) {
                tempElement.textContent = `${Math.round(data.main.temp)}°C`;
            }
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

// Fetch Current Weather
async function fetchWeather(location) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.cod === 200) {
            updateWeatherData(data);
        } else {
            alert('Location not found. Please try again.');
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

// Fetch Weekly Weather Forecast
async function fetchWeeklyWeather(location) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.cod === '200') {
            updateWeeklyWeather(data);
            updateCharts(data);
        } else {
            weeklyWeather.innerHTML = '<p class="text-muted">Weekly forecast not available.</p>';
        }
    } catch (error) {
        console.error('Error fetching weekly weather data:', error);
    }
}

// Update Current Weather Data
function updateWeatherData(data) {
    document.getElementById('location-name').textContent = data.name;
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    document.getElementById('feels-like').textContent = Math.round(data.main.feels_like);
    document.getElementById('pressure').textContent = data.main.pressure;
    document.getElementById('humidity').textContent = data.main.humidity;

    // Update weather icon
    const weatherIcon = document.getElementById('weather-icon');
    const iconCode = data.weather[0].icon;
    weatherIcon.className = `fas fa-${getWeatherIcon(iconCode)} weather-icon`;
}

// Update Weekly Weather Forecast
function updateWeeklyWeather(data) {
    const weeklyData = data.list.filter((item, index) => index % 8 === 0); // Get daily data
    weeklyWeather.innerHTML = weeklyData.map(day => `
                <div class="day">
                    <span>${new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span>${Math.round(day.main.temp)}°C</span>
                    <i class="fas fa-${getWeatherIcon(day.weather[0].icon)}"></i>
                </div>
            `).join('');
}

// Update Charts (Temperature, Rainfall, Wind Speed)
function updateCharts(data) {
    const labels = data.list.map(item => new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit' }));
    const temperatures = data.list.map(item => item.main.temp);
    const rainfall = data.list.map(item => item.rain ? item.rain['3h'] || 0 : 0);
    const windSpeed = data.list.map(item => item.wind.speed);

    // Temperature Chart
    if (temperatureChart) temperatureChart.destroy();
    temperatureChart = new Chart(document.getElementById('temperature-chart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: '#4a90e2',
                fill: false,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
            },
        },
    });

    // Rainfall & Wind Speed Chart
    if (rainfallWindChart) rainfallWindChart.destroy();
    rainfallWindChart = new Chart(document.getElementById('rainfall-wind-chart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Rainfall (mm)',
                    data: rainfall,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                },
                {
                    label: 'Wind Speed (m/s)',
                    data: windSpeed,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
            },
        },
    });
}

// Update Radar Map with OpenStreetMap
function updateRadarMap(location) {
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                radarMap.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 1},${lat - 1},${lon + 1},${lat + 1}&layer=mapnik`;
            }
        })
        .catch(error => console.error('Error fetching location coordinates:', error));
}

// Fetch News Updates
async function fetchNews(location) {
    const url = `https://newsapi.org/v2/everything?q=${location} weather&apiKey=${newsApiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'ok') {
            newsUpdates.innerHTML = data.articles.slice(0, 5).map(article => `
                        <div class="news-item mb-3">
                            <h6><a href="${article.url}" target="_blank">${article.title}</a></h6>
                            <p>${article.description}</p>
                        </div>
                    `).join('');
        } else {
            newsUpdates.innerHTML = '<p class="text-muted">No news available for this location.</p>';
        }
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

// Get Weather Icon
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'sun',
        '01n': 'moon',
        '02d': 'cloud-sun',
        '02n': 'cloud-moon',
        '03d': 'cloud',
        '03n': 'cloud',
        '04d': 'cloud',
        '04n': 'cloud',
        '09d': 'cloud-rain',
        '09n': 'cloud-rain',
        '10d': 'cloud-showers-heavy',
        '10n': 'cloud-showers-heavy',
        '11d': 'bolt',
        '11n': 'bolt',
        '13d': 'snowflake',
        '13n': 'snowflake',
        '50d': 'smog',
        '50n': 'smog',
    };
    return iconMap[iconCode] || 'cloud';
}

// Signup and Login Functionality
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');

if (loginButton) {
    loginButton.addEventListener('click', () => {
        alert('Redirecting to login page...');
        // Redirect to login page (you can replace this with actual login logic)
        window.location.href = 'login.html'; // Create a login.html file if needed
    });
}

if (signupButton) {
    signupButton.addEventListener('click', () => {
        alert('Redirecting to signup page...');
        // Redirect to signup page (you can replace this with actual signup logic)
        window.location.href = 'signup.html'; // Create a signup.html file if needed
    });
}