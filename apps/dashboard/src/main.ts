import {
  ARC_TESTNET,
  createGuardrailsClient,
  formatUsdc,
  type AuditEvent as SdkAuditEvent,
  type BudgetState,
  type CounterpartyState,
  type HexAddress,
} from "@sherpa/guardrails";
import "./style.css";

type DashboardMode = "preview" | "live" | "error";

type DashboardEvent = {
  id: string;
  status: "approved" | "rejected";
  label: string;
  counterparty: string;
  amountBaseUnits: bigint;
  reason?: string;
  txHash?: string;
  timestamp: string;
};

type DashboardModel = {
  mode: DashboardMode;
  accountAddress: string;
  budget: Pick<
    BudgetState,
    "perTxCap" | "dailyCap" | "daySpent" | "remainingDailyCap"
  >;
  events: DashboardEvent[];
  counterparty?: CounterpartyState;
  error?: string;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root missing");
}

const root = app;

void boot();

async function boot() {
  root.innerHTML = loadingShell();

  const accountAddress = import.meta.env.VITE_SPEND_ACCOUNT_ADDRESS as
    | HexAddress
    | undefined;

  if (!accountAddress) {
    render(previewModel());
    return;
  }

  try {
    render(await liveModel(accountAddress));
  } catch (error) {
    render({
      ...previewModel(),
      mode: "error",
      error: error instanceof Error ? error.message : "Unknown dashboard error",
    });
  }
}

async function liveModel(accountAddress: HexAddress): Promise<DashboardModel> {
  const client = createGuardrailsClient({
    accountAddress,
    rpcUrl: import.meta.env.VITE_ARC_TESTNET_RPC_URL ?? ARC_TESTNET.rpcUrl,
  });
  const counterparty = import.meta.env.VITE_COUNTERPARTY_ADDRESS as
    | HexAddress
    | undefined;
  const fromBlock = parseFromBlock(import.meta.env.VITE_FROM_BLOCK);

  const [budget, events, counterpartyState] = await Promise.all([
    client.state(),
    client.auditEvents({ fromBlock }),
    counterparty ? client.counterpartyState(counterparty) : undefined,
  ]);

  return {
    mode: "live",
    accountAddress,
    budget,
    events: events.map(fromSdkEvent).reverse(),
    counterparty: counterpartyState,
  };
}

function previewModel(): DashboardModel {
  const dailyCap = 50_000_000n;
  const daySpent = 8_000_000n;

  return {
    mode: "preview",
    accountAddress: "0xSpendAccount...pending",
    budget: {
      perTxCap: 10_000_000n,
      dailyCap,
      daySpent,
      remainingDailyCap: dailyCap - daySpent,
    },
    counterparty: {
      counterparty: "0x000000000000000000000000000000000000dEaD",
      allowed: true,
      cap: 20_000_000n,
      spent: 8_000_000n,
      remaining: 12_000_000n,
    },
    events: [
      {
        id: "evt-001",
        status: "approved",
        label: "x402 API access",
        counterparty: "0x0000...dEaD",
        amountBaseUnits: 8_000_000n,
        txHash: "0xpreviewapproved",
        timestamp: "Preview",
      },
      {
        id: "evt-002",
        status: "rejected",
        label: "Over-cap retry",
        counterparty: "0x0000...dEaD",
        amountBaseUnits: 60_000_000n,
        reason: "PER_TX_CAP_EXCEEDED",
        timestamp: "Preview",
      },
    ],
  };
}

function render(model: DashboardModel) {
  const spentPercent = percent(model.budget.daySpent, model.budget.dailyCap);
  const remainingPercent = percent(
    model.budget.remainingDailyCap,
    model.budget.dailyCap,
  );

  root.innerHTML = `
    <main class="shell">
      <nav class="nav">
        <div>
          <p class="eyebrow">Sherpa Guardrails</p>
          <h1>Spend controls for autonomous agents</h1>
        </div>
        <span class="status-pill ${model.mode}">${statusLabel(model.mode)}</span>
      </nav>

      ${model.error ? `<div class="error-note">${escapeHtml(model.error)}</div>` : ""}

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
          <div class="mono">${displayAddress(model.accountAddress)}</div>
          <div class="label">USDC</div>
          <div class="mono">${displayAddress(ARC_TESTNET.usdcAddress)}</div>
        </div>
      </section>

      <section class="metric-grid">
        ${metric("Daily cap", `${formatUsdc(model.budget.dailyCap)} USDC`, 100)}
        ${metric("Spent today", `${formatUsdc(model.budget.daySpent)} USDC`, spentPercent)}
        ${metric("Remaining", `${formatUsdc(model.budget.remainingDailyCap)} USDC`, remainingPercent)}
        ${metric("Per tx cap", `${formatUsdc(model.budget.perTxCap)} USDC`, 100)}
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
            ${
              model.events.length
                ? model.events.map(renderEvent).join("")
                : `<div class="empty">No spend attempts found yet.</div>`
            }
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Counterparty</p>
              <h3>API provider allowance</h3>
            </div>
          </div>
          ${renderCounterparty(model.counterparty)}
          <div class="note">
            ${
              model.mode === "live"
                ? "Live mode reads cap state and audit events directly from Arc Testnet."
                : "Preview mode uses labeled demo data until a SpendAccount address is configured."
            }
          </div>
        </section>
      </section>
    </main>
  `;
}

function loadingShell() {
  return `
    <main class="shell">
      <nav class="nav">
        <div>
          <p class="eyebrow">Sherpa Guardrails</p>
          <h1>Loading dashboard</h1>
        </div>
        <span class="status-pill">Loading</span>
      </nav>
    </main>
  `;
}

function metric(label: string, value: string, fill: number) {
  return `
    <article class="metric">
      <p>${label}</p>
      <strong>${value}</strong>
      <div class="bar"><span style="width: ${clamp(fill)}%"></span></div>
    </article>
  `;
}

function renderEvent(event: DashboardEvent) {
  const amount = `${formatUsdc(event.amountBaseUnits)} USDC`;
  const detail =
    event.status === "approved"
      ? event.txHash
        ? txLink(event.txHash)
        : "approved"
      : `reason ${escapeHtml(event.reason ?? "UNKNOWN")}`;

  return `
    <article class="event ${event.status}">
      <div>
        <span class="badge">${event.status}</span>
        <h4>${escapeHtml(event.label)}</h4>
        <p>${escapeHtml(event.counterparty)} · ${escapeHtml(event.timestamp)}</p>
      </div>
      <div class="event-right">
        <strong>${amount}</strong>
        <span>${detail}</span>
      </div>
    </article>
  `;
}

function renderCounterparty(counterparty?: CounterpartyState) {
  if (!counterparty) {
    return `<div class="empty">Set VITE_COUNTERPARTY_ADDRESS to show allowance state.</div>`;
  }

  return `
    <div class="counterparty-row">
      <span>${shortAddress(counterparty.counterparty)}</span>
      <strong>${counterparty.allowed ? "Allowed" : "Blocked"}</strong>
    </div>
    <div class="counterparty-row">
      <span>Daily cap</span>
      <strong>${formatUsdc(counterparty.cap)} USDC</strong>
    </div>
    <div class="counterparty-row">
      <span>Spent</span>
      <strong>${formatUsdc(counterparty.spent)} USDC</strong>
    </div>
    <div class="counterparty-row">
      <span>Remaining</span>
      <strong>${formatUsdc(counterparty.remaining)} USDC</strong>
    </div>
  `;
}

function fromSdkEvent(event: SdkAuditEvent): DashboardEvent {
  return {
    id: event.id,
    status: event.status,
    label: event.status === "approved" ? "SpendExecuted" : "SpendRejected",
    counterparty: shortAddress(event.counterparty),
    amountBaseUnits: event.amountBaseUnits,
    reason: event.reason,
    txHash: event.transactionHash,
    timestamp: `Block ${event.blockNumber.toString()}`,
  };
}

function txLink(txHash: string) {
  if (!txHash.startsWith("0x") || txHash.includes("preview")) {
    return `tx ${escapeHtml(txHash)}`;
  }

  return `<a href="${ARC_TESTNET.explorerUrl}/tx/${txHash}" target="_blank" rel="noreferrer">tx ${shortHash(txHash)}</a>`;
}

function parseFromBlock(value: string | undefined): bigint | undefined {
  if (!value) return undefined;
  return BigInt(value);
}

function statusLabel(mode: DashboardMode) {
  if (mode === "live") return "Live Arc mode";
  if (mode === "error") return "Fallback preview";
  return "Preview mode";
}

function percent(value: bigint, total: bigint) {
  if (total === 0n) return 0;
  return Number((value * 100n) / total);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function shortAddress(address: string) {
  if (!address.startsWith("0x") || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortHash(hash: string) {
  if (!hash.startsWith("0x") || hash.length < 12) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function displayAddress(address: string) {
  return isHexAddress(address) ? shortAddress(address) : escapeHtml(address);
}

function isHexAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
