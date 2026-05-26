import { ARC_TESTNET, formatUsdc } from "@sherpa/guardrails";
import "./style.css";

type AuditEvent = {
  id: string;
  status: "approved" | "rejected";
  label: string;
  counterparty: string;
  amountBaseUnits: bigint;
  reason?: string;
  txHash?: string;
  timestamp: string;
};

const dailyCap = 50_000_000n;
const spentToday = 8_000_000n;
const perTxCap = 10_000_000n;
const remaining = dailyCap - spentToday;

const events: AuditEvent[] = [
  {
    id: "evt-001",
    status: "approved",
    label: "x402 API access",
    counterparty: "0x0000...dEaD",
    amountBaseUnits: 8_000_000n,
    txHash: "0xpreviewapproved",
    timestamp: "12:42 PM",
  },
  {
    id: "evt-002",
    status: "rejected",
    label: "Over-cap retry",
    counterparty: "0x0000...dEaD",
    amountBaseUnits: 60_000_000n,
    reason: "PER_TX_CAP_EXCEEDED",
    timestamp: "12:43 PM",
  },
];

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root missing");
}

app.innerHTML = `
  <main class="shell">
    <nav class="nav">
      <div>
        <p class="eyebrow">Sherpa Guardrails</p>
        <h1>Spend controls for autonomous agents</h1>
      </div>
      <span class="status-pill">Preview mode</span>
    </nav>

    <section class="hero">
      <div>
        <p class="eyebrow">Corporate card for agents</p>
        <h2>$50/day budget, enforced by the contract.</h2>
        <p class="hero-copy">
          Valid agent spend executes. Over-limit attempts move no funds and
          become public audit entries for the operator.
        </p>
      </div>
      <div class="account-panel">
        <div class="label">Target chain</div>
        <div class="value">Arc Testnet · ${ARC_TESTNET.chainId}</div>
        <div class="label">Spend account</div>
        <div class="mono">0xSpendAccount...pending</div>
        <div class="label">USDC</div>
        <div class="mono">${ARC_TESTNET.usdcAddress}</div>
      </div>
    </section>

    <section class="metric-grid">
      ${metric("Daily cap", `${formatUsdc(dailyCap)} USDC`, 100)}
      ${metric("Spent today", `${formatUsdc(spentToday)} USDC`, percent(spentToday, dailyCap))}
      ${metric("Remaining", `${formatUsdc(remaining)} USDC`, percent(remaining, dailyCap))}
      ${metric("Per tx cap", `${formatUsdc(perTxCap)} USDC`, 100)}
    </section>

    <section class="content-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Audit feed</p>
            <h3>Approved and rejected attempts</h3>
          </div>
        </div>
        <div class="event-list">
          ${events.map(renderEvent).join("")}
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Counterparty</p>
            <h3>API provider allowance</h3>
          </div>
        </div>
        <div class="counterparty-row">
          <span>0x0000...dEaD</span>
          <strong>Allowed</strong>
        </div>
        <div class="counterparty-row">
          <span>Daily cap</span>
          <strong>20 USDC</strong>
        </div>
        <div class="counterparty-row">
          <span>Spent</span>
          <strong>8 USDC</strong>
        </div>
        <div class="note">
          Next stage wires these rows directly to Arc events from
          <code>SpendExecuted</code> and <code>SpendRejected</code>.
        </div>
      </section>
    </section>
  </main>
`;

function metric(label: string, value: string, fill: number) {
  return `
    <article class="metric">
      <p>${label}</p>
      <strong>${value}</strong>
      <div class="bar"><span style="width: ${fill}%"></span></div>
    </article>
  `;
}

function renderEvent(event: AuditEvent) {
  const amount = `${formatUsdc(event.amountBaseUnits)} USDC`;
  const detail =
    event.status === "approved"
      ? `tx ${event.txHash}`
      : `reason ${event.reason}`;

  return `
    <article class="event ${event.status}">
      <div>
        <span class="badge">${event.status}</span>
        <h4>${event.label}</h4>
        <p>${event.counterparty} · ${event.timestamp}</p>
      </div>
      <div class="event-right">
        <strong>${amount}</strong>
        <span>${detail}</span>
      </div>
    </article>
  `;
}

function percent(value: bigint, total: bigint) {
  if (total === 0n) return 0;
  return Number((value * 100n) / total);
}
