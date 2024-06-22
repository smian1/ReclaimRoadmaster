/**
 * Calendar Travel Time Adjustment Script (Reclaim.ai Compatible)
 * 
 * This script automatically adjusts existing travel events in your Google Calendar
 * that were created by Reclaim.ai. It uses the Google Maps API to calculate
 * more accurate travel times based on real-time traffic data and custom time-based multipliers.
 * 
 * Features:
 * - Identifies events with locations in your calendar
 * - Finds associated travel events created by Reclaim.ai
 * - Calculates travel times using Google Maps API, considering traffic
 * - Applies custom multipliers for rush hours and busy weekend times
 * - Adjusts the duration of existing travel events
 * - Works for a configurable number of days into the future
 * 
 * Note: This script requires a Google Maps API key and is designed to work
 * specifically with travel events created by Reclaim.ai.
 * 
 * Author: Salman Mian
 * Version: 1.0.1
 * Last Updated: 06/22/2024
 */

// ========================= CONFIGURATION SECTION =========================
// Modify these variables as needed
const CALENDAR_ID = 'your_calendar_id@group.calendar.google.com'; // Replace with your calendar ID
const HOME_ADDRESS = 'Your Home Address, City, State ZIP'; // Your home or default starting location
const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Your Google Maps API key
const DAYS_TO_PROCESS = 3; // Number of days to look ahead in the calendar
const TRAVEL_EVENT_PREFIX = '🚌 Travel'; // Prefix used by Reclaim.ai for travel events
const MAX_HOURS_BEFORE_AFTER = 3; // Maximum hours to look before/after an event for travel events

// Time-based multiplier configuration
const WEEKDAY_RUSH_HOUR_MULTIPLIER = 1.5; // Multiplier for weekday rush hours
const WEEKEND_BUSY_HOUR_MULTIPLIER = 1.2; // Multiplier for busy weekend hours
const WEEKDAY_RUSH_HOURS = { start: 7, end: 10, eveningStart: 16, eveningEnd: 19 }; // Define rush hour times
const WEEKEND_BUSY_HOURS = { start: 10, end: 18 }; // Define busy weekend hours

/**
 * Main function to adjust travel events in the calendar.
 * This function iterates through calendar events, identifies those with locations,
 * and processes them to adjust associated travel events.
 */
function adjustTravelEvents() {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      Logger.log('Calendar not found. Please check the CALENDAR_ID.');
      return;
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + DAYS_TO_PROCESS * 24 * 60 * 60 * 1000);
    const events = calendar.getEvents(now, endDate);

    Logger.log(`Searching for events with locations from ${now.toDateString()} to ${endDate.toDateString()}`);

    events.forEach(event => {
      const location = event.getLocation();
      if (location && location.trim() !== '' && !event.isAllDayEvent() && !event.getTitle().startsWith(TRAVEL_EVENT_PREFIX)) {
        processEventWithLocation(calendar, event);
      }
    });
  } catch (error) {
    Logger.log(`An error occurred: ${error.toString()}`);
  }
}

/**
 * Processes an event with a location, finding and adjusting associated travel events.
 * @param {Calendar} calendar - The Google Calendar object
 * @param {CalendarEvent} mainEvent - The main event with a location
 */
function processEventWithLocation(calendar, mainEvent) {
  const location = mainEvent.getLocation();
  Logger.log(`Processing event with location: "${mainEvent.getTitle()}" at ${location}`);

  const beforeTravelEvent = findTravelEvent(calendar, mainEvent, true);
  const afterTravelEvent = findTravelEvent(calendar, mainEvent, false);

  if (beforeTravelEvent) {
    adjustTravelEvent(beforeTravelEvent, mainEvent, location, true);
  } else {
    Logger.log(`No 'Travel to' event found for "${mainEvent.getTitle()}"`);
  }

  if (afterTravelEvent) {
    adjustTravelEvent(afterTravelEvent, mainEvent, location, false);
  } else {
    Logger.log(`No 'Travel from' event found for "${mainEvent.getTitle()}"`);
  }
}

/**
 * Finds a travel event associated with a main event.
 * @param {Calendar} calendar - The Google Calendar object
 * @param {CalendarEvent} mainEvent - The main event to find travel for
 * @param {boolean} isBefore - Whether to look for a travel event before or after the main event
 * @return {CalendarEvent|null} The found travel event or null if not found
 */
function findTravelEvent(calendar, mainEvent, isBefore) {
  const searchStart = isBefore ? 
    new Date(mainEvent.getStartTime().getTime() - MAX_HOURS_BEFORE_AFTER * 60 * 60 * 1000) :
    mainEvent.getEndTime();
  const searchEnd = isBefore ? 
    mainEvent.getStartTime() :
    new Date(mainEvent.getEndTime().getTime() + MAX_HOURS_BEFORE_AFTER * 60 * 60 * 1000);

  const events = calendar.getEvents(searchStart, searchEnd);

  return events.find(event => 
    event.getTitle().startsWith(TRAVEL_EVENT_PREFIX) &&
    (isBefore ? event.getEndTime().getTime() === mainEvent.getStartTime().getTime() :
                event.getStartTime().getTime() === mainEvent.getEndTime().getTime())
  );
}

/**
 * Adjusts a travel event based on calculated travel time.
 * @param {CalendarEvent} travelEvent - The travel event to adjust
 * @param {CalendarEvent} mainEvent - The associated main event
 * @param {string} location - The location of the main event
 * @param {boolean} isTravelTo - Whether this is a 'travel to' or 'travel from' event
 */
function adjustTravelEvent(travelEvent, mainEvent, location, isTravelTo) {
  Logger.log(`Adjusting ${isTravelTo ? 'Travel to' : 'Travel from'} event for: "${mainEvent.getTitle()}"`);

  const travelTime = calculateTravelTime(
    isTravelTo ? HOME_ADDRESS : location,
    isTravelTo ? location : HOME_ADDRESS,
    isTravelTo ? mainEvent.getStartTime() : mainEvent.getEndTime()
  );

  if (travelTime) {
    const oldStartTime = travelEvent.getStartTime();
    const oldEndTime = travelEvent.getEndTime();

    if (isTravelTo) {
      const newStartTime = new Date(mainEvent.getStartTime().getTime() - travelTime * 60 * 1000);
      travelEvent.setTime(newStartTime, mainEvent.getStartTime());
    } else {
      const newEndTime = new Date(mainEvent.getEndTime().getTime() + travelTime * 60 * 1000);
      travelEvent.setTime(mainEvent.getEndTime(), newEndTime);
    }

    Logger.log(`Adjusted travel event: "${travelEvent.getTitle()}"`);
    Logger.log(`Old time: ${oldStartTime.toLocaleString()} - ${oldEndTime.toLocaleString()}`);
    Logger.log(`New time: ${travelEvent.getStartTime().toLocaleString()} - ${travelEvent.getEndTime().toLocaleString()}`);
    Logger.log(`Travel time: ${travelTime} minutes`);
  } else {
    Logger.log(`Failed to calculate travel time for: "${mainEvent.getTitle()}"`);
  }
}

/**
 * Calculates travel time using Google Maps API.
 * @param {string} origin - Starting point of travel
 * @param {string} destination - End point of travel
 * @param {Date} travelTime - The time of travel
 * @return {number|null} Calculated travel time in minutes, or null if calculation failed
 */
function calculateTravelTime(origin, destination, travelTime) {
  const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&departure_time=${Math.floor(travelTime.getTime() / 1000)}&traffic_model=pessimistic&key=${API_KEY}`;

  try {
    const response = UrlFetchApp.fetch(distanceMatrixUrl);
    const result = JSON.parse(response.getContentText());

    if (result.status === 'OK' && result.rows[0].elements[0].status === 'OK') {
      const durationValue = result.rows[0].elements[0].duration_in_traffic?.value || result.rows[0].elements[0].duration.value;

      if (!durationValue) {
        Logger.log('Error: Unable to find duration in API response.');
        return null;
      }

      const adjustedDuration = applyTimeBasedMultiplier(durationValue, travelTime);
      return Math.ceil(adjustedDuration / 60); // Convert seconds to minutes and round up
    } else {
      Logger.log(`Error in API response: ${JSON.stringify(result)}`);
      return null;
    }
  } catch (error) {
    Logger.log(`Error in calculateTravelTime: ${error.toString()}`);
    return null;
  }
}

/**
 * Applies a time-based multiplier to the travel duration.
 * @param {number} duration - The base travel duration in seconds
 * @param {Date} travelTime - The time of travel
 * @return {number} Adjusted travel duration in seconds
 */
function applyTimeBasedMultiplier(duration, travelTime) {
  const hour = travelTime.getHours();
  const dayOfWeek = travelTime.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  let multiplier = 1;
  
  // Weekday rush hours
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    if ((hour >= WEEKDAY_RUSH_HOURS.start && hour < WEEKDAY_RUSH_HOURS.end) || 
        (hour >= WEEKDAY_RUSH_HOURS.eveningStart && hour < WEEKDAY_RUSH_HOURS.eveningEnd)) {
      multiplier = WEEKDAY_RUSH_HOUR_MULTIPLIER;
    }
  }
  
  // Weekend busy hours
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    if (hour >= WEEKEND_BUSY_HOURS.start && hour < WEEKEND_BUSY_HOURS.end) {
      multiplier = WEEKEND_BUSY_HOUR_MULTIPLIER;
    }
  }
  
  Logger.log(`Applying multiplier of ${multiplier} to duration for time ${travelTime}`);
  return duration * multiplier;
}

// Run the main function
adjustTravelEvents();
