function getRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const SPEECH_RECORDING_MS = 5000;

export function isSpeechRecognitionSupported() {
  return Boolean(getRecognitionConstructor());
}

export async function listenForWord({ onState, signal } = {}) {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    return Promise.reject({ code: 'unsupported', message: '이 브라우저에서는 음성 인식을 지원하지 않습니다.' });
  }

  let stream = null;
  if (navigator.mediaDevices?.getUserMedia) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const code = error?.name === 'NotFoundError' ? 'no-microphone' : 'permission-denied';
      throw { code, message: '마이크를 사용할 수 없습니다. 권한과 장치를 확인해 주세요.' };
    }
  }

  if (signal?.aborted) {
    stream?.getTracks().forEach((track) => track.stop());
    return Promise.reject({ code: 'aborted', message: '녹음이 취소되었습니다.' });
  }

  return new Promise((resolve, reject) => {
    const recognition = new Recognition();
    let recorder = null;
    let settled = false;
    let recognitionFailure = null;
    let finalTranscript = '';
    let interimTranscript = '';
    let processingStarted = false;
    let timerId;
    let abortListener;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timerId);
      signal?.removeEventListener('abort', abortListener);
      stream?.getTracks().forEach((track) => track.stop());
      callback(value);
    };
    const completeResult = () => {
      if (settled) return;
      const transcript = `${finalTranscript} ${interimTranscript}`.trim();
      if (recognitionFailure) {
        finish(reject, recognitionFailure);
        return;
      }
      if (!transcript) {
        finish(reject, { code: 'empty', message: '5초 동안 음성을 듣지 못했습니다. 다시 시도해 주세요.' });
        return;
      }
      finish(resolve, transcript);
    };
    const stopCapture = () => {
      if (processingStarted || settled) return;
      processingStarted = true;
      onState?.('processing');
      try {
        if (recognition.state === 'listening') recognition.stop();
      } catch {
        // The recognition engine may already have ended while the recorder is stopping.
      }
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      } else {
        completeResult();
      }
    };
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;
    recognition.onstart = () => onState?.('recording');
    recognition.onend = () => {};
    recognition.onerror = (event) => {
      const code = event.error === 'not-allowed'
        ? 'permission-denied'
        : event.error === 'audio-capture'
          ? 'no-microphone'
          : event.error || 'unknown';
      if (event.error === 'no-speech') return;
      const message = code === 'no-microphone'
        ? '마이크를 사용할 수 없습니다. 권한과 장치를 확인해 주세요.'
        : event.message || '음성을 인식하지 못했습니다.';
      recognitionFailure = { code, message };
      stopCapture();
    };
    recognition.onresult = (event) => {
      interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript?.trim() || '';
        if (event.results[index].isFinal) {
          finalTranscript = `${finalTranscript} ${transcript}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim();
        }
      }
    };
    try {
      if (window.MediaRecorder) {
        recorder = new MediaRecorder(stream);
        recorder.onstop = completeResult;
        recorder.start();
      }
    } catch (error) {
      recognitionFailure = { code: 'recording-failed', message: error.message || '녹음을 시작하지 못했습니다.' };
    }
    try {
      recognition.start();
    } catch (error) {
      recognitionFailure = { code: 'start-failed', message: error.message || '마이크를 시작하지 못했습니다.' };
      stopCapture();
    }
    abortListener = stopCapture;
    signal?.addEventListener('abort', abortListener, { once: true });
    timerId = window.setTimeout(() => {
      stopCapture();
    }, SPEECH_RECORDING_MS);
  });
}
