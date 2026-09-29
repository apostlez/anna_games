import { isAnswerCorrect } from '../systems/answer-normalizer';
import { playFeedbackSound, playWordAudio } from '../systems/audio-service';
import { listenForWord } from '../systems/speech-service';
import { renderSpeak, updateSpeakState } from '../ui/dom-overlay';
import { LessonScene } from './lesson-scene';

export class SpeakSpellScene extends LessonScene {
  constructor() {
    super('SpeakSpellScene', 0xf29a52);
    this.status = '마이크 버튼을 누르고 단어를 읽어보세요.';
    this.transcript = '';
    this.reveal = false;
    this.listening = false;
    this.processing = false;
    this.recordingController = null;
  }

  create() {
    if (!this.setupLesson()) return;
    this.renderCurrent();
  }

  renderCurrent() {
    const word = this.currentWord();
    if (!word) return;
    renderSpeak({
      session: this.session,
      word,
      index: this.index,
      score: this.session.score,
      status: this.status,
      transcript: this.transcript,
      reveal: this.reveal,
      listening: this.listening,
      processing: this.processing,
      onExit: () => this.leaveToTitle(),
      onSoundToggle: () => this.toggleSound(),
      onListen: () => (this.listening ? this.stopListening() : this.listen()),
      onSpeak: () => playWordAudio(word),
    });
  }

  listen() {
    if (this.listening) return;
    this.listening = true;
    this.recordingController = new AbortController();
    this.status = '듣는 중... 단어를 읽어주세요.';
    updateSpeakState({
      status: this.status,
      listening: this.listening,
      processing: this.processing,
      transcript: this.transcript,
      reveal: this.reveal,
    });
    listenForWord({
      signal: this.recordingController.signal,
      onState: (state) => {
        if (state === 'recording') this.status = '5초 동안 듣는 중입니다. 단어를 읽어주세요.';
        if (state === 'processing') {
          this.processing = true;
          this.status = '녹음한 음성을 확인하는 중입니다.';
        }
        updateSpeakState({
          status: this.status,
          listening: this.listening,
          processing: this.processing,
          transcript: this.transcript,
          reveal: this.reveal,
        });
      },
    }).then((transcript) => {
      window.setTimeout(() => {
        this.listening = false;
        this.processing = false;
        this.recordingController = null;
        this.handleAnswer(transcript);
      }, 280);
    }).catch((error) => {
      this.listening = false;
      this.processing = false;
      this.recordingController = null;
      if (error.code === 'aborted') return;
      if (error.code === 'unsupported') {
        this.status = '이 브라우저에서는 음성 인식을 지원하지 않습니다.';
      } else if (error.code === 'permission-denied') {
        this.status = '마이크 권한이 없어 사용할 수 없습니다. 권한을 확인하고 다시 시도하세요.';
      } else if (['no-microphone', 'no-speech', 'empty'].includes(error.code)) {
        this.status = '음성을 듣지 못했습니다. 조용한 곳에서 다시 시도하세요.';
      } else {
        this.status = error.message || '다시 한 번 읽어보세요.';
      }
      this.renderCurrent();
    });
  }

  stopListening() {
    if (!this.recordingController) return;
    this.processing = true;
    this.status = '녹음한 음성을 확인하는 중입니다.';
    updateSpeakState({
      status: this.status,
      listening: this.listening,
      processing: this.processing,
      transcript: this.transcript,
      reveal: this.reveal,
    });
    this.recordingController.abort();
  }

  handleAnswer(input) {
    if (!String(input).trim()) {
      this.status = '빈 답은 제출할 수 없습니다.';
      this.renderCurrent();
      return;
    }
    const word = this.currentWord();
    const correct = isAnswerCorrect(input, word);
    this.transcript = input;
    this.recordAttempt({ input, correct });
    if (correct) {
      this.reveal = true;
      this.status = '정답입니다. 파이어볼 발사!';
      playFeedbackSound('correct');
      this.renderCurrent();
      this.scheduleNext();
      return;
    }

    if (this.attemptNumber === 1) {
      this.attemptNumber = 2;
      this.status = '조금 달라요. 두 번 더 읽을 수 있습니다.';
      playFeedbackSound('incorrect');
      this.renderCurrent();
      return;
    }

    if (this.attemptNumber === 2) {
      this.attemptNumber = 3;
      this.status = '아직 맞지 않아요. 마지막으로 한 번 더 읽어보세요.';
      playFeedbackSound('incorrect');
      this.renderCurrent();
      return;
    }

    this.reveal = true;
    this.status = `정답은 ${word.word}입니다. 다음 주문으로 넘어갑니다.`;
    playFeedbackSound('incorrect');
    this.renderCurrent();
    this.scheduleNext();
  }

  prepareNextWord() {
    this.transcript = '';
    this.reveal = false;
    this.status = '마이크 버튼을 누르고 단어를 읽어보세요.';
  }
}
