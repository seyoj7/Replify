# Replify

Replify is a Chrome Extension and Python backend that generates AI-powered replies for X (Twitter) posts. It uses NVIDIA's Llama 3.1 70B model to generate context-aware, customized replies based on your preferences.

## Features

*   **Context-Aware Replies:** Automatically extracts the tweet text from your active X/Twitter tab to generate relevant replies.
*   **Customizable Tone:** Choose from Friendly, Professional, Sarcastic, Blunt, Deep, Roast, or specify a Custom tone.
*   **Variable Length & Variations:** Control whether you want very short, short, or long replies, and generate up to 5 variations at once.
*   **Custom Instructions:** Add specific context or rules (e.g., "Never use hashtags", "Always agree first").
*   **Emoji Control:** Toggle whether you want the AI to include emojis in the replies.
*   **Reply History:** Keeps a history of your recently generated replies so you can easily copy them later.
*   **One-Click Copy:** Easily copy generated replies to your clipboard.

## Architecture

Replify consists of two main components:

1.  **Chrome Extension (Frontend):** A Manifest V3 extension that provides the user interface (popup) for configuring preferences, triggering reply generation, and displaying results/history. It extracts tweet text directly from the DOM of the active X/Twitter tab.
2.  **FastAPI Backend (Python):** A server that acts as a proxy between the extension and the NVIDIA API. It constructs the prompt based on the user's settings and the extracted tweet text, calls the Llama 3.1 70B model, and returns the generated replies.

## Setup Instructions

### Prerequisites

*   Python 3.8+
*   Google Chrome or a Chromium-based browser
*   NVIDIA API Key

### Backend Setup

1.  Navigate to the root directory of the project.
2.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  Create a `.env` file in the root directory and add your NVIDIA API key:
    ```env
    NVIDIA_API_KEY=your_api_key_here
    ```
4.  Start the FastAPI server:
    ```bash
    python server.py
    ```
    The server will start on `http://127.0.0.1:8000`.

### Extension Setup

1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked** and select the `extension` folder within this project.
4.  The Replify extension icon should now appear in your browser toolbar.

## Usage

1.  Make sure the Python backend server is running.
2.  Navigate to a post on X (Twitter).
3.  Click the Replify extension icon.
4.  Optionally, click the Settings icon (gear) to configure your desired tone, length, variations, etc.
5.  In the Generator view, the URL of the active tab should automatically be used, or you can paste a specific X post URL.
6.  Click **Generate Replies**. The extension will extract the text from the page and ask the backend to generate replies.
7.  Click the copy icon next to a reply you like and paste it into the X reply field.
