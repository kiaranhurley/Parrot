# Voice Cloning Application

A browser-based application for voice cloning using Coqui TTS.

## Features

- Record voice samples directly in the browser
- Manage and preview recorded samples
- Generate speech that mimics your voice using Coqui's YourTTS model
- Adjust speech parameters (speed, pitch)
- Preview and download generated audio

## Setup

### Web Interface

1. Install dependencies:
```
npm install
```

2. Start the application:
```
npm run dev
```

### TTS Server

1. Install required Python packages:
```
pip install TTS flask flask-cors
```

2. Run the server:
```
python tts_server.py
```

3. Configure the server URL in the web interface settings (default: http://localhost:5000)

## Usage

1. Record several voice samples using the microphone button
2. Enter the text you want to convert to speech
3. Adjust parameters as needed
4. Click "Generate Speech"
5. Preview and download the generated audio

## Technical Implementation

The application consists of two main components:

### Web Interface
- Built with React and TypeScript
- Uses Web Audio API and MediaRecorder for voice recording
- Provides intuitive UI for managing samples and generating speech

### Server Component
- Flask-based Python server
- Integrates Coqui TTS with YourTTS model for voice cloning
- Processes voice samples and generates speech that mimics the provided voice

## Requirements

- Modern web browser with microphone access
- Node.js and npm for the web interface
- Python 3.7+ for the TTS server
- Approximately 1GB storage for the YourTTS model (downloaded on first run)

## Privacy

All voice processing happens locally on your machine. Voice samples and generated audio remain on your computer and are not sent to external servers.
