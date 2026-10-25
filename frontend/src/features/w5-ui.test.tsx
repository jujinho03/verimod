import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VerificationModeNotice } from './VerificationModeNotice'
import { PrivatePackageInput } from './PrivatePackageInput'
import { SyntheticLifecycleDemo } from './SyntheticLifecycleDemo'
import { VerifyReportView } from './VerifyReportView'
import { syntheticLifecycleCase } from '../domain/syntheticLifecycle'
import { verifyReceipt } from '../domain/verify'

describe('W5 rendered service UI contract (SSR, not browser QA)', () => {
  it.each(['BASE_SEPOLIA_DEMO', 'SYNTHETIC_LOCAL', 'SERVICE'] as const)('labels %s accurately', (mode) => {
    const html = renderToStaticMarkup(<VerificationModeNotice mode={mode} />)
    expect(html).toContain(mode)
    expect(html).not.toContain('Prototype mode')
    if (mode === 'BASE_SEPOLIA_DEMO') expect(html).toContain('Ethereum L1 finality')
    if (mode === 'SYNTHETIC_LOCAL') expect(html).toContain('공개 체인 증거 아님')
  })
  it('imports private files without displaying secret fields or an upload form', () => {
    const html = renderToStaticMarkup(<PrivatePackageInput present onChange={() => {}} />)
    expect(html).toContain('type="file"')
    expect(html).toContain('메모리')
    for (const forbidden of ['content_salt', 'original_text', 'action=', '<textarea', 'type="submit"']) expect(html).not.toContain(forbidden)
  })
  it('retains synthetic scope and separates core from lifecycle rendered states', async () => {
    expect(renderToStaticMarkup(<SyntheticLifecycleDemo />)).toContain('SYNTHETIC LIFECYCLE DEMO')
    const f = await syntheticLifecycleCase('MISSING_HISTORY')
    const report = await verifyReceipt(f.bundles[2], f.context)
    const html = renderToStaticMarkup(<VerifyReportView report={report} />)
    expect(report.code).toBe('VALID')
    expect(report.lifecycle.state).toBe('INCOMPLETE_HISTORY')
    expect(html).toContain('VALID')
    expect(html).toContain('선행 기록을 찾지 못해')
  })
})
