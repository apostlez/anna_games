import { getDateProgress } from '../systems/local-storage';
import { isSoundEnabled } from '../systems/audio-service';
import gargoyleAsset from '../../assets/gargoyle.svg';
import spellbookAsset from '../../assets/spellbook.svg';
import broomAsset from '../../assets/broom.svg';

const root = document.querySelector('#ui-root');

const gameDefinitions = {
  speak: {
    label: '마법 주문 외치기',
    icon: '✦',
    description: '스펠북의 단어를 읽고 파이어볼을 발사합니다.',
  },
  write: {
    label: '마법책 쓰기',
    icon: '▤',
    description: '들은 단어를 책에 정확히 적습니다.',
  },
  flight: {
    label: '빗자루 비행',
    icon: '⌁',
    description: '뜻에 맞는 단어를 골라 탑으로 날아갑니다.',
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function bind(selector, event, callback) {
  const element = root.querySelector(selector);
  if (element) element.addEventListener(event, callback);
}

function bindAll(selector, event, callback) {
  root.querySelectorAll(selector).forEach((element) => element.addEventListener(event, callback));
}

function render(html) {
  root.innerHTML = html;
  return root;
}

function topbar(title, { showExit = true, onExit, showSound = true, onSoundToggle } = {}) {
  return `
    <div class="topbar">
      <p class="topbar__title">${escapeHtml(title)}</p>
      <div class="topbar__actions">
        ${showSound ? `<button class="icon-button" id="sound-toggle" type="button" aria-label="사운드 켜기 또는 끄기">${isSoundEnabled() ? '소리' : '음소거'}</button>` : ''}
        ${showExit ? '<button class="icon-button" id="exit-button" type="button" aria-label="게임 종료">Exit</button>' : ''}
      </div>
    </div>
  `;
}

function bindCommon({ onExit, onSoundToggle }) {
  bind('#exit-button', 'click', onExit);
  bind('#sound-toggle', 'click', onSoundToggle);
}

function completionCount(dateProgress) {
  return ['speak', 'write', 'flight'].filter((mode) => dateProgress?.[mode]?.completed).length;
}

function statusText(modeProgress) {
  if (!modeProgress?.completed) return '미완료';
  return `완료 · ${modeProgress.score}점`;
}

export function renderTitle({ onStart }) {
  render(`
    <section class="screen title-screen">
      <div class="title-screen__copy">
        <p class="eyebrow">English Spell Class</p>
        <h1>Word<br />Wizard</h1>
        <p class="kicker">단어를 주문으로 바꾸는 오늘의 마법 수업. 읽고, 쓰고, 고르며 한 걸음씩 탑에 가까워집니다.</p>
        <div class="button-row">
          <button class="primary-button" id="start-button" type="button">수업 시작</button>
        </div>
      </div>
      <div class="title-screen__art" role="img" aria-label="탑 앞에서 책과 지팡이를 든 마법사">
        <p class="art__caption">A quiet tower. Three spells. One word at a time.</p>
      </div>
    </section>
  `);
  bind('#start-button', 'click', onStart);
}

export function renderLoading(message = '마법책을 펼치는 중입니다...') {
  render(`
    <section class="screen screen--center">
      <div class="panel panel--padded" role="status">
        <p class="eyebrow">Word Wizard</p>
        <h2>${escapeHtml(message)}</h2>
        <p>단어와 지난 수업 기록을 확인하고 있습니다.</p>
      </div>
    </section>
  `);
}

export function renderError(message, { onRetry, onExit } = {}) {
  render(`
    <section class="screen screen--center">
      <div class="panel panel--padded">
        <p class="eyebrow">Spellbook Error</p>
        <h2>수업을 열 수 없습니다.</h2>
        <p>${escapeHtml(message)}</p>
        <div class="button-row">
          <button class="primary-button" id="retry-button" type="button">다시 시도</button>
          <button class="secondary-button" id="error-exit-button" type="button">처음으로</button>
        </div>
      </div>
    </section>
  `);
  bind('#retry-button', 'click', onRetry);
  bind('#error-exit-button', 'click', onExit);
}

export function renderSelection({ groups, selectedDateKey, source, onSelectDate, onSelectGame, onExit, onSoundToggle }) {
  const selectedGroup = groups.find((group) => group.dateKey === selectedDateKey) || groups[0];
  const selectedProgress = selectedGroup ? getDateProgress(selectedGroup.dateKey) : null;
  const dateButtons = groups.map((group) => {
    const progress = getDateProgress(group.dateKey);
    const complete = progress.completed;
    return `
      <button class="date-card${group.dateKey === selectedGroup?.dateKey ? ' is-selected' : ''}${complete ? ' is-complete' : ''}" type="button" data-date="${escapeHtml(group.dateKey)}">
        <span class="date-card__label">${escapeHtml(group.label)}</span>
        <span class="date-card__status">${complete ? '완료' : `${completionCount(progress)}/3 완료`}</span>
      </button>
    `;
  }).join('');
  const gameCards = Object.entries(gameDefinitions).map(([mode, game]) => {
    const modeProgress = selectedProgress?.[mode];
    return `
      <button class="game-card${modeProgress?.completed ? ' is-complete' : ''}" type="button" data-mode="${mode}" ${selectedGroup ? '' : 'disabled'}>
        <span class="game-card__icon" aria-hidden="true">${game.icon}</span>
        <h3>${game.label}</h3>
        <p>${game.description}</p>
        <span class="game-card__state">${statusText(modeProgress)}</span>
        ${modeProgress?.completed ? `<span class="game-card__score">${modeProgress.score}점 · ${modeProgress.correctCount}/${modeProgress.wordCount}</span>` : ''}
      </button>
    `;
  }).join('');

  render(`
    <section class="screen">
      ${topbar('게임 선택', { onExit, onSoundToggle })}
      <div class="screen__content">
        <div class="panel panel--padded" style="margin-bottom: 18px;">
          <p class="eyebrow">Your Spellbook</p>
          <h2>오늘의 수업을 고르세요.</h2>
          <p>날짜의 세 게임을 모두 마치면 하루의 수업이 완료됩니다.</p>
          <p class="notice">단어 출처: ${source === 'supabase' ? 'Supabase' : '로컬 추출 데이터'} · 선택한 날짜의 단어 ${selectedGroup?.words.length || 0}개</p>
        </div>
        <div class="selection-grid">
          <section class="panel panel--padded" aria-labelledby="date-heading">
            <div class="panel__header">
              <div>
                <p class="eyebrow">Calendar</p>
                <h2 id="date-heading">학습 날짜</h2>
              </div>
            </div>
            <div class="date-list">${dateButtons || '<p>사용 가능한 날짜가 없습니다.</p>'}</div>
          </section>
          <section class="panel panel--padded" aria-labelledby="game-heading">
            <div class="panel__header">
              <div>
                <p class="eyebrow">Three Spells</p>
                <h2 id="game-heading">게임 선택</h2>
              </div>
              <span class="metric">${selectedProgress?.completed ? '하루 완료' : `${completionCount(selectedProgress)}/3 완료`}</span>
            </div>
            <div class="game-grid">${gameCards}</div>
          </section>
        </div>
      </div>
    </section>
  `);

  bindAll('[data-date]', 'click', (event) => onSelectDate(event.currentTarget.dataset.date));
  bindAll('[data-mode]', 'click', (event) => onSelectGame(event.currentTarget.dataset.mode));
  bindCommon({ onExit, onSoundToggle });
}

function lessonHud({ title, index, total, score, onExit, onSoundToggle }) {
  return `
    ${topbar(title, { onExit, onSoundToggle })}
    <div class="hud">
      <div class="hud__metrics">
        <span class="metric">단어 <strong>${index + 1} / ${total}</strong></span>
        <span class="metric">점수 <strong>${score}</strong></span>
      </div>
    </div>
  `;
}

export function renderSpeak({ session, word, index, score, status, transcript, reveal, listening, processing, onExit, onSoundToggle, onListen, onSpeak }) {
  render(`
    <section class="screen">
      <div class="screen__content">
        ${lessonHud({ title: '마법 주문 외치기', index, total: session.words.length, score, onExit, onSoundToggle })}
        <div class="lesson-layout">
          <section class="lesson-stage" aria-live="polite">
            <div class="lesson-stage__visual lesson-stage__visual--speak"><img class="scene-gargoyle" src="${gargoyleAsset}" alt="다가오는 가고일" /><span class="scene-effect" aria-hidden="true">✦</span></div>
            <p class="eyebrow">Read the spell</p>
            <span class="lesson-stage__word">${escapeHtml(word.word)}</span>
            <span class="lesson-stage__meaning${reveal ? '' : ' is-hidden'}" id="speak-meaning">뜻: ${escapeHtml(word.meaningKo)}</span>
          </section>
          <aside class="panel panel--padded lesson-controls">
            <h2>가고일에게 주문을</h2>
            <p>단어를 또박또박 읽으면 파이어볼이 날아갑니다.</p>
            <div class="lesson-controls__status" id="speak-status" role="status">${escapeHtml(status)}</div>
            <button class="primary-button" id="mic-button" type="button" ${processing ? 'disabled' : ''}>${processing ? '확인 중...' : listening ? '완료' : '마이크로 읽기'}</button>
            <button class="secondary-button" id="repeat-button" type="button">발음 다시 듣기</button>
            <p class="is-hidden" id="speak-transcript">인식 결과: <strong></strong></p>
          </aside>
        </div>
      </div>
    </section>
  `);
  bind('#mic-button', 'click', onListen);
  bind('#repeat-button', 'click', onSpeak);
  bindCommon({ onExit, onSoundToggle });
}

export function updateSpeakState({ status, listening, processing, transcript, reveal }) {
  const statusElement = root.querySelector('#speak-status');
  const micButton = root.querySelector('#mic-button');
  const transcriptElement = root.querySelector('#speak-transcript');
  const meaningElement = root.querySelector('#speak-meaning');
  if (statusElement) statusElement.textContent = status;
  if (micButton) {
    micButton.disabled = Boolean(processing);
    micButton.textContent = processing ? '확인 중...' : listening ? '완료' : '마이크로 읽기';
  }
  if (transcriptElement) {
    const transcriptValue = transcriptElement.querySelector('strong');
    if (transcriptValue) transcriptValue.textContent = transcript || '';
    transcriptElement.classList.toggle('is-hidden', !transcript);
  }
  if (meaningElement) meaningElement.classList.toggle('is-hidden', !reveal);
}

export function renderWrite({ session, word, index, score, status, answer, letters, isTransitioning, onExit, onSoundToggle, onSpeak, onLetter, onBackspace, onClear, onSubmit }) {
  render(`
    <section class="screen">
      <div class="screen__content">
        ${lessonHud({ title: '마법책 쓰기', index, total: session.words.length, score, onExit, onSoundToggle })}
        <div class="lesson-layout">
          <section class="lesson-stage" aria-live="polite">
            <div class="lesson-stage__visual lesson-stage__visual--write${isTransitioning ? ' is-page-turning' : ''}"><img class="scene-spellbook" src="${spellbookAsset}" alt="펼쳐진 마법책" /></div>
            <p class="eyebrow">Listen and write</p>
            <span class="lesson-stage__word">${escapeHtml(word.meaningKo)}</span>
            <span class="lesson-stage__meaning">뜻을 보고 영어 단어를 적어보세요.</span>
          </section>
          <aside class="panel panel--padded lesson-controls">
            <h2>스승님의 소리를 듣고</h2>
            <p>정답을 적으면 책이 빛납니다. 틀리면 페이지가 사라집니다.</p>
            <div class="lesson-controls__status" id="write-status" role="status">${escapeHtml(status)}</div>
            <button class="secondary-button" id="repeat-button" type="button">단어 다시 듣기</button>
            <div class="spell-input-display" id="spell-answer" data-answer="${escapeHtml(answer)}" role="status" aria-live="polite" aria-label="선택한 스펠링">${escapeHtml(answer || '글자를 선택하세요')}</div>
            <div class="letter-grid" aria-label="스펠링 글자 선택">
              ${letters.map((letter) => `<button class="letter-button" type="button" data-letter="${escapeHtml(letter)}" ${isTransitioning ? 'disabled' : ''}>${letter === ' ' ? '공백' : escapeHtml(letter)}</button>`).join('')}
            </div>
            <div class="button-row">
              <button class="secondary-button" id="backspace-button" type="button" ${isTransitioning ? 'disabled' : ''}>한 글자 지우기</button>
              <button class="secondary-button" id="clear-button" type="button" ${isTransitioning ? 'disabled' : ''}>모두 지우기</button>
            </div>
            <button class="primary-button" id="write-submit" type="button" ${isTransitioning ? 'disabled' : ''}>다 썼다</button>
          </aside>
        </div>
      </div>
    </section>
  `);
  bind('#repeat-button', 'click', onSpeak);
  bindAll('[data-letter]', 'click', (event) => onLetter(event.currentTarget.dataset.letter));
  bind('#backspace-button', 'click', onBackspace);
  bind('#clear-button', 'click', onClear);
  bind('#write-submit', 'click', () => onSubmit(root.querySelector('#spell-answer')?.dataset.answer || ''));
  bindCommon({ onExit, onSoundToggle });
}

export function updateWriteDraft({ answer, status }) {
  const answerElement = root.querySelector('#spell-answer');
  const statusElement = root.querySelector('#write-status');
  if (answerElement) {
    answerElement.dataset.answer = answer;
    answerElement.textContent = answer || '글자를 선택하세요';
  }
  if (statusElement && status) statusElement.textContent = status;
}

export function renderFlight({ session, word, index, score, promptType, choices, status, onExit, onSoundToggle, onChoose }) {
  render(`
    <section class="screen">
      <div class="screen__content">
        ${lessonHud({ title: '빗자루 비행', index, total: session.words.length, score, onExit, onSoundToggle })}
        <div class="lesson-layout">
          <section class="lesson-stage" aria-live="polite">
            <div class="lesson-stage__visual lesson-stage__visual--flight"><img class="scene-broom" src="${broomAsset}" alt="마법의 빗자루" /><span class="flight-caption">BROOM FLIGHT</span></div>
            <p class="eyebrow">Choose the path</p>
            <span class="lesson-stage__word">${escapeHtml(promptType === 'word' ? word.word : word.meaningKo)}</span>
            <span class="lesson-stage__meaning">${promptType === 'word' ? '이 단어의 뜻을 선택하세요.' : '이 뜻에 맞는 단어를 선택하세요.'}</span>
          </section>
          <aside class="panel panel--padded lesson-controls">
            <h2>갈림길</h2>
            <p>맞는 단어가 있는 길로 빗자루를 움직입니다.</p>
            <div class="lesson-controls__status" role="status">${escapeHtml(status)}</div>
            <div class="choice-list">
              ${choices.map((choice, choiceIndex) => `<button class="choice-button" type="button" data-choice-index="${choiceIndex}">${escapeHtml(choice.label)}</button>`).join('')}
            </div>
          </aside>
        </div>
      </div>
    </section>
  `);
  bindAll('[data-choice-index]', 'click', (event) => onChoose(choices[Number(event.currentTarget.dataset.choiceIndex)]));
  bindCommon({ onExit, onSoundToggle });
}

export function renderResult({ result, gameLabel, onReplay, onSelect, onExit }) {
  const reviewItems = result.attempts.filter((attempt) => !attempt.correct).map((attempt) => `
    <div class="review-item">
      <span class="review-item__word">${escapeHtml(attempt.word)}</span>
      <span class="review-item__answer">정답: ${escapeHtml(attempt.correctAnswer)}</span>
    </div>
  `).join('');
  render(`
    <section class="screen">
      <div class="screen__content">
        ${topbar('수업 결과', { onExit, showSound: false })}
        <div class="result-grid">
          <section class="panel panel--padded score-display">
            <div>
              <p class="eyebrow">${escapeHtml(gameLabel)}</p>
              <span class="score-display__value">${result.score}</span>
              <p>${result.correctCount} / ${result.wordCount} 정답</p>
              <p>${result.dateLabel}의 게임을 완료했습니다.</p>
            </div>
          </section>
          <section class="panel panel--padded">
            <p class="eyebrow">Review</p>
            <h2>다음 주문을 준비하세요.</h2>
            ${reviewItems ? `<div class="review-list">${reviewItems}</div>` : '<p>모든 단어를 정확하게 맞혔습니다.</p>'}
            <div class="button-row" style="margin-top: 22px;">
              <button class="primary-button" id="replay-button" type="button">같은 게임 다시 하기</button>
              <button class="secondary-button" id="select-button" type="button">게임 선택으로</button>
            </div>
          </section>
        </div>
      </div>
    </section>
  `);
  bind('#replay-button', 'click', onReplay);
  bind('#select-button', 'click', onSelect);
  bindCommon({ onExit });
}

export function getGameDefinition(mode) {
  return gameDefinitions[mode];
}
