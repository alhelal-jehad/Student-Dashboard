import { animate } from 'motion';
import { bus } from '@/shared/events/bus';
import { t } from '@/shared/i18n';
import { delegate } from '@/shared/utils/delegate';
import { h } from './dom';
import { icon } from './icon';
import { DURATION, EASE, enter, leave, reduced } from './motion';

/**
 * StudyNet AI chat widget (Figma "Chatbot" section). Opens from any [data-chat-open] element.
 * ponytail: replies are canned and uploads are simulated, there is no AI/API backend yet.
 * Swap `reply()` and `startUpload()` for real calls when one exists.
 */

const NAME = 'Zara';
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const EXT: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'application/pdf': 'PDF',
};

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-mid';
const GRADIENT = 'bg-[linear-gradient(135deg,#7c3aed_0%,#9d2266_71.429%)]';
const ICON_BTN = `flex size-11 items-center justify-center rounded-[22px] hover:bg-pill ${FOCUS}`;
const BUBBLE_AI =
  'rounded-[20px] rounded-bl-[6px] bg-[#f4f3f8] px-[18px] py-3 text-sm leading-6 text-ink';
const CHIP = `flex h-9 items-center justify-center rounded-full border border-brand px-4 text-xs leading-[15px] font-medium whitespace-nowrap text-brand hover:bg-brand-50 ${FOCUS}`;
const SCROLL = 'max-h-[min(560px,calc(100dvh-15rem))] overflow-y-auto';
const PANEL_FULL =
  'overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_8px_26px_rgba(0,0,0,0.12)]';
const PANEL_SUGGEST =
  'overflow-hidden rounded-3xl border border-gray-200 bg-white px-4 py-2 shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]';
const SEND_OFF = 'bg-[#f0f0f0]';
const SEND_ON = 'bg-brand';

type Intent = 'passport' | 'counsellor' | 'offer' | 'visa' | 'other';
type View = 'suggest' | 'welcome' | 'chat';
type Msg =
  | { k: 'user'; text: string }
  | { k: 'ai'; text: string; chips?: Intent[] }
  | { k: 'drop' }
  | { k: 'file'; file: File; url: string; pct: number; done: boolean }
  | { k: 'typing' };

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function fmt(bytes: number): string {
  const mb = bytes / 1048576;
  return mb >= 0.1 ? `${String(+mb.toFixed(1))} MB` : `${String(Math.round(bytes / 1024))} KB`;
}

function guess(text: string): Intent {
  if (/passport/i.test(text)) return 'passport';
  if (/counsel/i.test(text)) return 'counsellor';
  if (/offer/i.test(text)) return 'offer';
  if (/visa/i.test(text)) return 'visa';
  return 'other';
}

export function createChatbot(): HTMLElement {
  let view: View = 'suggest';
  let minimized = false;
  let isOpen = false;
  let opener: HTMLElement | null = null;
  let msgs: Msg[] = [];
  let upload: { stop: () => void } | null = null;
  const els = new Map<Msg, HTMLElement>();
  const updaters = new Map<Msg, () => void>();
  let list = h('div');

  const panel = h('div', { class: PANEL_SUGGEST });
  const fileInput = h('input', {
    type: 'file',
    accept: '.jpg,.jpeg,.png,.pdf',
    class: 'sr-only',
    tabindex: '-1',
    'aria-hidden': 'true',
  });

  // ---------- input bar ----------
  const input = h('input', {
    type: 'text',
    autocomplete: 'off',
    class:
      'min-w-0 flex-1 bg-transparent text-base leading-5 text-ink outline-none placeholder:text-[#66666e]',
  });
  const attach = h(
    'button',
    {
      type: 'button',
      'data-chat': 'attach',
      class: `flex size-6 items-center justify-center rounded-md ${FOCUS}`,
    },
    icon('chat-attach.svg', 24),
  );
  const mic = h(
    'button',
    {
      type: 'button',
      'aria-disabled': 'true',
      class: `flex size-6 items-center justify-center rounded-md ${FOCUS}`,
    },
    icon('chat-mic.svg', 24),
  );
  const sendIcon = icon('chat-send.svg', 18);
  const send = h(
    'button',
    {
      type: 'submit',
      disabled: true,
      class: `flex size-8 shrink-0 items-center justify-center rounded-2xl ${SEND_OFF} ${FOCUS}`,
    },
    sendIcon,
  );
  const bar = h(
    'form',
    {
      class:
        'flex h-16 items-center gap-4 overflow-hidden rounded-[32px] border-2 border-[#d6286a] bg-white pr-4 pl-5 shadow-[0_0_6px_2px_rgba(135,97,255,0.26)] focus-within:shadow-[0_0_0_4px_rgba(157,34,102,0.25)]',
    },
    icon('chat-sparkle-24.svg', 24),
    input,
    h('div', { class: 'flex items-center gap-4' }, attach, mic, send),
  );

  const applyText = (): void => {
    input.placeholder = t(view === 'suggest' ? 'chat.placeholder' : 'chat.placeholderWelcome');
    if (view === 'chat') input.placeholder = t('chat.placeholder');
    input.setAttribute('aria-label', input.placeholder);
    attach.setAttribute('aria-label', t('chat.attach'));
    mic.setAttribute('aria-label', t('chat.mic'));
    send.setAttribute('aria-label', t('chat.send'));
    attach.hidden = view === 'suggest';
  };

  const stack = h(
    'div',
    {
      class: 'pointer-events-auto flex w-[585px] max-w-full origin-bottom flex-col gap-2',
      role: 'dialog',
      'aria-label': t('chat.title'),
    },
    panel,
    bar,
  );
  const root = h(
    'div',
    {
      class:
        'pointer-events-none fixed inset-x-0 bottom-6 z-(--z-overlay) flex justify-center px-4 lg:ps-[calc(15rem+1rem)]',
      hidden: true,
    },
    stack,
    fileInput,
  );

  // ---------- animation helpers ----------
  /** Swap panel content and animate the height change (the panel is bottom-anchored, so it grows upward). */
  function morph(change: () => void, animated = true): void {
    if (!animated || reduced()) {
      change();
      return;
    }
    const from = panel.offsetHeight;
    change();
    const to = panel.offsetHeight;
    panel.style.overflow = 'hidden';
    void animate(
      panel,
      { height: [`${String(from)}px`, `${String(to)}px`] },
      { duration: DURATION.modal, ease: [0.32, 0.72, 0, 1] },
    ).then(() => {
      panel.style.height = '';
    });
    for (const child of Array.from(panel.children))
      void animate(child, { opacity: [0, 1] }, { duration: DURATION.menu, ease: EASE.enter });
  }

  const scrollEnd = (animated: boolean): void => {
    list.scrollTo({ top: list.scrollHeight, behavior: animated && !reduced() ? 'smooth' : 'auto' });
  };

  // ---------- pieces ----------
  const avatar = (size: 8 | 10): HTMLElement =>
    h(
      'span',
      {
        class: `flex shrink-0 items-center justify-center rounded-full ${GRADIENT} ${size === 10 ? 'size-10' : 'size-8'}`,
      },
      icon(size === 10 ? 'chat-ai-22.svg' : 'chat-ai-18.svg', size === 10 ? 22 : 18),
    );

  const header = (): HTMLElement =>
    h(
      'div',
      { class: 'flex items-center gap-3 border-b border-[#e4e2ea] bg-white py-3 pr-3 pl-5' },
      avatar(10),
      h(
        'div',
        { class: 'flex min-w-0 flex-1 flex-col gap-0.5' },
        h('p', { class: 'text-[15px] font-semibold text-ink' }, t('chat.title')),
        h(
          'p',
          { class: 'flex items-center gap-1.5 text-xs text-[#6b6b84]' },
          icon('chat-online.svg', 8),
          t('chat.status'),
        ),
      ),
      h(
        'div',
        { class: 'flex items-center' },
        h(
          'button',
          { type: 'button', 'data-chat': 'new', 'aria-label': t('chat.newChat'), class: ICON_BTN },
          icon('chat-new.svg', 24),
        ),
        h(
          'button',
          { type: 'button', 'data-chat': 'min', 'aria-label': t('chat.minimize'), class: ICON_BTN },
          icon('chat-minimize.svg', 24),
        ),
        h(
          'button',
          { type: 'button', 'data-chat': 'close', 'aria-label': t('chat.close'), class: ICON_BTN },
          icon('chat-close.svg', 24),
        ),
      ),
    );

  const suggestions = (): HTMLElement => {
    const row = (file: string, label: string, key: string): HTMLElement =>
      h(
        'button',
        {
          type: 'button',
          'data-suggest': key,
          class: `flex w-full items-center gap-4 rounded-xl px-2 py-[13px] text-start text-base leading-5 text-[#333338] hover:bg-[#f4f3f8] ${FOCUS}`,
        },
        icon(file, 18),
        h('span', { class: 'flex-1' }, label),
      );
    return h(
      'div',
      { class: 'flex flex-col' },
      row('chat-sg-sparkle.svg', t('chat.suggest.journey'), 'journey'),
      row('chat-sg-passport.svg', t('chat.intent.passport'), 'passport'),
      row('chat-sg-chat.svg', t('chat.intent.counsellor'), 'counsellor'),
      row('chat-sg-arrow.svg', t('chat.suggest.scholarship'), 'scholarship'),
      row('chat-sg-arrow.svg', t('chat.suggest.courses'), 'courses'),
    );
  };

  const welcome = (): HTMLElement => {
    const action = (file: string, intent: Exclude<Intent, 'other' | 'passport'>): HTMLElement =>
      h(
        'button',
        {
          type: 'button',
          'data-intent': intent,
          class: `flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-start hover:bg-gray-50 ${FOCUS}`,
        },
        h(
          'span',
          { class: 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f3f8]' },
          icon(file, 22),
        ),
        h(
          'span',
          { class: 'flex min-w-0 flex-1 flex-col gap-0.5 text-xs leading-5 text-[#686b84]' },
          h('span', { class: 'text-sm font-medium text-ink' }, t(`chat.intent.${intent}`)),
          t(`chat.welcome.${intent}`),
        ),
        icon('chat-qa-chevron.svg', 20),
      );
    return h(
      'div',
      { class: `${SCROLL} flex flex-col gap-4 p-5` },
      h(
        'div',
        { class: 'flex flex-col gap-1.5' },
        h(
          'h2',
          { class: 'text-[22px] leading-7 font-medium text-ink' },
          t('chat.welcome.title', { name: NAME }),
        ),
        h('p', { class: 'text-sm leading-[22px] text-[#686b84]' }, t('chat.welcome.sub')),
      ),
      h(
        'p',
        { class: 'text-xs font-semibold tracking-[0.72px] text-[#686b84]' },
        t('chat.welcome.quick'),
      ),
      h(
        'div',
        { class: 'flex flex-col gap-3' },
        action('chat-qa-offer.svg', 'offer'),
        action('chat-qa-visa.svg', 'visa'),
        action('chat-qa-chat.svg', 'counsellor'),
      ),
      h(
        'p',
        { class: 'text-center text-xs leading-[18px] text-[#686b84]' },
        t('chat.welcome.disclaimer'),
      ),
    );
  };

  // ---------- messages ----------
  function dropCard(): HTMLElement {
    return h(
      'div',
      { class: 'flex flex-col rounded-[22px] border border-[#e6e3ef] bg-white p-3.5' },
      h(
        'div',
        {
          'data-zone': '',
          class:
            'flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-200 px-6 py-10 transition-colors data-[over]:border-brand data-[over]:bg-brand-50',
        },
        h(
          'p',
          { class: 'text-sm leading-5 font-medium tracking-[-0.16px] text-ink' },
          t('chat.drop.title'),
        ),
        h(
          'button',
          {
            type: 'button',
            'data-chat': 'attach',
            class: `flex h-8 items-center gap-1 rounded-full bg-brand px-4 py-1.5 text-xs leading-[15px] font-medium text-[#fafafa] hover:bg-brand-deep ${FOCUS}`,
          },
          icon('chat-cloud.svg', 14),
          t('chat.drop.upload'),
        ),
        h(
          'div',
          { class: 'flex flex-col items-center gap-1 text-center' },
          h('p', { class: 'text-sm leading-5 tracking-[-0.16px] text-ink' }, t('chat.drop.hint')),
          h('p', { class: 'text-xs leading-4 text-ink-3' }, t('chat.drop.tip')),
        ),
      ),
    );
  }

  function fileCard(m: Extract<Msg, { k: 'file' }>): HTMLElement {
    const badge = EXT[m.file.type] ?? 'FILE';
    const meta = h('span');
    const status = h('span', { class: 'flex items-center gap-1 font-medium' });
    const action = h('span', { class: 'shrink-0' });
    const fill = h('div', { class: 'h-1.5 rounded-[3px] bg-brand' });
    const track = h(
      'div',
      {
        class: 'h-1.5 overflow-hidden rounded-[3px] bg-[#e4e2ea]',
        role: 'progressbar',
        'aria-valuemin': 0,
        'aria-valuemax': 100,
      },
      fill,
    );
    const upd = (): void => {
      const pct = Math.round(m.pct);
      meta.textContent = `${fmt((m.file.size * m.pct) / 100)} / ${fmt(m.file.size)}`;
      fill.style.width = `${String(m.pct)}%`;
      track.setAttribute('aria-valuenow', String(pct));
      track.setAttribute('aria-label', t('chat.file.uploading', { pct }));
      track.hidden = m.done;
      if (m.done) {
        status.className = 'flex items-center gap-1 font-medium text-[#1fc16b]';
        status.replaceChildren(icon('chat-done.svg', 16), t('chat.file.completed'));
        action.replaceChildren(
          h(
            'button',
            {
              type: 'button',
              'data-view': '',
              class: `flex items-center rounded-full border-[0.5px] border-nav px-[13px] py-[7px] text-[10px] font-medium text-nav hover:bg-gray-50 ${FOCUS}`,
            },
            t('chat.file.view'),
          ),
        );
      } else {
        status.className = 'flex items-center gap-1 font-medium text-brand';
        status.textContent = t('chat.file.uploading', { pct });
        action.replaceChildren(
          h(
            'button',
            {
              type: 'button',
              'data-chat': 'cancel',
              'aria-label': t('chat.file.cancel'),
              class: `flex size-10 items-center justify-center rounded-full hover:bg-pill ${FOCUS}`,
            },
            icon('chat-close.svg', 24),
          ),
        );
      }
    };
    updaters.set(m, upd);
    upd();
    return h(
      'div',
      { class: 'flex flex-col rounded-[22px] border border-[#e6e3ef] bg-white p-3.5' },
      h(
        'div',
        { class: 'flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3' },
        h(
          'div',
          { class: 'flex items-center justify-between gap-3' },
          h(
            'div',
            { class: 'flex min-w-0 items-center gap-3' },
            h(
              'div',
              { class: 'relative size-8 shrink-0 overflow-hidden', 'aria-hidden': 'true' },
              icon(
                'chat-file-a.svg',
                26,
                'absolute inset-y-0 left-1/2 h-full -translate-x-1/2',
                32,
              ),
              icon('chat-file-b.svg', 10, 'absolute top-px right-1'),
              h(
                'span',
                {
                  class:
                    'absolute bottom-1 left-0 rounded-[3px] bg-[#fb3748] px-[3px] py-0.5 text-[8.8px] leading-[9.6px] font-semibold tracking-[0.176px] text-white',
                },
                badge,
              ),
            ),
            h(
              'div',
              { class: 'flex min-w-0 flex-col gap-1' },
              h(
                'p',
                { class: 'truncate text-sm leading-5 font-medium tracking-[-0.16px] text-ink' },
                m.file.name,
              ),
              h(
                'p',
                { class: 'flex items-center gap-2 text-xs leading-4 text-ink-2' },
                meta,
                h('span', { class: 'size-[3px] rounded-full bg-ink-3', 'aria-hidden': 'true' }),
                status,
              ),
            ),
          ),
          action,
        ),
        track,
      ),
    );
  }

  function build(m: Msg): HTMLElement {
    switch (m.k) {
      case 'user':
        return h(
          'div',
          { class: 'flex justify-end' },
          h(
            'p',
            {
              class:
                'max-w-[85%] rounded-[20px] rounded-br-[6px] bg-brand px-[22px] py-3 text-sm text-white',
            },
            m.text,
          ),
        );
      case 'ai':
        return h(
          'div',
          { class: 'flex items-start gap-2.5' },
          avatar(8),
          h(
            'div',
            { class: 'flex min-w-0 flex-1 flex-col items-start gap-2.5' },
            h('p', { class: `max-w-[430px] ${BUBBLE_AI}` }, m.text),
            ...(m.chips ?? []).map((c) =>
              h('button', { type: 'button', 'data-intent': c, class: CHIP }, t(`chat.intent.${c}`)),
            ),
          ),
        );
      case 'typing':
        return h(
          'div',
          { class: 'flex items-start gap-2.5', role: 'status', 'aria-label': t('chat.typing') },
          avatar(8),
          h(
            'div',
            { class: `${BUBBLE_AI} flex items-center gap-1 py-[18px]` },
            ...[0, 1, 2].map((i) =>
              h('span', {
                class: 'anim-blink size-1.5 rounded-full bg-ink-3',
                style: `animation-delay:${String(i * 0.18)}s`,
              }),
            ),
          ),
        );
      case 'drop':
        return dropCard();
      case 'file':
        return fileCard(m);
    }
  }

  function addMsg(m: Msg, animated = true): void {
    msgs.push(m);
    if (view !== 'chat') return;
    const el = build(m);
    els.set(m, el);
    list.append(el);
    if (animated) void enter(el, 'menu');
    scrollEnd(animated);
  }

  function swapMsg(old: Msg, next: Msg): void {
    msgs[msgs.indexOf(old)] = next;
    const el = build(next);
    els.get(old)?.replaceWith(el);
    els.delete(old);
    updaters.delete(old);
    els.set(next, el);
    void enter(el, 'menu');
  }

  function dropMsg(m: Msg): void {
    msgs = msgs.filter((x) => x !== m);
    const el = els.get(m);
    els.delete(m);
    if (el)
      void leave(el, 'micro').then(() => {
        el.remove();
      });
  }

  async function reply(intent: Intent): Promise<void> {
    const typing: Msg = { k: 'typing' };
    addMsg(typing);
    await wait(700);
    dropMsg(typing);
    const text = t(`chat.reply.${intent}`, { name: NAME });
    addMsg(
      intent === 'other'
        ? { k: 'ai', text, chips: ['offer', 'visa', 'counsellor'] }
        : { k: 'ai', text },
    );
    if (intent === 'passport' && !msgs.some((m) => m.k === 'drop' || m.k === 'file'))
      addMsg({ k: 'drop' });
  }

  function say(text: string, intent: Intent): void {
    addMsg({ k: 'user', text });
    if (view !== 'chat') setView('chat');
    void reply(intent);
  }

  // ---------- upload (simulated) ----------
  function startUpload(file: File): void {
    upload?.stop();
    const m: Extract<Msg, { k: 'file' }> = {
      k: 'file',
      file,
      url: URL.createObjectURL(file),
      pct: 0,
      done: false,
    };
    if (view !== 'chat') setView('chat');
    const drop = msgs.find((x) => x.k === 'drop');
    if (drop) swapMsg(drop, m);
    else addMsg(m);
    scrollEnd(true);
    const ctl = animate(0, 100, {
      duration: 2.4,
      ease: 'linear',
      onUpdate: (v) => {
        m.pct = v;
        updaters.get(m)?.();
      },
    });
    upload = ctl;
    void ctl.then(() => {
      if (!msgs.includes(m)) return;
      m.pct = 100;
      m.done = true;
      updaters.get(m)?.();
      upload = null;
      void (async () => {
        const typing: Msg = { k: 'typing' };
        addMsg(typing);
        await wait(700);
        dropMsg(typing);
        addMsg({ k: 'ai', text: t('chat.reply.saved'), chips: ['counsellor', 'visa', 'offer'] });
      })();
    });
  }

  function handleFile(file: File | undefined): void {
    if (!file) return;
    const err = !TYPES.includes(file.type) ? 'badType' : file.size > MAX_BYTES ? 'tooBig' : '';
    if (err) {
      note(t(`chat.drop.${err}`));
      return;
    }
    startUpload(file);
  }
  function note(text: string): void {
    if (view !== 'chat') setView('chat');
    addMsg({ k: 'ai', text });
  }

  function cancelUpload(): void {
    upload?.stop();
    upload = null;
    const m = msgs.find((x) => x.k === 'file' && !x.done);
    if (m) swapMsg(m, { k: 'drop' });
  }

  // ---------- views ----------
  function setView(next: View, animated = true): void {
    morph(() => {
      view = next;
      panel.className = next === 'suggest' ? PANEL_SUGGEST : PANEL_FULL;
      els.clear();
      updaters.clear();
      if (next === 'suggest') panel.replaceChildren(suggestions());
      else if (next === 'welcome') panel.replaceChildren(header(), welcome());
      else {
        list = h('div', {
          class: `${SCROLL} flex flex-col gap-4 p-5`,
          role: 'log',
          'aria-live': 'polite',
          'aria-relevant': 'additions',
        });
        for (const m of msgs) {
          const el = build(m);
          els.set(m, el);
          list.append(el);
        }
        panel.replaceChildren(header(), list);
        list.scrollTop = list.scrollHeight;
      }
      panel.hidden = minimized;
      applyText();
    }, animated);
  }

  function setMinimized(min: boolean): void {
    if (min === minimized) return;
    minimized = min;
    morph(() => {
      panel.hidden = min;
    });
  }

  function reset(): void {
    upload?.stop();
    upload = null;
    for (const m of msgs) if (m.k === 'file') URL.revokeObjectURL(m.url);
    msgs = [];
    minimized = false;
    setView('welcome');
  }

  function open(from: HTMLElement | null): void {
    if (isOpen) {
      setMinimized(false);
      input.focus();
      return;
    }
    isOpen = true;
    opener = from;
    root.hidden = false;
    setView(msgs.length ? 'chat' : 'suggest', false);
    input.focus({ preventScroll: true });
    if (reduced()) void enter(stack, 'menu');
    else
      void animate(
        stack,
        { opacity: [0, 1], y: [16, 0], scale: [0.97, 1] },
        { duration: DURATION.modal, ease: EASE.enter },
      );
  }

  async function close(): Promise<void> {
    if (!isOpen) return;
    isOpen = false;
    await leave(stack, 'menu');
    root.hidden = true;
    stack.style.opacity = '';
    opener?.focus();
  }

  // ---------- events ----------
  delegate(document.body, 'click', '[data-chat-open]', (el, e) => {
    e.preventDefault();
    open(el);
  });
  document.addEventListener('pointerdown', (e) => {
    // The suggestion list behaves like a dropdown: clicking elsewhere dismisses it.
    const target = e.target as Element | null;
    if (
      isOpen &&
      view === 'suggest' &&
      !stack.contains(target) &&
      !target?.closest('[data-chat-open]')
    )
      void close();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') void close();
  });
  bar.addEventListener('focusin', () => {
    setMinimized(false);
  });

  delegate(root, 'click', '[data-chat]', (el) => {
    switch (el.dataset.chat) {
      case 'close':
        void close();
        break;
      case 'min':
        setMinimized(true);
        break;
      case 'new':
        reset();
        break;
      case 'attach':
        fileInput.click();
        break;
      case 'cancel':
        cancelUpload();
        break;
    }
  });
  delegate(root, 'click', '[data-suggest]', (el) => {
    const key = el.dataset.suggest ?? '';
    if (key === 'journey') setView('welcome');
    else say(el.textContent.trim(), key === 'passport' || key === 'counsellor' ? key : 'other');
  });
  delegate(root, 'click', '[data-intent]', (el) => {
    const intent = (el.dataset.intent ?? 'other') as Intent;
    say(t(`chat.intent.${intent}`), intent);
  });
  delegate(root, 'click', '[data-view]', () => {
    const m = msgs.find((x) => x.k === 'file');
    if (m?.k === 'file') window.open(m.url, '_blank', 'noopener');
  });
  fileInput.addEventListener('change', () => {
    handleFile(fileInput.files?.[0]);
    fileInput.value = '';
  });
  delegate(root, 'dragover', '[data-zone]', (el, e) => {
    e.preventDefault();
    el.setAttribute('data-over', '');
  });
  delegate(root, 'dragleave', '[data-zone]', (el) => {
    el.removeAttribute('data-over');
  });
  delegate(root, 'drop', '[data-zone]', (el, e) => {
    e.preventDefault();
    el.removeAttribute('data-over');
    handleFile((e as DragEvent).dataTransfer?.files[0]);
  });
  input.addEventListener('input', () => {
    const on = input.value.trim() !== '';
    send.disabled = !on;
    send.classList.toggle(SEND_ON, on);
    send.classList.toggle(SEND_OFF, !on);
    sendIcon.classList.toggle('brightness-0', on);
    sendIcon.classList.toggle('invert', on);
  });
  bar.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    say(text, guess(text));
  });
  bus.on('locale:changed', () => {
    stack.setAttribute('aria-label', t('chat.title'));
    if (isOpen) setView(view, false);
    else applyText();
  });

  applyText();
  return root;
}
