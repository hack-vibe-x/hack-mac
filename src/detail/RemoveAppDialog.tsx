import type { ServiceMeta } from '../../shared/types';
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';

interface Props {
  service: ServiceMeta;
  busy: boolean;
  onRemove: () => void;
  onCancel: () => void;
}

/** 앱 지우기 확인. 만들 때 나눈 대화는 지우지 않고 보관함으로 옮긴다(계획서 12.1) — 실행 로그도 남는다 */
export function RemoveAppDialog({ service, busy, onRemove, onCancel }: Props) {
  return (
    <ConfirmDeleteDialog
      testId={{ attr: 'remove-app', value: service.id }}
      confirmAttr={{ attr: 'confirm-remove', value: service.id }}
      icon={service.icon}
      title={`${service.name}을(를) 지울까요?`}
      items={[
        ...(service.shortcuts.length > 0 ? [`단축키 ${service.shortcuts.length}개`] : []),
        '이 앱의 설정값과 저장해 둔 비밀값',
        '이 앱이 모아 둔 데이터',
      ]}
      warning="되돌릴 수 없어요. 나중에 다시 쓸 수도 있다면 지우기 전에 [내보내기]로 파일을 받아 두세요."
      busy={busy}
      onConfirm={onRemove}
      onCancel={onCancel}
    />
  );
}
