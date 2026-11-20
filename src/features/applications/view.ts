import { View } from '@/core/view';
import type { ErrorCode } from '@/shared/utils/errors';
import { formatDate } from '@/shared/i18n/format';
import { t } from '@/shared/i18n';
import { Badge, type BadgeTone } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { h } from '@/shared/ui/dom';
import { enter } from '@/shared/ui/motion';
import { SkeletonList } from '@/shared/ui/skeleton';
import type { Application } from './model';

const STATUS: Record<Application['status'], { tone: BadgeTone; icon: string }> = {
  draft: { tone: 'neutral', icon: '✎' },
  submitted: { tone: 'info', icon: '➤' },
  under_review: { tone: 'warning', icon: '◔' },
  offer: { tone: 'success', icon: '✓' },
  rejected: { tone: 'danger', icon: '✕' },
};

export class ApplicationsView extends View {
  private heading!: HTMLHeadingElement;
  private body!: HTMLDivElement;
  private live!: HTMLParagraphElement;
  private onRetry: () => void = () => undefined;

  mount(): void {
    this.heading = h(
      'h1',
      {
        class: 'text-xl font-semibold focus-visible:outline-2 focus-visible:outline-primary',
        tabindex: '-1',
      },
      t('applications.title'),
    );
    this.live = h('p', { class: 'text-muted text-sm', role: 'status' });
    this.body = h('div', { class: 'min-h-72' });
    this.host.append(
      h('section', { class: 'flex flex-col gap-4' }, this.heading, this.live, this.body),
    );
    // One delegated listener covers Retry however many times the body is replaced.
    this.delegateOn(this.body, 'click', '[data-action="retry"]', () => {
      this.onRetry();
    });
  }

  bindRetry(handler: () => void): void {
    this.onRetry = handler;
  }

  /** Called by the Controller after each screen change so keyboard and screen reader users land here. */
  focusHeading(): void {
    this.heading.focus();
  }

  showLoading(): void {
    this.live.textContent = t('applications.loading');
    this.body.replaceChildren(SkeletonList());
  }

  render(items: readonly Application[]): void {
    this.live.textContent = t('applications.count', { count: items.length });
    const list = h('ul', { class: 'flex flex-col gap-3' });
    for (const item of items) {
      const { tone, icon } = STATUS[item.status];
      list.append(
        Card(
          h('h2', { class: 'text-lg font-semibold' }, item.university),
          h('p', { class: 'text-muted' }, item.program),
          h(
            'div',
            { class: 'flex flex-wrap items-center justify-between gap-2' },
            Badge(tone, icon, t(`applications.status.${item.status}`)),
            h(
              'time',
              { class: 'text-muted text-sm', datetime: item.updatedAt },
              t('applications.updated', { date: formatDate(item.updatedAt) }),
            ),
          ),
        ),
      );
    }
    this.body.replaceChildren(list);
    void enter(list); // skeleton -> content
  }

  showEmpty(): void {
    this.live.textContent = t('applications.count', { count: 0 });
    const empty = h(
      'div',
      { class: 'flex flex-col items-start gap-2 rounded-lg border border-line bg-raised p-6' },
      h('h2', { class: 'text-lg font-semibold' }, t('applications.emptyTitle')),
      h('p', { class: 'text-muted' }, t('applications.emptyBody')),
    );
    this.body.replaceChildren(empty);
    void enter(empty);
  }

  showError(code: ErrorCode): void {
    this.live.textContent = '';
    const error = h(
      'div',
      {
        class: 'flex flex-col items-start gap-3 rounded-lg border border-danger bg-danger-soft p-6',
        role: 'alert',
      },
      h('h2', { class: 'text-danger text-lg font-semibold' }, t('applications.errorTitle')),
      h('p', { class: 'text-fg' }, t(`errors.${code}`)),
      Button({ label: t('actions.retry'), action: 'retry' }),
    );
    this.body.replaceChildren(error);
    void enter(error, 'micro');
  }
}
