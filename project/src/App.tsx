import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Download, Pause, Volume2, Trash2, Settings } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

interface VoiceSample {
  id: string;
  name: string;
  duration: number;
  date: string;
  audioUrl: string;
  blob: Blob;
}

interface VoiceSettings {
  speed: number;
  pitch: number;
  emphasis: number;
}

interface ServerConfig {
  url: string;
  port: string;
}

function App() {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [text, setText] = useState('');
  const [settings, setSettings] = useState<VoiceSettings>({
    speed: 1,
    pitch: 1,
    emphasis: 1,
  });
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    url: 'http://localhost',
    port: '5000',
  });
  const [isRecording, setIsRecording] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioElementRef.current = new Audio();
    audioElementRef.current.addEventListener('ended', () => {
      setCurrentlyPlaying(null);
    });

    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.removeEventListener('ended', () => {
          setCurrentlyPlaying(null);
        });
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newSample: VoiceSample = {
          id: Date.now().toString(),
          name: `Sample ${samples.length + 1}`,
          duration,
          date: new Date().toLocaleDateString(),
          audioUrl,
          blob: audioBlob,
        };

        setSamples((prevSamples) => [...prevSamples, newSample]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const handleRecord = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Voice recording is not supported in your browser');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePlayPause = (sample: VoiceSample) => {
    if (currentlyPlaying === sample.id) {
      audioElementRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.src = sample.audioUrl;
        audioElementRef.current.play();
        setCurrentlyPlaying(sample.id);
      }
    }
  };

  const handleDeleteSample = (sampleId: string) => {
    setSamples(samples.filter(sample => sample.id !== sampleId));
    toast.success('Sample deleted');
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to generate speech');
      return;
    }
    if (samples.length === 0) {
      toast.error('Please record at least one voice sample');
      return;
    }

    setIsGenerating(true);
    const serverUrl = `${serverConfig.url}:${serverConfig.port}`;

    try {
      // Create form data with samples and text
      const formData = new FormData();
      samples.forEach((sample, index) => {
        formData.append(`sample_${index}`, sample.blob, `sample_${index}.wav`);
      });
      formData.append('text', text);
      formData.append('speed', settings.speed.toString());
      formData.append('pitch', settings.pitch.toString());

      const response = await axios.post(`${serverUrl}/generate`, formData, {
        responseType: 'blob',
      });

      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setGeneratedAudio(audioUrl);
      toast.success('Speech generated successfully');
    } catch (error) {
      console.error('Error generating speech:', error);
      toast.error('Failed to generate speech. Is the TTS server running?');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedAudio) {
      const link = document.createElement('a');
      link.href = generatedAudio;
      link.download = 'generated-speech.wav';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto p-6">
        <header className="text-center mb-10 relative">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="absolute right-0 top-0 text-gray-600 hover:text-gray-900"
          >
            <Settings size={24} />
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Voice Clone Studio</h1>
          <p className="text-gray-600">Create natural-sounding voiceovers for your content</p>
        </header>

        {showConfig && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Server Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server URL
                </label>
                <input
                  type="text"
                  value={serverConfig.url}
                  onChange={(e) => setServerConfig({ ...serverConfig, url: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="text"
                  value={serverConfig.port}
                  onChange={(e) => setServerConfig({ ...serverConfig, port: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Voice Samples Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Voice Samples</h2>
              <button
                onClick={handleRecord}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isRecording
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
                {isRecording ? 'Stop Recording' : 'Record Sample'}
              </button>
            </div>

            <div className="space-y-3">
              {samples.map((sample) => (
                <div
                  key={sample.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{sample.name}</h3>
                    <p className="text-sm text-gray-500">
                      {sample.duration}s • {sample.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handlePlayPause(sample)}
                      className="text-gray-600 hover:text-blue-500"
                    >
                      {currentlyPlaying === sample.id ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button 
                      onClick={() => handleDeleteSample(sample.id)}
                      className="text-gray-600 hover:text-red-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {samples.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No voice samples yet. Start by recording one!
                </p>
              )}
            </div>
          </div>

          {/* Text-to-Speech Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Generate Speech</h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to speech..."
              className="w-full h-32 p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="space-y-4 mb-4">
              <div>
                <label className="flex items-center justify-between text-sm text-gray-600">
                  Speed
                  <span>{settings.speed}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.speed}
                  onChange={(e) =>
                    setSettings({ ...settings, speed: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm text-gray-600">
                  Pitch
                  <span>{settings.pitch}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.pitch}
                  onChange={(e) =>
                    setSettings({ ...settings, pitch: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                  isGenerating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Volume2 size={20} />
                {isGenerating ? 'Generating...' : 'Generate Speech'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!generatedAudio}
                className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg ${
                  generatedAudio
                    ? 'border-gray-300 hover:bg-gray-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Download size={20} />
              </button>
            </div>

            {generatedAudio && (
              <div className="mt-4">
                <audio controls className="w-full" src={generatedAudio} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;