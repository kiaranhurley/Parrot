import axios from 'axios';
import { Bird, Download, Headphones, Mic, Music, Palmtree, Pause, Play, Settings, Trash2, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Custom Parrot icon component
const ParrotIcon = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M8 18l-2 2c-1.5-1.5-1-5 1-8" />
    <path d="M16 18l2 2c1.5-1.5 1-5-1-8" />
    <path d="M7 6c.3-1.2 1.5-2 3-2 2 0 4 1 4 3.5 0 .5 0 1-.5 1.5 2 .5 3 1.5 3 2.5 0 1.5-5 2.5-9 2.5-4.5 0-9-1-9-2.5 0-1 1-2 3-2.5-.5-.5-.5-1-.5-1.5C1 5 3 4 5 4c1.5 0 2.7.8 3 2z" />
    <path d="M12 12c0 1-1 2-2.5 2S7 13 7 12" />
    <path d="M12 12c0 1 1 2 2.5 2s2.5-1 2.5-2" />
    <path d="M7 14.5l-1 3" />
    <path d="M17 14.5l1 3" />
    <path d="M10 10c0 .5-.5 1-1 1s-1-.5-1-1 .5-1 1-1 1 .5 1 1z" />
    <path d="M14 10c0 .5.5 1 1 1s1-.5 1-1-.5-1-1-1-1 .5-1 1z" />
    <path d="M19 4c-.5-1-1.5-2-3-2" />
    <path d="M5 2c-1.5 0-2.5 1-3 2" />
  </svg>
);

// Custom Jungle Tree icon component
const JungleTreeIcon = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22v-7" />
    <path d="M9 10c0-4.5 5-6 8-3" />
    <path d="M15 7c0-2.5-3-2.5-3-2.5s.5-2.5-2-2.5c-1.5 0-2 1-2.5 2" />
    <path d="M7 15c-2 0-3-1-3-1s1-1 2-1 2.5 1 3.5 1 2-1 2-1 1 1 2 1 2.5-1 3.5-1 2 1 2 1-1 1-3 1" />
    <path d="M12 22c-3 0-5-1-5-1s1-1 2-1 2.5 1 3 1 2-1 2-1 1 1 2 1 2-1 3-1 2 1 2 1-2 1-5 1" />
    <path d="M3 11c0-2 1.5-3 3-3s2.5 1 3 2c.5-1 1.5-2 3-2s3 1 3 3" />
  </svg>
);

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [generatedAudioTime, setGeneratedAudioTime] = useState(0);
  const [generatedAudioDuration, setGeneratedAudioDuration] = useState(0);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const generatedAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load samples from localStorage on initial render
  useEffect(() => {
    const loadSamplesFromStorage = () => {
      try {
        const storedSamplesJson = localStorage.getItem('parrotVoiceSamples');
        if (storedSamplesJson) {
          const storedSamplesData = JSON.parse(storedSamplesJson);
          
          // We need to recreate the Blob objects and audio URLs
          const recreatedSamples = storedSamplesData.map((sample: any) => {
            // Convert base64 to Blob
            const binaryString = atob(sample.blobData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/wav' });
            
            // Create new audio URL
            const audioUrl = URL.createObjectURL(blob);
            
            return {
              ...sample,
              blob,
              audioUrl
            };
          });
          
          setSamples(recreatedSamples);
          toast.success('Loaded saved voice samples');
        }
      } catch (error) {
        console.error('Error loading samples from localStorage:', error);
        toast.error('Failed to load saved samples');
      }
    };
    
    loadSamplesFromStorage();
  }, []);

  // Save samples to localStorage whenever they change
  useEffect(() => {
    const saveSamplesToStorage = () => {
      try {
        if (samples.length > 0) {
          // We need to convert Blob to base64 for storage
          const samplesForStorage = samples.map(sample => {
            // Create a FileReader to convert Blob to base64
            return new Promise<any>((resolve) => {
              const reader = new FileReader();
              reader.readAsDataURL(sample.blob);
              reader.onloadend = () => {
                // Extract the base64 data (remove the data URL prefix)
                const base64data = reader.result as string;
                const blobData = base64data.split(',')[1];
                
                resolve({
                  id: sample.id,
                  name: sample.name,
                  duration: sample.duration,
                  date: sample.date,
                  blobData
                });
              };
            });
          });
          
          // Wait for all conversions to complete
          Promise.all(samplesForStorage).then(convertedSamples => {
            localStorage.setItem('parrotVoiceSamples', JSON.stringify(convertedSamples));
          });
        } else {
          // If no samples, clear storage
          localStorage.removeItem('parrotVoiceSamples');
        }
      } catch (error) {
        console.error('Error saving samples to localStorage:', error);
      }
    };
    
    saveSamplesToStorage();
  }, [samples]);

  useEffect(() => {
    audioElementRef.current = new Audio();
    
    // Add event listeners for audio playback
    if (audioElementRef.current) {
      audioElementRef.current.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        setCurrentTime(0);
      });
      
      audioElementRef.current.addEventListener('timeupdate', () => {
        if (audioElementRef.current) {
          setCurrentTime(audioElementRef.current.currentTime);
          setDuration(audioElementRef.current.duration);
        }
      });
    }

    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.removeEventListener('ended', () => {
          setCurrentlyPlaying(null);
          setCurrentTime(0);
        });
        
        audioElementRef.current.removeEventListener('timeupdate', () => {
          if (audioElementRef.current) {
            setCurrentTime(audioElementRef.current.currentTime);
            setDuration(audioElementRef.current.duration);
          }
        });
      }
    };
  }, []);

  // Add effect for generated audio player
  useEffect(() => {
    if (generatedAudioRef.current) {
      const audioElement = generatedAudioRef.current;
      
      const handleTimeUpdate = () => {
        setGeneratedAudioTime(audioElement.currentTime);
        setGeneratedAudioDuration(audioElement.duration);
      };
      
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [generatedAudio]);

  // Add effect for preview audio player
  useEffect(() => {
    if (previewAudioRef.current) {
      const audioElement = previewAudioRef.current;
      
      const handlePreviewEnded = () => {
        setIsPreviewing(false);
      };
      
      audioElement.addEventListener('ended', handlePreviewEnded);
      
      return () => {
        audioElement.removeEventListener('ended', handlePreviewEnded);
      };
    }
  }, [previewAudio]);

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
        // Stop any currently playing audio
        audioElementRef.current.pause();
        
        // Set up the new audio
        audioElementRef.current.src = sample.audioUrl;
        
        // Set the duration once metadata is loaded
        audioElementRef.current.onloadedmetadata = () => {
          if (audioElementRef.current) {
            setDuration(audioElementRef.current.duration);
          }
        };
        
        audioElementRef.current.play();
        setCurrentlyPlaying(sample.id);
      }
    }
  };

  const handleDeleteSample = (sampleId: string) => {
    setSamples(samples.filter(sample => sample.id !== sampleId));
    toast.success('Sample deleted');
    
    // If the deleted sample was playing, stop it
    if (currentlyPlaying === sampleId) {
      audioElementRef.current?.pause();
      setCurrentlyPlaying(null);
    }
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
      link.download = 'parrot-speech.wav';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Function to handle server configuration modal
  const toggleConfigModal = () => {
    setShowConfig(!showConfig);
  };

  // Format time in MM:SS format
  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Function to preview settings with a short sample
  const handlePreviewSettings = async () => {
    if (samples.length === 0) {
      toast.error('Please record at least one voice sample');
      return;
    }
    
    if (!text.trim()) {
      toast.error('Please enter some text to preview');
      return;
    }
    
    // Use just the first sentence or a short portion of text for preview
    const previewText = getPreviewText(text);
    
    setIsPreviewing(true);
    const serverUrl = `${serverConfig.url}:${serverConfig.port}`;

    try {
      // Create form data with samples and text
      const formData = new FormData();
      samples.forEach((sample, index) => {
        formData.append(`sample_${index}`, sample.blob, `sample_${index}.wav`);
      });
      formData.append('text', previewText);
      formData.append('speed', settings.speed.toString());
      formData.append('pitch', settings.pitch.toString());

      const response = await axios.post(`${serverUrl}/generate`, formData, {
        responseType: 'blob',
      });

      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop any currently playing preview
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      
      setPreviewAudio(audioUrl);
      
      // Play the preview automatically
      setTimeout(() => {
        if (previewAudioRef.current) {
          previewAudioRef.current.play();
        }
      }, 100);
      
      toast.success('Playing preview with current settings');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview. Is the TTS server running?');
      setIsPreviewing(false);
    }
  };
  
  // Helper function to get a short preview text
  const getPreviewText = (fullText: string): string => {
    // Try to get the first sentence
    const firstSentence = fullText.split(/[.!?]/).filter(s => s.trim().length > 0)[0];
    
    // If the first sentence is too long, truncate it
    if (firstSentence && firstSentence.length > 100) {
      return firstSentence.substring(0, 100) + '...';
    }
    
    // If we have a reasonable first sentence, use it
    if (firstSentence && firstSentence.length > 0) {
      return firstSentence;
    }
    
    // Otherwise just use a short portion of the text
    return fullText.substring(0, Math.min(100, fullText.length));
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#E5D9B6',
          color: '#191A19',
          border: '1px solid #4E9F3D',
        },
      }} />
      <div className="max-w-4xl mx-auto p-6">
        <header className="text-center mb-10 relative">
          <button
            onClick={toggleConfigModal}
            className="absolute right-0 top-0 text-jungle-primary hover:text-jungle-secondary"
            aria-label="Server Settings"
          >
            <Settings size={24} />
          </button>
          <div className="flex justify-center items-center mb-2">
            <Bird className="text-jungle-secondary mr-2" size={32} strokeWidth={1.5} />
            <h1 className="jungle-title text-4xl">Parrot</h1>
            <Bird className="text-jungle-secondary ml-2" size={32} strokeWidth={1.5} />
          </div>
          <p className="text-jungle-dark">Advanced voice cloning technology</p>
          <div className="absolute -z-10 opacity-10 top-0 right-0">
            <Palmtree size={140} className="text-jungle-primary" strokeWidth={1.5} />
          </div>
          <div className="absolute -z-10 opacity-10 top-0 left-0">
            <Palmtree size={100} className="text-jungle-secondary" strokeWidth={1.5} />
          </div>
        </header>

        {/* Server Configuration Modal */}
        {showConfig && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="jungle-card p-6 max-w-md w-full relative">
              <button 
                onClick={toggleConfigModal}
                className="absolute right-4 top-4 text-jungle-primary hover:text-jungle-danger"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-semibold text-jungle-primary mb-6 flex items-center">
                <Settings size={20} className="mr-2" />
                Server Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-jungle-dark mb-1">
                    Server URL
                  </label>
                  <input
                    type="text"
                    value={serverConfig.url}
                    onChange={(e) => setServerConfig({ ...serverConfig, url: e.target.value })}
                    className="jungle-input w-full p-2"
                    placeholder="http://localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-jungle-dark mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={serverConfig.port}
                    onChange={(e) => setServerConfig({ ...serverConfig, port: e.target.value })}
                    className="jungle-input w-full p-2"
                    placeholder="5000"
                  />
                </div>
                <div className="pt-2">
                  <button 
                    onClick={toggleConfigModal}
                    className="jungle-button-primary w-full py-2"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Voice Samples Panel */}
          <div className="jungle-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-jungle-primary flex items-center">
                <Music size={20} className="mr-2" />
                Voice Samples
              </h2>
              <button
                onClick={handleRecord}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isRecording
                    ? 'jungle-button-danger'
                    : 'jungle-button-secondary'
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
                  className="flex flex-col p-3 bg-jungle-accent/20 rounded-lg border border-jungle-light/30 hover:border-jungle-secondary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-jungle-dark">{sample.name}</h3>
                      <p className="text-sm text-jungle-primary/70">
                        {sample.duration}s • {sample.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePlayPause(sample)}
                        className="text-jungle-primary hover:text-jungle-secondary"
                      >
                        {currentlyPlaying === sample.id ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteSample(sample.id)}
                        className="text-jungle-primary hover:text-jungle-danger"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Audio progress indicator */}
                  {currentlyPlaying === sample.id && (
                    <div className="mt-2 bg-jungle-accent/30 rounded-full p-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-jungle-primary min-w-[40px]">
                          {formatTime(currentTime)}
                        </span>
                        <div className="relative flex-1 h-1 bg-jungle-light/30 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-jungle-primary rounded-full"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-jungle-primary min-w-[40px] text-right">
                          {isFinite(duration) && !isNaN(duration) ? formatTime(duration) : "0:00"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {samples.length === 0 && (
                <div className="text-center text-jungle-primary/70 py-8 bg-jungle-accent/10 rounded-lg border border-dashed border-jungle-light">
                  <Bird size={48} className="mx-auto mb-2 text-jungle-secondary/50" strokeWidth={1.5} />
                  <p>No voice samples recorded yet. Start by recording a sample.</p>
                </div>
              )}
            </div>
          </div>

          {/* Text-to-Speech Panel */}
          <div className="jungle-card p-6">
            <h2 className="text-xl font-semibold text-jungle-primary mb-4 flex items-center">
              <Volume2 size={20} className="mr-2" />
              Generate Speech
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to speech..."
              className="jungle-input w-full h-32 p-3 mb-4 focus:ring-2 focus:ring-jungle-secondary focus:border-transparent"
            />

            <div className="space-y-4 mb-4">
              <div>
                <label className="flex items-center justify-between text-sm text-jungle-dark">
                  Speed
                  <span className="bg-jungle-accent/30 px-2 py-1 rounded text-jungle-primary">{settings.speed}x</span>
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
                  className="jungle-slider w-full mt-2"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm text-jungle-dark">
                  Pitch
                  <span className="bg-jungle-accent/30 px-2 py-1 rounded text-jungle-primary">{settings.pitch}x</span>
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
                  className="jungle-slider w-full mt-2"
                />
              </div>
              
              {/* Preview button */}
              <button
                onClick={handlePreviewSettings}
                disabled={isPreviewing || samples.length === 0 || !text.trim()}
                className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg ${
                  isPreviewing || samples.length === 0 || !text.trim()
                    ? 'bg-jungle-light/50 cursor-not-allowed text-jungle-dark/50'
                    : 'bg-jungle-accent hover:bg-jungle-accent/90 text-jungle-dark'
                }`}
              >
                <Headphones size={16} />
                {isPreviewing ? 'Previewing...' : 'Preview Settings'}
              </button>
              
              {/* Hidden audio element for preview */}
              {previewAudio && (
                <audio 
                  ref={previewAudioRef}
                  className="hidden"
                  src={previewAudio}
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 ${
                  isGenerating
                    ? 'bg-jungle-light/50 cursor-not-allowed text-jungle-dark/50'
                    : 'jungle-button-primary'
                }`}
              >
                <Volume2 size={20} />
                {isGenerating ? 'Generating...' : 'Generate Speech'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!generatedAudio}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                  generatedAudio
                    ? 'jungle-button-accent'
                    : 'bg-jungle-light/30 text-jungle-dark/30 cursor-not-allowed'
                }`}
              >
                <Download size={20} />
              </button>
            </div>

            {generatedAudio && (
              <div className="mt-4 p-3 bg-jungle-accent/20 rounded-lg border border-jungle-light">
                <audio 
                  ref={generatedAudioRef}
                  controls 
                  className="w-full" 
                  src={generatedAudio} 
                  onLoadedMetadata={(e) => {
                    if (e.currentTarget) {
                      setGeneratedAudioDuration(e.currentTarget.duration);
                    }
                  }}
                />
                
                {/* Custom audio progress indicator */}
                <div className="mt-2 bg-jungle-accent/30 rounded-full p-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-jungle-primary min-w-[40px]">
                      {formatTime(generatedAudioTime)}
                    </span>
                    <div className="relative flex-1 h-1 bg-jungle-light/30 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-jungle-primary rounded-full"
                        style={{ 
                          width: `${generatedAudioDuration > 0 ? (generatedAudioTime / generatedAudioDuration) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-jungle-primary min-w-[40px] text-right">
                      {isFinite(generatedAudioDuration) && !isNaN(generatedAudioDuration) 
                        ? formatTime(generatedAudioDuration) 
                        : "0:00"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <footer className="mt-10 text-center text-jungle-primary/60 text-sm">
          <p>© {new Date().getFullYear()} Parrot | Voice Cloning Technology</p>
        </footer>
      </div>
    </div>
  );
}

export default App;