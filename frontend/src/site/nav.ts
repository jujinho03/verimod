import type { ComponentType, SVGProps } from 'react'
import {
  BlocksIcon,
  BookIcon,
  BuildingIcon,
  CodeIcon,
  DatabaseIcon,
  DocIcon,
  EyeIcon,
  FlagIcon,
  FlaskIcon,
  HashIcon,
  InputIcon,
  LayersIcon,
  QuestionIcon,
  ReceiptIcon,
  ReviewIcon,
  ScaleIcon,
  ShieldIcon,
  TreeIcon,
  UsersIcon,
} from '../ui/icons'

export const REPO_URL = 'https://github.com/jujinho03/verimod'

export interface MenuLink {
  to: string
  title: string
  desc: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  badge?: string
  external?: boolean
}

export interface MenuColumn {
  label: string
  links: MenuLink[]
}

export interface Menu {
  id: string
  label: string
  columns: MenuColumn[]
  foot?: MenuLink
}

export const MENUS: Menu[] = [
  {
    id: 'flow',
    label: '작동 방식',
    columns: [
      {
        label: '판정',
        links: [
          { to: '/check', title: '판정 요청', desc: '글을 넣고 항목별 점수와 조치를 확인합니다', icon: InputIcon },
          { to: '/protocol#policy', title: '정책과 기준값', desc: '라벨별 threshold와 조치 우선순위', icon: ScaleIcon },
        ],
      },
      {
        label: '봉인과 검증',
        links: [
          { to: '/receipts', title: '내 영수증', desc: '발급한 영수증과 봉인 진행 상태', icon: ReceiptIcon },
          { to: '/verify', title: '영수증 검증기', desc: '해시·포함 증명·앵커를 직접 다시 계산합니다', icon: ShieldIcon },
          { to: '/verify#tamper', title: '변조 테스트', desc: '사본을 고치고 원래 앵커로 다시 검증합니다', icon: FlaskIcon },
        ],
      },
      {
        label: '이의제기와 검토',
        links: [
          { to: '/receipts?filter=appealable', title: '이의제기', desc: '제한 판정에 사유를 남기고 연결된 기록을 받습니다', icon: FlagIcon },
          { to: '/review', title: '검토 콘솔', desc: '대기 중인 건의 조치를 유지하거나 바꿉니다', icon: ReviewIcon },
        ],
      },
    ],
    foot: { to: '/#flow', title: '전체 흐름', desc: '판정부터 사람 검토까지 한 화면에서', icon: LayersIcon },
  },
  {
    id: 'people',
    label: '이용자',
    columns: [
      {
        label: '콘텐츠 작성 이용자',
        links: [
          { to: '/receipts', title: '받은 판정 확인', desc: '조치·점수·근거와 영수증을 봅니다', icon: ReceiptIcon },
          { to: '/receipts?filter=appealable', title: '이의제기하기', desc: '원본을 지운 채가 아니라 새 기록으로 남깁니다', icon: FlagIcon },
        ],
      },
      {
        label: '플랫폼 운영자와 검토자',
        links: [
          { to: '/review', title: '검토 대기열', desc: '이의제기와 검토 보류 건을 처리합니다', icon: BuildingIcon },
          { to: '/receipts', title: '발급 기록', desc: '발급·배치·앵커 상태를 한 표로 봅니다', icon: DatabaseIcon },
        ],
      },
      {
        label: '감사자와 연구자',
        links: [
          { to: '/verify', title: '독립 검증', desc: '받은 영수증 JSON만으로 다시 계산합니다', icon: EyeIcon },
          { to: '/protocol', title: '프로토콜 규칙', desc: '직렬화·해시·Merkle·앵커 규칙', icon: CodeIcon },
        ],
      },
    ],
    foot: { to: '/#people', title: '누가 쓰나요', desc: '주체별로 필요한 것과 제공하는 것', icon: UsersIcon },
  },
  {
    id: 'protocol',
    label: '프로토콜',
    columns: [
      {
        label: '기록 형식',
        links: [
          { to: '/protocol#receipt', title: 'Decision Receipt', desc: '판정·이의제기·검토 영수증의 필드', icon: ReceiptIcon },
          { to: '/protocol#hash', title: '해시와 도메인 분리', desc: '정규 직렬화와 SHA-256 입력 규칙', icon: HashIcon },
        ],
      },
      {
        label: '봉인',
        links: [
          { to: '/protocol#merkle', title: 'Merkle 배치', desc: 'RFC 9162 방식의 트리와 포함 증명', icon: TreeIcon },
          { to: '/protocol#anchor', title: 'Epoch 앵커', desc: 'root·count·version을 원장에 기록합니다', icon: BlocksIcon },
        ],
      },
      {
        label: '신뢰 경계',
        links: [
          { to: '/protocol#codes', title: '검증 결과 코드', desc: 'VALID부터 RPC_UNAVAILABLE까지', icon: ShieldIcon },
          { to: '/#scope', title: '보장 범위와 한계', desc: '확인하는 것과 확인하지 않는 것', icon: EyeIcon },
        ],
      },
    ],
    foot: { to: '/protocol#simulation', title: '시험 버전의 합성 요소', desc: '무엇이 실제 계산이고 무엇이 합성인지', icon: FlaskIcon, badge: '필독' },
  },
  {
    id: 'resources',
    label: '자료',
    columns: [
      {
        label: '시작하기',
        links: [
          { to: '/#faq', title: '자주 묻는 질문', desc: '그냥 DB면 안 되나요? 외 4개', icon: QuestionIcon },
          { to: '/#background', title: '규제와 표준 배경', desc: '도입 의무가 아니라 수요 배경입니다', icon: BookIcon },
        ],
      },
      {
        label: '팀 문서',
        links: [
          { to: `${REPO_URL}/blob/main/MASTER_CONTEXT.md`, title: '공통 기준서', desc: 'MASTER_CONTEXT.md', icon: DocIcon, external: true },
          { to: `${REPO_URL}/blob/main/docs/01-domain-and-interfaces.md`, title: '인터페이스 제안서', desc: 'I1~I4 경계 제안 v0.1', icon: CodeIcon, external: true },
        ],
      },
      {
        label: '시험 데이터',
        links: [
          { to: '/receipts#reset', title: '시험 데이터 초기화', desc: '합성 영수증 5건으로 되돌립니다', icon: DatabaseIcon },
          { to: '/verify#rpc', title: 'RPC 장애 가정', desc: '원장 조회가 실패할 때의 결과', icon: BlocksIcon },
        ],
      },
    ],
    foot: { to: REPO_URL, title: 'GitHub 저장소', desc: 'jujinho03/verimod', icon: CodeIcon, external: true },
  },
]

export interface SearchEntry {
  title: string
  to: string
  tag: string
  keywords: string
  kind: 'page' | 'receipt'
}

const MENU_TAG: Record<string, string> = { flow: '기능', people: '이용자', protocol: '프로토콜', resources: '자료' }

export const PAGE_ENTRIES: SearchEntry[] = [
  { title: '홈', to: '/', tag: '페이지', keywords: 'verimod 소개 decide prove appeal', kind: 'page' as const },
  ...MENUS.flatMap((menu) =>
    [...menu.columns.flatMap((column) => column.links), ...(menu.foot ? [menu.foot] : [])]
      .filter((link) => !link.external)
      .map((link) => ({ title: link.title, to: link.to, tag: MENU_TAG[menu.id], keywords: link.desc, kind: 'page' as const })),
  ),
].filter((entry, i, all) => all.findIndex((other) => other.to === entry.to && other.title === entry.title) === i)

export const POPULAR_ENTRIES: SearchEntry[] = ['/check', '/verify', '/receipts', '/review', '/protocol#receipt', '/#faq']
  .map((to) => PAGE_ENTRIES.find((entry) => entry.to === to))
  .filter((entry): entry is SearchEntry => entry !== undefined)
