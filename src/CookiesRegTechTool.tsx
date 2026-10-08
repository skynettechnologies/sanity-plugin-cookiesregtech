/**
 * The Cookie Consent tool: connect, pending, and connected screens.
 *
 * Runs entirely in the Studio (browser). The connection - the public
 * Domain ID the frontend snippet needs, plus the secret used to mint
 * one-time signed-in dashboard links - is kept in localStorage of this
 * browser only; nothing secret ever reaches the published site.
 */
import type {CSSProperties, JSX} from 'react'
import {useCallback, useEffect, useState} from 'react'

const VERSION = '1.0.0'
const SERVER = 'https://www.cookiesregtech.com'
const STORE_KEY = 'cookiesregtech_sanity'

interface Connection {
  domainId?: string
  secret?: string
  requestToken?: string
  email?: string
  hostname?: string
}

interface ApiResult {
  status?: string
  domainId?: string
  secret?: string
  requestToken?: string
  email?: string
  error?: string
  url?: string
  _status: number
}

interface Notice {
  kind: 'success' | 'warning' | 'error'
  text: string
}

function read(): Connection {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function write(value: Connection): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(value))
  } catch {
    /* private windows etc. - the tool still works, it just forgets */
  }
}

async function api(path: string, body: unknown): Promise<ApiResult> {
  const response = await fetch(SERVER + path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  })
  const parsed: unknown = await response.json().catch(() => ({}))
  const data = parsed && typeof parsed === 'object' ? (parsed as Omit<ApiResult, '_status'>) : {}
  return {...data, _status: response.status}
}

const ui = {
  outer: {background: '#f6f1fd', minHeight: '100%', padding: '40px 32px', overflow: 'auto'},
  wrap: {
    maxWidth: 920,
    margin: '0 auto',
    color: '#12242a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: 16,
    lineHeight: 1.6,
  },
  head: {display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6},
  brand: {display: 'flex', alignItems: 'center', gap: 12},
  badge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: '#8b45e6',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 16,
  },
  title: {margin: 0, fontSize: 26, fontWeight: 700, color: '#280050'},
  tagline: {color: '#5b6675', margin: '4px 0 24px', fontSize: 15.5},
  pill: {
    background: '#e8f6ee',
    color: '#16794c',
    fontSize: 14.5,
    fontWeight: 700,
    borderRadius: 20,
    padding: '6px 14px',
    whiteSpace: 'nowrap',
  },
  panel: {background: '#fff', border: '1px solid #e3dbf2', borderRadius: 12, padding: '26px 28px', marginBottom: 18},
  field: {display: 'block', maxWidth: 520, marginBottom: 16, fontSize: 15.5},
  fieldLabel: {display: 'block', fontWeight: 700, marginBottom: 6, color: '#12242a'},
  input: {
    width: '100%',
    padding: '13px 15px',
    border: '1px solid #c9c2d8',
    borderRadius: 8,
    font: 'inherit',
    fontSize: 15.5,
    background: '#fff',
    color: '#12242a',
    boxSizing: 'border-box',
  },
  small: {display: 'block', color: '#5b6675', marginTop: 6, fontSize: 14},
  consent: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    maxWidth: 680,
    marginBottom: 8,
    fontSize: 15.5,
    color: '#12242a',
  },
  btn: {
    border: '1px solid #c9c2d8',
    borderRadius: 8,
    padding: '13px 24px',
    minHeight: 46,
    font: 'inherit',
    fontSize: 15.5,
    fontWeight: 700,
    cursor: 'pointer',
    background: '#fff',
    color: '#12242a',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: 1.4,
  },
  btnPrimary: {background: '#6d28d9', borderColor: '#6d28d9', color: '#fff'},
  btnDanger: {color: '#a52333', borderColor: '#dfa4ad'},
  actions: {display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 14},
  hint: {color: '#5b6675', fontSize: 14},
  noticeBox: {
    background: '#fff',
    border: '1px solid #e3dbf2',
    borderRadius: 10,
    padding: '20px 24px',
    maxWidth: 680,
    marginBottom: 18,
  },
  h3: {margin: '0 0 8px', fontSize: 18, color: '#280050'},
  code: {
    display: 'block',
    background: '#160a24',
    color: '#f3ecff',
    borderRadius: 8,
    padding: '14px 16px',
    fontSize: 14,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
  link: {color: '#5b21b6'},
  version: {color: '#8b93a1', fontSize: 13.5, marginTop: 28},
} satisfies Record<string, CSSProperties>

function noticeStyle(kind: Notice['kind']): CSSProperties {
  return {
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 18,
    fontWeight: 600,
    fontSize: 15.5,
    background: kind === 'error' ? '#fdf3f4' : kind === 'warning' ? '#fdf6e3' : '#e8f6ee',
    color: kind === 'error' ? '#a52333' : kind === 'warning' ? '#8a6d1a' : '#16794c',
  }
}

/** @internal */
export function CookiesRegTechIcon(): JSX.Element {
  return <span style={{fontWeight: 700}}>CR</span>
}

/** @internal */
export function CookiesRegTechTool(): JSX.Element {
  const [stored, setStored] = useState<Connection>(read)
  const [email, setEmail] = useState(() => stored.email || '')
  const [hostname, setHostname] = useState(() => stored.hostname || '')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => write(stored), [stored])

  const state = stored.domainId ? 'connected' : stored.requestToken ? 'pending' : 'connect'
  const snippet = stored.domainId ? `<script src="${SERVER}/embed/boot/${stored.domainId}.js"></script>` : ''

  const connect = useCallback(async () => {
    const host = hostname
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim()
    if (!host || !email.includes('@') || !consent) {
      setNotice({
        kind: 'error',
        text: 'Enter the website address, a valid email address, and accept the terms to continue.',
      })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      const result = await api('/api/plugin/provision', {email, hostname: host, platform: 'sanity', consent: true})
      if (result.status === 'connected' && result.domainId) {
        // Keep the Domain ID for the snippet and the secret for signed-in links.
        setStored({domainId: result.domainId, secret: result.secret, email: result.email || email, hostname: host})
        setNotice({
          kind: 'success',
          text: `The free account is ready. Add the snippet below to the site frontend. A sign-in link was emailed to ${email}.`,
        })
      } else if (result.status === 'confirmation_sent') {
        setStored({requestToken: result.requestToken, email, hostname: host})
        setNotice({
          kind: 'success',
          text: 'That email already has an account. We sent it a confirmation link. Click the link, then press "Check status" here.',
        })
      } else {
        setNotice({
          kind: 'error',
          text: result.error || `Unexpected reply from the consent server (HTTP ${result._status || 0}).`,
        })
      }
    } catch {
      setNotice({kind: 'error', text: 'Could not reach the consent server. Check the connection and try again.'})
    }
    setBusy(false)
  }, [email, hostname, consent])

  const check = useCallback(async () => {
    setBusy(true)
    setNotice(null)
    try {
      const result = await api('/api/plugin/status', {requestToken: stored.requestToken})
      if (result.status === 'connected' && result.domainId) {
        setStored({domainId: result.domainId, secret: result.secret, email: stored.email, hostname: stored.hostname})
        setNotice({kind: 'success', text: 'Connected. Add the snippet below to the site frontend.'})
      } else if (result.status === 'pending') {
        setNotice({kind: 'warning', text: 'Not confirmed yet. Click the link in the email first.'})
      } else {
        setStored({email: stored.email, hostname: stored.hostname})
        setNotice({kind: 'error', text: result.error || 'The request expired. Start again.'})
      }
    } catch {
      setNotice({kind: 'error', text: 'Could not reach the consent server. Check the connection and try again.'})
    }
    setBusy(false)
  }, [stored])

  const startOver = useCallback(() => {
    setStored({email: stored.email, hostname: stored.hostname})
    setNotice(null)
  }, [stored])

  const openDashboard = useCallback(async () => {
    if (!stored.secret) {
      // Connections made before secrets were kept: plain dashboard link.
      window.open('https://www.cookiesregtech.com/', '_blank', 'noopener')
      return
    }
    // Open the tab synchronously so pop-up blockers allow it, then point it
    // at the one-time signed-in link.
    const tab = window.open('about:blank', '_blank')
    try {
      const result = await api('/api/plugin/login-link', {secret: stored.secret})
      if (typeof result.url === 'string' && result.url.startsWith('https://')) {
        if (tab) tab.location.href = result.url
        else window.open(result.url, '_blank', 'noopener')
        return
      }
      throw new Error('no url')
    } catch {
      if (tab) tab.location.href = 'https://www.cookiesregtech.com/'
      setNotice({kind: 'warning', text: 'Could not create a sign-in link - the dashboard opened with normal login instead.'})
    }
  }, [stored])

  const forget = useCallback(() => {
    if (
      window.confirm(
        'Forget this connection in the Studio? The CookiesRegTech account and the banner on the site are unchanged.',
      )
    ) {
      setStored({})
      setNotice(null)
    }
  }, [])

  return (
    <div style={ui.outer}>
      <div style={ui.wrap}>
        <div style={ui.head}>
          <div style={ui.brand}>
            <span style={ui.badge} aria-hidden="true">
              CR
            </span>
            <h1 style={ui.title}>CookiesRegTech - Cookie Consent</h1>
          </div>
          {state === 'connected' && <span style={ui.pill}>&#9679; Connected</span>}
        </div>
        <p style={ui.tagline}>
          GDPR/CCPA consent banner, cookie scanner and consent log for the website this Sanity Studio powers.
        </p>

        {notice && <div style={noticeStyle(notice.kind)}>{notice.text}</div>}

        {state === 'connect' && (
          <div style={ui.panel}>
            <label style={ui.field}>
              <span style={ui.fieldLabel}>Website address</span>
              <input
                style={ui.input}
                value={hostname}
                onChange={(e) => setHostname(e.currentTarget.value)}
                placeholder="www.customersite.com"
              />
              <small style={ui.small}>
                Sanity is headless, so enter the public address of the website this Studio serves.
              </small>
            </label>
            <label style={ui.field}>
              <span style={ui.fieldLabel}>Account email</span>
              <input style={ui.input} type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
              <small style={ui.small}>
                The consent dashboard login. If this email already has a CookiesRegTech account, we send it a
                confirmation link instead of creating a new one.
              </small>
            </label>
            <label style={ui.consent}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.currentTarget.checked)}
                style={{marginTop: 5, accentColor: '#6d28d9'}}
              />
              <span>
                Create a free CookiesRegTech account for this email, connect this website, and accept the{' '}
                <a href="https://www.cookiesregtech.com/terms-and-condition" target="_blank" rel="noreferrer" style={ui.link}>
                  Terms &amp; Conditions
                </a>{' '}
                and{' '}
                <a href="https://www.cookiesregtech.com/privacy-policy" target="_blank" rel="noreferrer" style={ui.link}>
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            <div style={ui.actions}>
              <button type="button" style={{...ui.btn, ...ui.btnPrimary}} disabled={busy} onClick={connect}>
                Connect website
              </button>
              <span style={ui.hint}>Free plan &middot; no card required</span>
            </div>
          </div>
        )}

        {state === 'pending' && (
          <div>
            <div style={ui.noticeBox}>
              <h3 style={ui.h3}>Almost done. Confirm from the inbox</h3>
              <p style={{margin: 0, fontSize: 15.5}}>
                A confirmation link was sent to <strong>{stored.email}</strong> because this email already has a
                CookiesRegTech account. Click the link in that email, then come back here.
              </p>
            </div>
            <div style={ui.actions}>
              <button type="button" style={{...ui.btn, ...ui.btnPrimary}} disabled={busy} onClick={check}>
                Check status
              </button>
              <button type="button" style={ui.btn} disabled={busy} onClick={startOver}>
                Start over
              </button>
            </div>
          </div>
        )}

        {state === 'connected' && (
          <div>
            <div style={ui.panel}>
              <h3 style={ui.h3}>Install on the site frontend</h3>
              <p style={{margin: '0 0 12px', fontSize: 15.5}}>
                Add this one line to the frontend app&apos;s HTML, right after the opening &lt;head&gt; tag and BEFORE
                Google Tag Manager or any analytics script. Banner design, cookie scans, languages, and the consent log
                are managed in the{' '}
                <a href="https://www.cookiesregtech.com" target="_blank" rel="noreferrer" style={ui.link}>
                  CookiesRegTech dashboard
                </a>{' '}
                and publish to the site instantly.
              </p>
              <code style={ui.code}>{snippet}</code>
            </div>
            <div style={ui.panel}>
              <p style={{margin: 0, fontSize: 15.5}}>
                Account: <strong>{stored.email || '-'}</strong> &middot; Website: <strong>{stored.hostname || '-'}</strong>{' '}
                &middot; Domain ID: <code style={{fontSize: 14}}>{stored.domainId}</code>
              </p>
            </div>
            <div style={ui.actions}>
              <button type="button" style={{...ui.btn, ...ui.btnPrimary}} disabled={busy} onClick={openDashboard}>
                Open dashboard
              </button>
              <button type="button" style={{...ui.btn, ...ui.btnDanger, marginLeft: 'auto'}} onClick={forget}>
                Forget connection
              </button>
            </div>
          </div>
        )}

        <p style={ui.version}>CookiesRegTech Sanity plugin v{VERSION}</p>
      </div>
    </div>
  )
}
