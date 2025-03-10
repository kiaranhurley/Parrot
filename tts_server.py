from flask import Flask, request, send_file
from flask_cors import CORS
import io
from TTS.api import TTS
import tempfile
import os

app = Flask(__name__)
CORS(app)

# Initialize TTS with YourTTS model
tts = TTS(model_name="tts_models/multilingual/multi-dataset/your_tts", progress_bar=False)

@app.route('/generate', methods=['POST'])
def generate_speech():
    try:
        # Get text and parameters
        text = request.form.get('text', '')
        speed = float(request.form.get('speed', 1.0))
        pitch = float(request.form.get('pitch', 1.0))
        
        # Get voice samples
        samples = []
        for key in request.files:
            if key.startswith('sample_'):
                file = request.files[key]
                temp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
                file.save(temp.name)
                samples.append(temp.name)

        # Generate speech using the first sample as reference
        output_path = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
        tts.tts_to_file(
            text=text,
            speaker_wav=samples[0],
            language="en",
            file_path=output_path
        )

        # Clean up temporary files
        for sample in samples:
            os.unlink(sample)

        # Send the generated audio file
        return send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='generated_speech.wav'
        )

    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(port=5000)
