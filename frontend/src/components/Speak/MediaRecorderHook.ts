import { useState, useRef, useCallback } from 'react';
import type { RecordingConfig } from '@/types';

interface UseMediaRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: string | null;
  startRecording: (onDataAvailable?: (base64Data: string) => void, config?: RecordingConfig) => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  getAudioUrl: () => string | null;
  downloadAudio: () => void;
  isSupported: boolean;
}

export const useMediaRecorder = (): UseMediaRecorderReturn => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onDataAvailableRef = useRef<((base64Data: string) => void) | null>(null);

  const isSupported = typeof window !== 'undefined' && 
    'MediaRecorder' in window && 
    'getUserMedia' in navigator.mediaDevices;

  const getPreferredMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  };

  const startRecording = useCallback(async (
    onDataAvailable?: (base64Data: string) => void,
    config?: RecordingConfig
  ): Promise<void> => {
    if (!isSupported) {
      setError('MediaRecorder not supported in this browser');
      return;
    }

    try {
      setError(null);
      onDataAvailableRef.current = onDataAvailable || null;

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: config?.echoCancellation ?? true,
          noiseSuppression: config?.noiseSuppression ?? true,
          autoGainControl: config?.autoGainControl ?? true,
          sampleRate: config?.sampleRate ?? 16000, // Preferred sample rate for speech recognition
          channelCount: config?.channels ?? 1
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = config?.mimeType || getPreferredMimeType();
      const mediaRecorderOptions: MediaRecorderOptions = { mimeType };

      if (config?.audioBitsPerSecond) {
        mediaRecorderOptions.audioBitsPerSecond = config.audioBitsPerSecond;
      }

      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent): void => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // If real-time processing is needed, call the callback
          if (onDataAvailableRef.current) {
            // Convert blob to base64 for WebSocket transmission
            const reader = new FileReader();
            reader.onloadend = (): void => {
              const result = reader.result as string;
              const base64 = result.split(',')[1]; // Remove data:audio/webm;base64, prefix
              if (onDataAvailableRef.current) {
                onDataAvailableRef.current(base64);
              }
            };
            reader.readAsDataURL(event.data);
          }
        }
      };

      mediaRecorder.onstop = (): void => {
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(audioBlob);
        setIsRecording(false);
      };

      mediaRecorder.onerror = (event: MediaRecorderErrorEvent): void => {
        const errorMessage = event.error ? event.error.message : 'Recording error occurred';
        setError(errorMessage);
        setIsRecording(false);
        console.error('MediaRecorder error:', event.error);
      };

      // Start recording with time slices for real-time processing
      const timeslice = onDataAvailable ? 1000 : undefined; // 1 second chunks if streaming
      mediaRecorder.start(timeslice);
      setIsRecording(true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Error starting recording:', err);
    }
  }, [isSupported]);

  const stopRecording = useCallback((): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isRecording]);

  const resetRecording = useCallback((): void => {
    setAudioBlob(null);
    setError(null);
    chunksRef.current = [];
  }, []);

  const getAudioUrl = useCallback((): string | null => {
    return audioBlob ? URL.createObjectURL(audioBlob) : null;
  }, [audioBlob]);

  const downloadAudio = useCallback((): void => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording_${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  return {
    isRecording,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    getAudioUrl,
    downloadAudio,
    isSupported
  };
};

export default useMediaRecorder;