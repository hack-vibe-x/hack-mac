import { useEffect, useRef } from 'react';

interface Props {
  /** 확인 창 자체를 가리키는 data-* 표식(시험·접근성 라벨용) */
  testId: { attr: string; value: string };
  icon?: string;
  title: string;
  /** "함께 지워지는 것" 목록 */
  items: string[];
  warning: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmAttr: { attr: string; value: string };
}

/**
 * 되돌릴 수 없는 지우기의 확인 창(앱 지우기·대화 지우기가 같이 쓴다).
 * 무엇이 함께 사라지는지 먼저 보여 주고, 기본 초점은 [취소], Esc로 닫힌다.
 */
export function ConfirmDeleteDialog({ testId, icon, title, items, warning, busy, onConfirm, onCancel, confirmAttr }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="modal-card" {...{ [`data-${testId.attr}`]: testId.value }}>
        <div className="modal-head">
          {icon && <div className="detail-icon">{icon}</div>}
          <div>
            <h2>{title}</h2>
          </div>
        </div>

        <h3>함께 지워지는 것</h3>
        <ul className="modal-list">
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <p className="modal-warning">{warning}</p>

        <div className="modal-actions">
          <button ref={cancelRef} className="header-button" onClick={onCancel} disabled={busy}>
            취소
          </button>
          <button className="toggle-button danger-button" {...{ [`data-${confirmAttr.attr}`]: confirmAttr.value }} onClick={onConfirm} disabled={busy}>
            {busy ? '지우는 중…' : '지우기'}
          </button>
        </div>
      </div>
    </div>
  );
}
