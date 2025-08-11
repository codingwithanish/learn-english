import boto3
import io
from typing import Optional
from botocore.exceptions import ClientError
from app.core.config import settings


class TTSService:
    """Text-to-Speech service using Amazon Polly"""
    
    def __init__(self):
        self.polly_client = boto3.client(
            'polly',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
    
    async def synthesize_speech(
        self,
        text: str,
        voice_id: str = "Joanna",
        output_format: str = "mp3",
        language_code: str = "en-US"
    ) -> bytes:
        """
        Synthesize speech from text using Amazon Polly
        
        Args:
            text: Text to synthesize
            voice_id: Polly voice ID
            output_format: Audio format (mp3, wav, ogg_vorbis)
            language_code: Language code
            
        Returns:
            Audio bytes
        """
        try:
            response = self.polly_client.synthesize_speech(
                Text=text,
                OutputFormat=output_format,
                VoiceId=voice_id,
                LanguageCode=language_code,
                Engine='neural'  # Use neural voices for better quality
            )
            
            # Read audio stream
            audio_stream = response['AudioStream']
            audio_bytes = audio_stream.read()
            
            return audio_bytes
            
        except ClientError as e:
            print(f"TTS Error: {e}")
            raise Exception(f"Failed to synthesize speech: {e}")
    
    async def create_feedback_audio(
        self,
        evaluation_results: list,
        session_id: str,
        user_name: str = "Student"
    ) -> bytes:
        """
        Create feedback audio from evaluation results
        
        Args:
            evaluation_results: List of evaluation objects
            session_id: Session identifier
            user_name: User's name for personalization
            
        Returns:
            Synthesized feedback audio bytes
        """
        try:
            # Build feedback text
            feedback_text = f"Hello {user_name}, here's your speaking evaluation feedback. "
            
            for result in evaluation_results:
                criteria = result.get('criteria', 'general')
                suggestion = result.get('suggestion', 'Keep practicing!')
                
                feedback_text += f"For {criteria}: {suggestion}. "
            
            feedback_text += "Great job on completing your speaking session. Keep practicing to improve your English skills!"
            
            # Synthesize speech
            audio_bytes = await self.synthesize_speech(feedback_text)
            return audio_bytes
            
        except Exception as e:
            # Fallback to generic feedback
            fallback_text = f"Hello {user_name}, your speaking session has been completed successfully. Keep up the great work!"
            return await self.synthesize_speech(fallback_text)
    
    async def save_audio_to_s3(
        self,
        audio_bytes: bytes,
        key: str,
        content_type: str = "audio/mpeg"
    ) -> str:
        """
        Save audio bytes to S3 bucket
        
        Args:
            audio_bytes: Audio data
            key: S3 key (path)
            content_type: MIME type
            
        Returns:
            S3 URL
        """
        try:
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET,
                Key=key,
                Body=audio_bytes,
                ContentType=content_type,
                ACL='private'  # Keep files private
            )
            
            # Generate S3 URL
            s3_url = f"s3://{settings.S3_BUCKET}/{key}"
            return s3_url
            
        except ClientError as e:
            print(f"S3 Upload Error: {e}")
            raise Exception(f"Failed to save audio to S3: {e}")
    
    async def get_presigned_url(self, s3_key: str, expiration: int = 3600) -> str:
        """
        Generate presigned URL for S3 object
        
        Args:
            s3_key: S3 object key
            expiration: URL expiration time in seconds
            
        Returns:
            Presigned URL
        """
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.S3_BUCKET, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            print(f"Presigned URL Error: {e}")
            raise Exception(f"Failed to generate presigned URL: {e}")
    
    async def create_and_save_feedback(
        self,
        evaluation_results: list,
        resource_id: str,
        user_name: str = "Student"
    ) -> str:
        """
        Create feedback audio and save to S3
        
        Args:
            evaluation_results: Evaluation results
            resource_id: Resource ID for file naming
            user_name: User's name
            
        Returns:
            S3 URL of saved audio
        """
        try:
            # Create feedback audio
            audio_bytes = await self.create_feedback_audio(
                evaluation_results, resource_id, user_name
            )
            
            # Generate S3 key
            from datetime import datetime
            now = datetime.utcnow()
            s3_key = f"speak/output/{now.year}/{now.month:02d}/{now.day:02d}/{resource_id}-feedback.mp3"
            
            # Save to S3
            s3_url = await self.save_audio_to_s3(audio_bytes, s3_key)
            
            return s3_url
            
        except Exception as e:
            print(f"Error creating feedback: {e}")
            raise e