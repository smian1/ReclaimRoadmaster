/**
 * Calendar Travel Time Adjustment Script
 * 
 * This script automatically adjusts travel events in your Google Calendar
 * based on the location of your events and calculated travel times using Google Maps API.
 * It's designed to work in conjunction with Reclaim.ai, which creates initial travel events.
 * 
 * Features:
 * - Calculates precise travel times considering traffic conditions
 * - Adjusts travel times for rush hours and weekends
 * - Updates existing travel events created by Reclaim.ai
 * - Processes events for a configurable number of days ahead
 * 
 * Before using:
 * 1. Set up a Google Cloud Project and enable the Distance Matrix API
 * 2. Create an API key with access to the Distance Matrix API
 * 3. Update the configuration variables in the CONFIGURATION SECTION below
 * 4. Set up a trigger to run this script automatically (recommended daily)
 * 
 * @link https://github.com/smian1/ReclaimRoadmaster
 * @author Salman Mian
 * @version 1.0.0
 */

// ========================= CONFIGURATION SECTION =========================
// Modify these variables as needed

// Your Google Calendar ID
const CALENDAR_ID = 'your-calendar-id@group.calendar.google.com';

// Your home address (starting point for travel calculations)
const HOME_ADDRESS = 'Your Home Address, City, State, ZIP';

// Your Google Maps API key
const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// Number of days to look ahead for events
const DAYS_TO_PROCESS = 10;

// Emoji used for travel events (should match Reclaim.ai's travel event emoji)
const TRAVEL_EMOJI = '🚗';

// Time multipliers for traffic adjustment
const WEEKDAY_RUSH_HOUR_MULTIPLIER = 1.5;
const WEEKEND_BUSY_HOUR_MULTIPLIER = 1.2;

// Rush hour and busy weekend hour definitions
const WEEKDAY_RUSH_HOURS = { start: 7, end: 10, eveningStart: 16, eveningEnd: 19 };
const WEEKEND_BUSY_HOURS = { start: 10, end: 18 };

// Maximum hours to look before/after an event for existing travel events
const MAX_HOURS_BEFORE_AFTER = 3;

// ========================= MAIN FUNCTION =========================

function adjustTravelEvents() {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    
    if (!calendar) {
      Logger.log('Calendar not found. Please check the CALENDAR_ID in the configuration section.');
      return;
    }
    
    const now = new Date();
    const endDate = new Date(now.getTime() + DAYS_TO_PROCESS * 24 * 60 * 60 * 1000);
    const events = calendar.getEvents(now, endDate);
    
    Logger.log(`Adjusting travel events from ${now.toDateString()} to ${endDate.toDateString()}`);
    
    events.forEach(event => {
      if (event.getTitle().includes(TRAVEL_EMOJI)) return; // Skip travel events
      
      const location = event.getLocation();
      if (!location || location.trim() === '' || event.isAllDayEvent()) return;
      
      Logger.log(`Processing event: ${event.getTitle()} at ${event.getStartTime()}`);
      
      const travelTime = calculateTravelTime(HOME_ADDRESS, location, event.getStartTime());
      if (!travelTime) {
        Logger.log('Skipping event due to travel time calculation failure.');
        return;
      }
      
      Logger.log(`Calculated travel time: ${travelTime} minutes`);
      
      const precedingTravelEvent = findPrecedingTravelEvent(calendar, event);
      
      if (precedingTravelEvent) {
        adjustExistingTravelEvent(precedingTravelEvent, event, travelTime);
      } else {
        createNewTravelEvent(calendar, event, travelTime);
      }
      
      adjustOrCreateFollowingTravelEvent(calendar, event, travelTime);
    });
  } catch (error) {
    Logger.log(`An error occurred in adjustTravelEvents: ${error.toString()}`);
  }
}

// ========================= HELPER FUNCTIONS =========================

function calculateTravelTime(origin, destination, arrivalTime) {
  const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&departure_time=now&traffic_model=pessimistic&key=${API_KEY}`;
  
  try {
    const response = UrlFetchApp.fetch(distanceMatrixUrl);
    const result = JSON.parse(response.getContentText());
    
    if (result.status === 'OK' && result.rows[0].elements[0].status === 'OK') {
      const durationValue = result.rows[0].elements[0].duration_in_traffic?.value || result.rows[0].elements[0].duration.value;
      
      if (!durationValue) {
        Logger.log('Error: Unable to find duration in API response.');
        return null;
      }
      
      const adjustedDuration = applyTimeBasedMultiplier(durationValue, arrivalTime);
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

function applyTimeBasedMultiplier(duration, arrivalTime) {
  const hour = arrivalTime.getHours();
  const dayOfWeek = arrivalTime.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
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
  
  Logger.log(`Applying multiplier of ${multiplier} to duration`);
  return duration * multiplier;
}

function findPrecedingTravelEvent(calendar, event) {
  const searchStart = new Date(event.getStartTime().getTime() - MAX_HOURS_BEFORE_AFTER * 60 * 60 * 1000);
  const precedingEvents = calendar.getEvents(searchStart, event.getStartTime());
  
  return precedingEvents.reverse().find(e => e.getTitle().includes(TRAVEL_EMOJI));
}

function adjustExistingTravelEvent(travelEvent, destinationEvent, travelTimeMinutes) {
  const newStartTime = new Date(destinationEvent.getStartTime().getTime() - travelTimeMinutes * 60 * 1000);
  travelEvent.setTime(newStartTime, destinationEvent.getStartTime());
  Logger.log(`Adjusted existing travel event: ${travelEvent.getTitle()}`);
}

function createNewTravelEvent(calendar, destinationEvent, travelTimeMinutes) {
  const travelStartTime = new Date(destinationEvent.getStartTime().getTime() - travelTimeMinutes * 60 * 1000);
  calendar.createEvent(`${TRAVEL_EMOJI} Travel to ${destinationEvent.getTitle()}`, travelStartTime, destinationEvent.getStartTime());
  Logger.log(`Created new travel event for: ${destinationEvent.getTitle()}`);
}

function adjustOrCreateFollowingTravelEvent(calendar, sourceEvent, travelTimeMinutes) {
  const searchEnd = new Date(sourceEvent.getEndTime().getTime() + MAX_HOURS_BEFORE_AFTER * 60 * 60 * 1000);
  const followingEvents = calendar.getEvents(sourceEvent.getEndTime(), searchEnd);
  
  const followingTravelEvent = followingEvents.find(event => event.getTitle().includes(TRAVEL_EMOJI));
  
  if (followingTravelEvent) {
    followingTravelEvent.setTime(sourceEvent.getEndTime(), new Date(sourceEvent.getEndTime().getTime() + travelTimeMinutes * 60 * 1000));
    Logger.log(`Adjusted following travel event: ${followingTravelEvent.getTitle()}`);
  } else {
    const travelEndTime = new Date(sourceEvent.getEndTime().getTime() + travelTimeMinutes * 60 * 1000);
    calendar.createEvent(`${TRAVEL_EMOJI} Travel from ${sourceEvent.getTitle()}`, sourceEvent.getEndTime(), travelEndTime);
    Logger.log(`Created new travel event after: ${sourceEvent.getTitle()}`);
  }
}

// To run the script manually, uncomment the following line:
// adjustTravelEvents();
