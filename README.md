# ReclaimRoadmaster

This Google Apps Script automatically adjusts travel events in your Google Calendar based on the location of your events and calculated travel times using the Google Maps API. It's designed to work in conjunction with Reclaim.ai, enhancing the travel time estimates for more accurate scheduling.

## Features

- Calculates precise travel times considering real-time traffic conditions
- Adjusts travel times for rush hours and weekends
- Updates existing travel events created by Reclaim.ai
- Processes events for a configurable number of days ahead
- Customizable configuration for various parameters

## Prerequisites

Before you can use this script, you need to:

1. Have a Google account with access to Google Calendar and Google Apps Script
2. Set up a Google Cloud Project and enable the Distance Matrix API
3. Create an API key with access to the Distance Matrix API
4. Have Reclaim.ai set up with your Google Calendar (optional, but recommended)

## Setup

1. Create a new Google Apps Script project:
   - Go to [script.google.com](https://script.google.com/)
   - Click on "New project"
   - Delete any existing code in the script editor

2. Copy the entire contents of `calendar_travel_time_adjustment.gs` from this repository and paste it into your Google Apps Script editor.

3. In the script, locate the `CONFIGURATION SECTION` and update the following variables:
   - `CALENDAR_ID`: Your Google Calendar ID
   - `HOME_ADDRESS`: Your home or starting address for travel calculations
   - `API_KEY`: Your Google Maps API key
   - Adjust other configuration variables as needed (e.g., `DAYS_TO_PROCESS`, `TRAVEL_EMOJI`, etc.)

4. Save the project by clicking on File > Save or using the floppy disk icon.

## Usage

### Manual Execution

To run the script manually:

1. Uncomment the last line of the script: `// adjustTravelEvents();`
2. Click on "Run" in the Google Apps Script editor
3. Grant the necessary permissions when prompted
4. Check the execution log for any errors or messages

### Automatic Execution (Recommended)

To have the script run automatically:

1. In the Google Apps Script editor, click on "Triggers" (clock icon) in the left sidebar
2. Click "+ Add Trigger" at the bottom right of the page
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
   - It calculates the travel time from your home address using the Google Maps API.
   - It applies time-based multipliers for rush hours and busy weekend times.
   - It finds the corresponding travel event (created by Reclaim.ai) and adjusts its duration.
   - If no travel event exists, it creates a new one.
3. The script also handles return trips by adjusting or creating travel events after each location-based event.

## Interaction with Reclaim.ai

This script is designed to work alongside Reclaim.ai:

- Reclaim.ai creates initial travel events based on your calendar events with locations.
- This script then refines those travel events by calculating more precise travel times based on real-time traffic data and time-of-day considerations.
- The script updates the existing Reclaim.ai travel events rather than creating duplicates.

## Troubleshooting

- If you encounter errors, check the execution log in the Google Apps Script editor for detailed error messages.
- Ensure your Google Maps API key is valid and has the necessary permissions.
- Verify that your Calendar ID is correct and that you have access to the calendar.
- If travel events are not being adjusted, make sure the `TRAVEL_EMOJI` in the configuration matches the one used by Reclaim.ai.

## Contributing

Contributions to improve the script are welcome. Please feel free to submit a pull request or create an issue if you have any suggestions or encounter any problems.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This script is provided as-is, without any guarantees. Please use it responsibly and ensure you have the necessary permissions to modify your calendar events.
