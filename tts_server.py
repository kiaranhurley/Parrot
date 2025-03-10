import io
import os
import tempfile
import traceback

from flask import Flask, request, send_file
from flask_cors import CORS
from pydub import AudioSegment
from TTS.api import TTS

# Set the exact path to your ffmpeg executables
ffmpeg_path = r"C:\FFmpeg\bin\ffmpeg.exe"
ffprobe_path = r"C:\FFmpeg\bin\ffprobe.exe"

AudioSegment.converter = ffmpeg_path
AudioSegment.ffmpeg = ffmpeg_path
AudioSegment.ffprobe = ffprobe_path

print(f"Using ffmpeg from: {ffmpeg_path}")
print(f"Using ffprobe from: {ffprobe_path}")

app = Flask(__name__)
CORS(app)

# Initialize TTS with YourTTS model
tts = TTS(model_name="tts_models/multilingual/multi-dataset/your_tts", progress_bar=False)

@app.route('/generate', methods=['POST'])
def generate_speech():
    temp_files = []  # Track all temporary files
    
    try:
        print("==== Request received ====")
        print(f"Form data keys: {list(request.form.keys())}")
        print(f"Files keys: {list(request.files.keys())}")
        
        # Get text and parameters
        text = request.form.get('text', '')
        print(f"Text to synthesize: '{text}'")
        
        speed = float(request.form.get('speed', 1.0))
        pitch = float(request.form.get('pitch', 1.0))
        print(f"Speed: {speed}, Pitch: {pitch}")
        
        # Get voice samples
        samples = []
        for key in request.files:
            if key.startswith('sample_'):
                file = request.files[key]
                print(f"Processing file: {key}, Content type: {file.content_type}")
                
                # Save original file
                orig_filename = file.filename or "unknown.webm"
                raw_temp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(orig_filename)[1])
                file.save(raw_temp.name)
                temp_files.append(raw_temp.name)  # Add to cleanup list
                print(f"Saved original file to {raw_temp.name}, size: {os.path.getsize(raw_temp.name)} bytes")
                
                # Save as WAV
                wav_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
                temp_files.append(wav_temp.name)  # Add to cleanup list
                
                # Use subprocess directly for conversion
                import subprocess
                cmd = [
                    ffmpeg_path,
                    '-i', raw_temp.name,
                    '-ac', '1',  # Mono
                    '-ar', '16000',  # 16kHz sample rate
                    '-y',  # Overwrite output file
                    wav_temp.name
                ]
                print(f"Running command: {' '.join(cmd)}")
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode != 0:
                    print(f"FFmpeg error: {result.stderr}")
                    return f"Error converting audio: {result.stderr}", 500
                
                print(f"Converted audio to {wav_temp.name}, size: {os.path.getsize(wav_temp.name)} bytes")
                samples.append(wav_temp.name)
                
                # Don't try to delete the original file yet - we'll do it at the end

        if not samples:
            print("No voice samples were provided")
            return "No voice samples were provided", 400
            
        # Generate speech using the first sample as reference
        output_path = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
        temp_files.append(output_path)  # Add to cleanup list
        print(f"Generating speech to {output_path}")
        
        tts.tts_to_file(
            text=text,
            speaker_wav=samples[0],
            language="en",
            file_path=output_path
        )
        
        print(f"Speech generated successfully, file size: {os.path.getsize(output_path)} bytes")

        # Send the generated audio file
        response = send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='generated_speech.wav'
        )
        
        # Set a callback to clean up files after response is sent
        @response.call_on_close
        def cleanup():
            print("Cleaning up temporary files...")
            # Clean up all temporary files
            for file_path in temp_files:
                try:
                    if os.path.exists(file_path):
                        os.unlink(file_path)
                        print(f"Deleted: {file_path}")
                except Exception as e:
                    print(f"Error deleting {file_path}: {e}")
        
        return response

    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error in generate_speech: {e}")
        print(error_details)
        
        # Try to clean up temp files even on error
        for file_path in temp_files:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
            except:
                pass  # Ignore cleanup errors on exception path
                
        return str(error_details), 500

if __name__ == '__main__':
    app.run(port=5000)
