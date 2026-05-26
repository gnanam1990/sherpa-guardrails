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

type ProductSnapshot = {
  approvedAmount: bigint;
  rejectedAmount: bigint;
  approvedCount: number;
  rejectedCount: number;
  dailyUtilization: number;
  runwayCount: bigint;
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
  const daySpent = 17_000_000n;

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
      spent: 17_000_000n,
      remaining: 3_000_000n,
    },
    events: [
      {
        id: "evt-004",
        status: "rejected",
        label: "Over-cap retry",
        counterparty: "0x0000...dEaD",
        amountBaseUnits: 60_000_000n,
        reason: "PER_TX_CAP_EXCEEDED",
        timestamp: "Preview",
      },
      {
        id: "evt-003",
        status: "approved",
        label: "Vector DB lookup",
        counterparty: "0x0000...dEaD",
        amountBaseUnits: 9_000_000n,
        txHash: "0xpreviewlookup",
        timestamp: "Preview",
      },
      {
        id: "evt-002",
        status: "rejected",
        label: "Unknown vendor spend",
        counterparty: "0x0000...bEEF",
        amountBaseUnits: 5_000_000n,
        reason: "COUNTERPARTY_BLOCKED",
        timestamp: "Preview",
      },
      {
        id: "evt-001",
        status: "approved",
        label: "x402 API access",
        counterparty: "0x0000...dEaD",
        amountBaseUnits: 8_000_000n,
        txHash: "0xpreviewapi",
        timestamp: "Preview",
      },
    ],
  };
}

function render(model: DashboardModel) {
  const snapshot = snapshotFrom(model);

  root.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Sherpa Guardrails</p>
          <h1>Agent Spend Control Plane</h1>
        </div>
        <div class="mode-stack">
          <span class="status-pill ${model.mode}">${statusLabel(model.mode)}</span>
          <span class="chain-pill">Arc Testnet ${ARC_TESTNET.chainId}</span>
        </div>
      </header>

      ${model.error ? `<div class="error-note">${escapeHtml(model.error)}</div>` : ""}

      <section class="command-band">
        <div>
          <p class="eyebrow">Settlement account</p>
          <h2>Policy-enforced USDC wallet</h2>
          <p class="summary-copy">
            The agent has no unrestricted wallet access. Every USDC transfer is
            checked against policy inside <code>SpendAccount</code> before funds move.
          </p>
        </div>
        <div class="chain-panel">
          ${chainFact("Spend account", displayAddress(model.accountAddress))}
          ${chainFact("USDC token", displayAddress(ARC_TESTNET.usdcAddress))}
          ${chainFact("SDK package", "@sherpa/guardrails")}
          ${chainFact("Policy gate", "Contract enforced")}
        </div>
      </section>

      <section class="metric-grid">
        ${metric("Daily budget", `${formatUsdc(model.budget.dailyCap)} USDC`, 100, "green")}
        ${metric("Settled spend", `${formatUsdc(snapshot.approvedAmount)} USDC`, snapshot.dailyUtilization, "blue")}
        ${metric("Remaining", `${formatUsdc(model.budget.remainingDailyCap)} USDC`, percent(model.budget.remainingDailyCap, model.budget.dailyCap), "teal")}
        ${metric("Rejected risk", `${formatUsdc(snapshot.rejectedAmount)} USDC`, 100, "red")}
      </section>

      <section class="product-grid">
        <section class="panel span-2">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Policy engine</p>
              <h3>Hard limits active before settlement</h3>
            </div>
            <span class="health-score">${policyHealth(snapshot)}%</span>
          </div>
          <div class="policy-grid">
            ${policyCard("Per transaction cap", `${formatUsdc(model.budget.perTxCap)} USDC`, "Rejects large single spends", "active")}
            ${policyCard("Daily budget cap", `${formatUsdc(model.budget.dailyCap)} USDC`, `${formatUsdc(model.budget.remainingDailyCap)} USDC still available`, "active")}
            ${policyCard("Counterparty allowlist", counterpartyStatus(model.counterparty), counterpartyDetail(model.counterparty), model.counterparty?.allowed ? "active" : "warning")}
            ${policyCard("Spend runway", `${snapshot.runwayCount.toString()} safe calls`, "Based on remaining budget and per-tx cap", "active")}
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Operator controls</p>
              <h3>Account safety</h3>
            </div>
          </div>
          <div class="control-list">
            ${controlItem("Pause", "Stops all new spend requests")}
            ${controlItem("Revoke", "Permanently disables the agent key")}
            ${controlItem("Withdraw", "Returns remaining USDC to operator")}
            ${controlItem("Audit", "Reads SpendExecuted and SpendRejected")}
          </div>
        </section>

        <section class="panel span-2">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Audit trail</p>
              <h3>Approved and rejected spend attempts</h3>
            </div>
            <div class="audit-counts">
              <span>${snapshot.approvedCount} approved</span>
              <span>${snapshot.rejectedCount} rejected</span>
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
        </section>

        <section class="panel span-2">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Agent simulation</p>
              <h3>Same policy, different outcomes</h3>
            </div>
          </div>
          <div class="sim-grid">
            ${simulationCard("Allowed API call", "8 USDC", "Within per-tx, daily, and counterparty caps", "approved")}
            ${simulationCard("Blocked overrun", "60 USDC", "Exceeds the 10 USDC per-transaction cap", "rejected")}
            ${simulationCard("Blocked vendor", "5 USDC", "Counterparty is not allowlisted by operator", "rejected")}
          </div>
        </section>

        <section class="panel developer-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Developer handoff</p>
              <h3>Drop-in SDK call</h3>
            </div>
          </div>
          <pre><code>${escapeHtml(sdkSnippet())}</code></pre>
        </section>
      </section>
    </main>
  `;
}

function loadingShell() {
  return `
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Sherpa Guardrails</p>
          <h1>Loading control plane</h1>
        </div>
        <span class="status-pill">Loading</span>
      </header>
    </main>
  `;
}

function metric(label: string, value: string, fill: number, tone: string) {
  return `
    <article class="metric ${tone}">
      <p>${label}</p>
      <strong>${value}</strong>
      <div class="bar"><span style="width: ${clamp(fill)}%"></span></div>
    </article>
  `;
}

function chainFact(label: string, value: string) {
  return `
    <div class="chain-fact">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function policyCard(label: string, value: string, detail: string, state: string) {
  return `
    <article class="policy-card ${state}">
      <span class="status-dot"></span>
      <p>${escapeHtml(label)}</p>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `;
}

function controlItem(label: string, detail: string) {
  return `
    <div class="control-item">
      <span></span>
      <div>
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(detail)}</p>
      </div>
    </div>
  `;
}

function simulationCard(
  label: string,
  amount: string,
  detail: string,
  status: "approved" | "rejected",
) {
  return `
    <article class="simulation ${status}">
      <div>
        <span class="badge">${status}</span>
        <h4>${escapeHtml(label)}</h4>
        <p>${escapeHtml(detail)}</p>
      </div>
      <strong>${escapeHtml(amount)}</strong>
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
        <p>${escapeHtml(event.counterparty)} | ${escapeHtml(event.timestamp)}</p>
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
    <div class="counterparty-card">
      <div>
        <span>${shortAddress(counterparty.counterparty)}</span>
        <strong>${counterparty.allowed ? "Allowed" : "Blocked"}</strong>
      </div>
      <div class="mini-meter">
        <span style="width: ${clamp(percent(counterparty.spent, counterparty.cap))}%"></span>
      </div>
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

function snapshotFrom(model: DashboardModel): ProductSnapshot {
  const approved = model.events.filter((event) => event.status === "approved");
  const rejected = model.events.filter((event) => event.status === "rejected");
  const approvedAmount = approved.reduce(
    (sum, event) => sum + event.amountBaseUnits,
    0n,
  );
  const rejectedAmount = rejected.reduce(
    (sum, event) => sum + event.amountBaseUnits,
    0n,
  );
  const runwayCount: bigint =
    model.budget.perTxCap === 0n
      ? 0n
      : model.budget.remainingDailyCap / model.budget.perTxCap;

  return {
    approvedAmount,
    rejectedAmount,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    dailyUtilization: percent(model.budget.daySpent, model.budget.dailyCap),
    runwayCount,
  };
}

function txLink(txHash: string) {
  if (!txHash.startsWith("0x") || txHash.includes("preview")) {
    return "preview tx";
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

function policyHealth(snapshot: ProductSnapshot) {
  if (snapshot.rejectedCount === 0) return 92;
  return 98;
}

function counterpartyStatus(counterparty?: CounterpartyState) {
  if (!counterparty) return "Not configured";
  return counterparty.allowed ? "Allowed" : "Blocked";
}

function counterpartyDetail(counterparty?: CounterpartyState) {
  if (!counterparty) return "Set env var to read live allowance";
  return `${formatUsdc(counterparty.remaining)} USDC remaining for provider`;
}

function sdkSnippet() {
  return `const client = createGuardrailsClient({
  accountAddress,
  account: agentSigner,
});

await client.spend({
  counterparty,
  amountUsdc: "8",
  action: "x402_api_call",
});`;
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
