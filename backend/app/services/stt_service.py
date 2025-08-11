import base64
import io
from typing import Optional, Dict, Any
import openai
from app.core.config import settings

openai.api_key = settings.OPENAI_API_KEY


class STTService:
    """Speech-to-Text service using OpenAI Whisper API"""
    
    @staticmethod
    async def transcribe_audio(audio_data: bytes, format: str = "wav") -> Dict[str, Any]:
        """
        Transcribe audio using OpenAI Whisper API
        
        Args:
            audio_data: Raw audio bytes
            format: Audio format (wav, mp3, etc.)
            
        Returns:
            Dict with transcript and confidence
        """
        try:
            # Create a file-like object from audio bytes
            audio_file = io.BytesIO(audio_data)
            audio_file.name = f"audio.{format}"
            
            # Call OpenAI Whisper API
            response = await openai.Audio.atranscribe(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json"
            )
            
            return {
                "transcript": response.get("text", ""),
                "confidence": 0.9,  # Whisper doesn't provide confidence scores
                "language": response.get("language", "en"),
                "duration": response.get("duration", 0)
            }
            
        except Exception as e:
            print(f"STT Error: {e}")
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": str(e)
            }
    
    @staticmethod
    def decode_base64_audio(base64_data: str) -> bytes:
        """Decode base64 audio data to bytes"""
        try:
            return base64.b64decode(base64_data)
        except Exception as e:
            raise ValueError(f"Invalid base64 audio data: {e}")
    
    @staticmethod
    async def transcribe_base64_audio(base64_data: str, format: str = "wav") -> Dict[str, Any]:
        """
        Transcribe base64 encoded audio
        
        Args:
            base64_data: Base64 encoded audio data
            format: Audio format
            
        Returns:
            Transcription result
        """
        try:
            audio_bytes = STTService.decode_base64_audio(base64_data)
            return await STTService.transcribe_audio(audio_bytes, format)
        except Exception as e:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": str(e)
            }
    
    @staticmethod
    async def stream_transcribe(audio_chunks: list, format: str = "wav") -> Dict[str, Any]:
        """
        Transcribe multiple audio chunks (simulate streaming)
        In production, this would use a streaming STT service
        
        Args:
            audio_chunks: List of base64 audio chunks
            format: Audio format
            
        Returns:
            Final transcription result
        """
        try:
            # Combine all chunks
            combined_audio = b""
            for chunk in audio_chunks:
                if isinstance(chunk, dict) and "data" in chunk:
                    chunk_data = STTService.decode_base64_audio(chunk["data"])
                    combined_audio += chunk_data
                elif isinstance(chunk, str):
                    chunk_data = STTService.decode_base64_audio(chunk)
                    combined_audio += chunk_data
            
            # Transcribe combined audio
            return await STTService.transcribe_audio(combined_audio, format)
            
        except Exception as e:
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": str(e)
            }