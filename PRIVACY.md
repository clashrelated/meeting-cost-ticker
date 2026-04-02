# Privacy Policy

Last updated: April 2, 2026

Meeting Cost Ticker is a Chrome extension that shows a live estimate of meeting cost during Google Meet and Zoom calls. This Privacy Policy explains what the extension accesses, what it stores, and how that information is used.

## Summary

- Meeting Cost Ticker does not require an account.
- Meeting Cost Ticker does not sell personal data.
- Meeting Cost Ticker does not run its own backend and does not send your meeting data to the developer's servers.
- Most extension data stays in your browser storage.
- If you choose to use sharing features, the content you choose to share may be sent to the service you selected, such as X/Twitter or WhatsApp.

## Information the Extension Stores

The extension stores the following settings in `chrome.storage.sync`:

- team size
- average annual salary
- selected currency
- selected view mode

The extension stores the following meeting history data in `chrome.storage.local`:

- meeting date and time
- meeting duration
- calculated meeting cost
- calculated personal share of the meeting cost
- team size used for the calculation
- salary value used for the calculation
- selected currency
- selected view mode
- your optional ROI rating for a meeting

The extension also stores a temporary dismissal flag in page `sessionStorage` when you close the on-page ticker so it stays dismissed for that page session.

## How the Extension Uses Information

Meeting Cost Ticker uses stored information only to provide the extension's features, including:

- calculating live meeting cost
- showing weekly stats and recent meeting history
- restoring your saved settings
- saving your optional ROI feedback for past meetings
- generating an optional share card or share text when you ask it to

## Information the Extension Accesses on Websites

The extension runs on:

- `https://meet.google.com/*`
- `https://zoom.us/*`

On those pages, the extension checks page elements to determine whether a meeting is active so it can show or hide the ticker and summary UI. The extension is designed to calculate time-based cost information and does not intentionally collect or transmit meeting audio, video, chat messages, participant lists, transcripts, calendar details, or meeting content to the developer.

## Sharing and External Services

Meeting Cost Ticker includes optional sharing actions that you trigger yourself.

If you choose to use these features, the extension may:

- copy share text to your clipboard
- invoke your browser or device's native share flow
- open a sharing URL for X/Twitter
- open a sharing URL for WhatsApp

When you use those optional features, the text or image you choose to share may be handled by the destination platform or your browser according to their own privacy practices.

## Data Storage and Retention

- Settings are stored in `chrome.storage.sync`, which may be synchronized by your browser provider across devices if you have browser sync enabled.
- Meeting history is stored in `chrome.storage.local` on your device.
- The extension currently keeps up to the most recent 100 meeting history records.
- You can clear meeting history from the extension popup.

## What the Extension Does Not Do

Meeting Cost Ticker does not:

- create a user account for you
- collect payment information
- use analytics or advertising trackers
- send your meeting history or salary settings to the developer's servers
- read your email, contacts, files, webcam, or microphone

## Security

The extension is designed to keep its core data in browser storage and process calculations locally in your browser. No method of electronic storage is perfect, but the extension is intentionally built to minimize data sharing by avoiding a developer-operated backend.

## Children's Privacy

Meeting Cost Ticker is not directed to children under 13, and the developer does not knowingly collect personal information from children through the extension.

## Changes to This Policy

This Privacy Policy may be updated from time to time to reflect product, legal, or operational changes. The updated version will be posted at the current policy URL with a revised "Last updated" date.

## Contact

If you have questions about this Privacy Policy, contact the publisher through the support or contact details provided on the extension listing or repository.
