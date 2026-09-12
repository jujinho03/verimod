import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Action } from '../domain/types'
import type { VerifyCode } from '../domain/verify'
import { REQUIRED_CONFIRMATIONS } from '../domain/verify'
import type { AnchorStatus } from '../store/ledger'
import { ACTION_LABEL, CODE_INFO, STAGE_LABEL, shortHash, type StatusTone } from './format'
import { ArrowUpRight } from './icons'

export function ActionBadge({ action, large }: { action: Action; large?: boolean }) {
  return <span className={`action action--${action}${large ? ' action--lg' : ''}`}>{ACTION_LABEL[action]}</span>
}

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`status status--${tone}`}>{children}</span>
}

export function CodeBadge({ code }: { code: VerifyCode }) {
  return <StatusBadge tone={CODE_INFO[code].tone}>{code}</StatusBadge>
}

export function AnchorBadge({ status }: { status: AnchorStatus }) {
  if (status.stage === 'ANCHORED') return <StatusBadge tone="pass">앵커 확인</StatusBadge>
  const suffix = status.stage === 'CONFIRMING' ? ` ${status.confirmations}/${REQUIRED_CONFIRMATIONS}` : ''
  return (
    <StatusBadge tone="pending">
      {STAGE_LABEL[status.stage]}
      {suffix}
    </StatusBadge>
  )
}

export function SyntheticPill({ children = '합성 점수' }: { children?: ReactNode }) {
  return <span className="pill pill--synthetic">{children}</span>
}

export function CopyButton({ value, label = '복사' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="copy-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        } catch {
          setCopied(false)
        }
      }}
    >
      {copied ? '복사됨' : label}
    </button>
  )
}

export function HashText({ value, short, copy = true }: { value: string; short?: boolean; copy?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
      <code className="hash" title={value}>
        {short ? shortHash(value) : value}
      </code>
      {copy && <CopyButton value={value} />}
    </span>
  )
}

export function InfoTip({ children, label = '설명' }: { children: ReactNode; label?: string }) {
  return (
    <span className="tooltip" tabIndex={0} aria-label={label}>
      i<span className="tooltip__bubble" role="tooltip">
        {children}
      </span>
    </span>
  )
}

export function ArrowLink({ to, children, external }: { to: string; children: ReactNode; external?: boolean }) {
  if (external) {
    return (
      <a className="arrow-link" href={to} target="_blank" rel="noreferrer">
        {children}
        <ArrowUpRight />
      </a>
    )
  }
  return (
    <Link className="arrow-link" to={to}>
      {children}
      <ArrowUpRight />
    </Link>
  )
}
