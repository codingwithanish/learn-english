import { useState, useRef, useCallback } from 'react';

export const useMediaRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const onDataAvailableRef = useRef(null);

  const startRecording = useCallback(async (onDataAvailable = null) => {
    try {
      setError(null);
      onDataAvailableRef.current = onDataAvailable;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Preferred sample rate for speech recognition
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: getPreferredMimeType()
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // If real-time processing is needed, call the callback
          if (onDataAvailableRef.current) {
            // Convert blob to base64 for WebSocket transmission
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
              onDataAvailableRef.current(base64);
            };
            reader.readAsDataURL(event.data);
          }
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(audioBlob);
        setIsRecording(false);
      };

      mediaRecorder.onerror = (event) => {
        setError(event.error);
        setIsRecording(false);
      };

      // Start recording with time slices for real-time processing
      mediaRecorder.start(onDataAvailable ? 1000 : undefined); // 1 second chunks if streaming
      setIsRecording(true);
      
    } catch (err) {
      setError(err);
      console.error('Error starting recording:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setError(null);
    chunksRef.current = [];
  }, []);

  const getAudioUrl = useCallback(() => {
    return audioBlob ? URL.createObjectURL(audioBlob) : null;
  }, [audioBlob]);

  const downloadAudio = useCallback(() => {
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
    downloadAudio
  };
};

// Helper function to get the best supported MIME type
const getPreferredMimeType = () => {
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

export default useMediaRecorder;