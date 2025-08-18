import React, { useState, useEffect, useRef } from 'react';
import { 
  MicrophoneIcon, 
  StopIcon
} from '@heroicons/react/24/outline';
import WSClient from './WSClient';
import { useMediaRecorder } from './MediaRecorderHook';
import { useAuth } from '../../store/authStore';

const SpeakSession = ({ 
  config = {}, 
  onSessionComplete, 
  onError,
  autoStart = false 
}) => {
  const [sessionState, setSessionState] = useState('idle'); // idle, connecting, connected, recording, processing, completed, error
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalResult, setFinalResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sequenceNumber, setSequenceNumber] = useState(0);
  
  const wsClientRef = useRef(null);
  const timerRef = useRef(null);
  const { token } = useAuth();
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    error: recordingError
  } = useMediaRecorder();

  useEffect(() => {
    if (autoStart && token) {
      handleStartSession();
    }

    return () => {
      cleanup();
    };
  }, [autoStart, token]);

  useEffect(() => {
    if (recordingError && onError) {
      onError(recordingError);
    }
  }, [recordingError, onError]);

  const cleanup = () => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (isRecording) {
      stopRecording();
    }
  };

  const setupWebSocket = () => {
    if (!token) {
      setSessionState('error');
      return;
    }

    const wsClient = new WSClient();
    wsClientRef.current = wsClient;

    wsClient.onOpen = () => {
      setConnectionStatus('CONNECTED');
      setSessionState('connected');
    };

    wsClient.onClose = () => {
      setConnectionStatus('DISCONNECTED');
      if (sessionState !== 'completed') {
        setSessionState('error');
      }
    };

    wsClient.onError = (error) => {
      setSessionState('error');
      if (onError) {
        onError(error);
      }
    };

    wsClient.onAck = (message) => {
      setTimeRemaining(message.max_duration || 60);
      startTimer(message.max_duration || 60);
      startAudioRecording();
    };

    wsClient.onInterim = (message) => {
      setCurrentTranscript(message.transcript || '');
    };

    wsClient.onProcessing = () => {
      setSessionState('processing');
      setCurrentTranscript('Processing your speech...');
    };

    wsClient.onFinal = (message) => {
      setSessionState('completed');
      setFinalResult(message);
      if (onSessionComplete) {
        onSessionComplete(message);
      }
    };

    setConnectionStatus('CONNECTING');
    setSessionState('connecting');
    wsClient.connect(token);
  };

  const startTimer = (_duration) => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          handleStopSession();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  const startAudioRecording = () => {
    const handleAudioData = (base64Data) => {
      if (wsClientRef.current && sessionState === 'recording') {
        const currentSeq = sequenceNumber + 1;
        setSequenceNumber(currentSeq);
        wsClientRef.current.sendAudioChunk(base64Data, currentSeq);
      }
    };

    startRecording(handleAudioData);
    setSessionState('recording');
  };

  const handleStartSession = () => {
    if (sessionState !== 'idle') return;

    setupWebSocket();
    
    // Wait for WebSocket connection, then start session
    setTimeout(() => {
      if (wsClientRef.current && wsClientRef.current.isConnected) {
        wsClientRef.current.startSession(config);
      }
    }, 1000);
  };

  const handleStopSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (isRecording) {
      stopRecording();
    }
    
    if (wsClientRef.current) {
      wsClientRef.current.stopSession();
    }
    
    setSessionState('processing');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (sessionState) {
      case 'recording':
        return 'text-red-600 bg-red-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderSessionControls = () => {
    switch (sessionState) {
      case 'idle':
        return (
          <button
            onClick={handleStartSession}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <MicrophoneIcon className="h-5 w-5 mr-2" />
            Start Speaking
          </button>
        );
        
      case 'connecting':
      case 'connected':
        return (
          <div className="inline-flex items-center px-6 py-3 text-base font-medium">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-2"></div>
            Connecting...
          </div>
        );
        
      case 'recording':
        return (
          <div className="space-y-4">
            <button
              onClick={handleStopSession}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <StopIcon className="h-5 w-5 mr-2" />
              Stop Recording
            </button>
            
            <div className="text-center">
              <div className="text-2xl font-mono text-red-600">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-500">Time remaining</div>
            </div>
          </div>
        );
        
      case 'processing':
        return (
          <div className="inline-flex items-center px-6 py-3 text-base font-medium">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-2"></div>
            Processing your speech...
          </div>
        );
        
      case 'completed':
        return (
          <button
            onClick={() => {
              setSessionState('idle');
              setCurrentTranscript('');
              setFinalResult(null);
              setTimeRemaining(0);
              setSequenceNumber(0);
            }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Start New Session
          </button>
        );
        
      case 'error':
        return (
          <button
            onClick={() => {
              setSessionState('idle');
              setCurrentTranscript('');
              setConnectionStatus('DISCONNECTED');
            }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Try Again
          </button>
        );
        
      default:
        return null;
    }
  };

  const renderResults = () => {
    if (finalResult && sessionState === 'completed') {
      return (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your Speech Transcript
            </h3>
            <p className="text-gray-700">
              {finalResult.transcript || 'No transcript available'}
            </p>
          </div>

          {finalResult.evaluation_result && finalResult.evaluation_result.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Evaluation Results
              </h3>
              <div className="space-y-3">
                {finalResult.evaluation_result.map((result, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {result.criteria}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finalResult.tts_url && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Feedback Audio
              </h3>
              <audio controls className="w-full">
                <source src={finalResult.tts_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-gray-900">
          Speaking Session
        </h2>
        <div className="flex items-center space-x-2">
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}
          >
            {sessionState.charAt(0).toUpperCase() + sessionState.slice(1)}
          </span>
          <span className="text-xs text-gray-500">
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Session Config */}
      {config.subject && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Topic:</span> {config.subject}
          </p>
          {config.speak_time && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Duration:</span> {config.speak_time} seconds
            </p>
          )}
        </div>
      )}

      {/* Live Transcript */}
      {currentTranscript && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Live Transcript:
          </h3>
          <p className="text-gray-900">
            {currentTranscript}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="text-center">
        {renderSessionControls()}
      </div>

      {/* Results */}
      {renderResults()}
    </div>
  );
};

export default SpeakSession;