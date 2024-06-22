# Calendar Travel Time Adjustment Script

## Overview
This Google Apps Script automatically adjusts travel events in your Google Calendar that were created by Reclaim.ai. It uses the Google Maps API to calculate more accurate travel times based on real-time traffic data and applies custom time-based multipliers for rush hours and busy periods.

## Features
- Identifies events with locations in your Google Calendar
- Finds associated travel events created by Reclaim.ai
- Calculates travel times using Google Maps API, considering traffic conditions
- Applies custom multipliers for rush hours and busy weekend times
- Adjusts the duration of existing travel events
- Works for a configurable number of days into the future

## Prerequisites
1. A Google account with access to Google Calendar and Google Apps Script
2. A Google Cloud Project with the Distance Matrix API enabled
3. An API key for the Google Maps API
4. Reclaim.ai set up with your Google Calendar

## Setup
1. Create a new Google Apps Script project:
   - Go to [script.google.com](https://script.google.com/)
   - Click on "New project"
   - Delete any existing code in the script editor

2. Copy the entire contents of `calendar_travel_time_adjustment.gs` from this repository and paste it into your Google Apps Script editor.

3. Configure the script:
   In the configuration section at the top of the script, update the following variables:
   - `CALENDAR_ID`: Replace with your Google Calendar ID (e.g., 'your_email@gmail.com' or the ID of a specific calendar)
   - `HOME_ADDRESS`: Update with your home or default starting location (e.g., '123 Main St, Anytown, ST 12345')
   - `API_KEY`: Replace with your Google Maps API key
   - Adjust other configuration variables as needed:
     - `DAYS_TO_PROCESS`: Number of days to look ahead in the calendar
     - `TRAVEL_EVENT_PREFIX`: The prefix used by Reclaim.ai for travel events (default is '🚌 Travel')
     - `MAX_HOURS_BEFORE_AFTER`: Maximum hours to look before/after an event for travel events
     - Time-based multipliers and rush hour definitions

4. Save the project by clicking on File > Save or using the floppy disk icon.

## Usage
### Manual Execution
1. In the Google Apps Script editor, select the `adjustTravelEvents` function from the dropdown menu next to the "Run" button.
2. Click "Run" to execute the script.
3. The first time you run the script, you'll need to authorize it to access your Google Calendar and make external API requests.
4. Check the execution log for any errors or messages.

### Automatic Execution (Recommended)
To have the script run automatically:
1. In the Google Apps Script editor, click on "Triggers" (clock icon) in the left sidebar.
2. Click "+ Add Trigger" at the bottom right of the page.
3. Set up the trigger with the following settings:
   - Choose which function to run: `adjustTravelEvents`
   - Choose which deployment should run: `Head`
   - Select event source: `Time-driven`
   - Select type of time based trigger: `Day timer`
   - Select time of day: Choose a time when your calendar is least likely to be in use (e.g., 2:00 AM to 3:00 AM)
4. Click "Save"

The script will now run automatically once per day, adjusting travel events for the upcoming days as configured.

## How It Works
1. The script fetches all events for the configured number of days ahead.
2. For each event with a location:
   - It looks for associated travel events created by Reclaim.ai (identified by the `TRAVEL_EVENT_PREFIX`).
   - If found, it calculates the travel time using the Google Maps API, considering traffic conditions.
   - It applies time-based multipliers for rush hours and busy periods.
   - It adjusts the duration of the travel events based on the calculated travel time.

## Customization
You can customize the script by modifying the following variables in the configuration section:
- `DAYS_TO_PROCESS`: Number of days to look ahead in the calendar
- `MAX_HOURS_BEFORE_AFTER`: Maximum hours to look before/after an event for travel events
- `WEEKDAY_RUSH_HOUR_MULTIPLIER` and `WEEKEND_BUSY_HOUR_MULTIPLIER`: Adjust these to change how much extra time is added during busy periods
- `WEEKDAY_RUSH_HOURS` and `WEEKEND_BUSY_HOURS`: Modify these to match the typical busy hours in your area

## Troubleshooting
- If you encounter errors, check the execution log in the Google Apps Script editor for detailed error messages.
- Ensure your Google Maps API key is valid and has the necessary permissions.
- Verify that your Calendar ID is correct and that you have access to the calendar.
- If travel events are not being adjusted, make sure the `TRAVEL_EVENT_PREFIX` matches the prefix used by Reclaim.ai in your calendar.

## Contributing
Contributions to improve the script are welcome. Please feel free to submit a pull request or create an issue if you have any suggestions or encounter any problems.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer
This script is provided as-is, without any guarantees. Please use it responsibly and ensure you have the necessary permissions to modify your calendar events and use the Google Maps API.
