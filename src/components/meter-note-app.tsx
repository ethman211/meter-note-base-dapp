"use client";

import {
  Gauge,
  Loader2,
  Search,
  Star,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_NOTE_LENGTH,
  MAX_SUBJECT_LENGTH,
  meterNoteAbi,
  meterNoteContractAddress,
} from "@/lib/meter-note";

const PRESETS = [
  { subject: "Demo flow", score: 8, note: "Clear enough to use on the first try, but the final state could feel sharper." },
  { subject: "App screenshot", score: 7, note: "Good structure, though the primary visual could be stronger on mobile." },
  { subject: "Creator profile", score: 9, note: "Fast to scan and feels trustworthy. Nice wallet context and feedback density." },
] as const;

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid subject")) return "Subject needs 1 to 48 characters.";
  if (error.message.includes("Invalid score")) return "Score must be between 1 and 10.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 140 characters.";
  return error.message;
}

function MeterCard({
  subject,
  score,
  note,
  maker,
  createdAt,
}: {
  subject: string;
  score: number | bigint;
  note: string;
  maker?: Address;
  createdAt?: bigint;
}) {
  const numericScore = Number(score || 0);

  return (
    <article className="meter-card">
      <header className="meter-head">
        <div>
          <p>METER NOTE</p>
          <h2>{subject || "Untitled subject"}</h2>
        </div>
        <Gauge />
      </header>

      <section className="meter-stage">
        <div className="meter-arc" aria-hidden="true">
          {SCORES.map((item) => (
            <span key={item} className={item <= numericScore ? "active" : ""} />
          ))}
        </div>
        <div className="score-pill">
          <span>Score</span>
          <strong>{numericScore || 0}/10</strong>
        </div>
      </section>

      <section className="note-strip">
        <div>
          <span>Reason</span>
          <strong>{note || "Save a quick feedback note on Base."}</strong>
        </div>
        <div>
          <span>Wallet</span>
          <strong>{shortAddress(maker)}</strong>
        </div>
        <div>
          <span>Stamped</span>
          <strong>{formatDate(createdAt)}</strong>
        </div>
      </section>
    </article>
  );
}

export function MeterNoteApp() {
  const [entryIdInput, setEntryIdInput] = useState("1");
  const [subject, setSubject] = useState<string>(PRESETS[0].subject);
  const [score, setScore] = useState<number>(PRESETS[0].score);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [message, setMessage] = useState("Save a quick public score on Base.");
  const [lastAction, setLastAction] = useState<"save" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedEntryId = BigInt(Math.max(1, Number(entryIdInput || "1")));

  const entryQuery = useReadContract({
    abi: meterNoteAbi,
    address: meterNoteContractAddress,
    functionName: "getEntry",
    args: [parsedEntryId],
    query: { enabled: Boolean(meterNoteContractAddress), refetchInterval: 12000 },
  });

  const totalQuery = useReadContract({
    abi: meterNoteAbi,
    address: meterNoteContractAddress,
    functionName: "nextEntryId",
    query: { enabled: Boolean(meterNoteContractAddress), refetchInterval: 12000 },
  });

  const tuple = entryQuery.data as
    | readonly [Address, string, number, string, bigint]
    | undefined;

  const liveEntry = useMemo(
    () =>
      tuple
        ? {
            maker: tuple[0],
            subject: tuple[1],
            score: Number(tuple[2]),
            note: tuple[3],
            createdAt: tuple[4],
          }
        : undefined,
    [tuple],
  );

  const totalEntries = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    subject.trim().length > 0 &&
    subject.trim().length <= MAX_SUBJECT_LENGTH &&
    score >= 1 &&
    score <= 10 &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const saveBlocker = !meterNoteContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_METER_NOTE_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill subject, score, and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "save") return;
    void totalQuery.refetch();
    void entryQuery.refetch();
    const logs = parseEventLogs({ abi: meterNoteAbi, logs: receipt.logs, eventName: "EntrySaved" });
    const entryId = logs[0]?.args.entryId;
    window.setTimeout(() => {
      if (entryId) setEntryIdInput(entryId.toString());
      setMessage(entryId ? `Meter note #${entryId.toString()} saved on Base.` : "Meter note saved on Base.");
    }, 0);
  }, [lastAction, receipt, totalQuery, entryQuery]);

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, queue) => queue.findIndex((item) => item.id === connector.id) === index);

    if (connectorQueue.length === 0) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Save the score when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function saveEntry() {
    const contractAddress = meterNoteContractAddress;
    if (saveBlocker) {
      setMessage(saveBlocker);
      return;
    }
    if (!contractAddress) {
      setMessage("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }
    try {
      setLastAction("save");
      setMessage("Confirm the score note in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: meterNoteAbi,
        functionName: "saveEntry",
        args: [subject.trim(), score, note.trim()],
        chainId: base.id,
      });
      setMessage("Score note sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setSubject(preset.subject);
    setScore(preset.score);
    setNote(preset.note);
  }

  return (
    <main className="meter-shell">
      <section className="meter-panel">
        <header className="meter-panel-head">
          <div>
            <p>METER NOTE</p>
            <h1>Score it fast.</h1>
          </div>
          <div className="gauge-chip">
            <Gauge />
          </div>
        </header>

        <div className="meter-stats">
          <div>
            <span>Entries</span>
            <strong>{totalEntries}</strong>
          </div>
          <div>
            <span>Chain</span>
            <strong>Base</strong>
          </div>
        </div>

        <div className="meter-presets">
          {PRESETS.map((preset, index) => (
            <button key={preset.subject} onClick={() => applyPreset(index)}>
              <span>{preset.score}/10</span>
              <div>
                <strong>{preset.subject}</strong>
                <small>{preset.note}</small>
              </div>
            </button>
          ))}
        </div>

        <label>
          <span>Subject</span>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={MAX_SUBJECT_LENGTH} />
        </label>

        <div className="score-grid">
          {SCORES.map((item) => (
            <button
              key={item}
              className={item === score ? "score-box active" : "score-box"}
              onClick={() => setScore(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <label>
          <span>Note</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_NOTE_LENGTH} rows={3} />
        </label>

        <div className="meter-actions">
          {isConnected && chainId !== base.id ? (
            <button className="save-button" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>
              {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Switch to Base
            </button>
          ) : (
            <button className="save-button" disabled={writing || confirming} onClick={saveEntry}>
              {writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
              Save on Base
            </button>
          )}
          {isConnected ? (
            <button className="wallet-tag" onClick={disconnectWallet}>
              {shortAddress(address)}
            </button>
          ) : (
            <button className="wallet-tag" disabled={!selectedConnector || connecting} onClick={connectWallet}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Connect wallet
            </button>
          )}
        </div>

        <p className="meter-status">{message}</p>
        {hash ? (
          <a className="meter-tx" href={`https://basescan.org/tx/${hash}`} rel="noreferrer" target="_blank">
            View transaction on BaseScan
          </a>
        ) : null}
      </section>

      <section className="meter-display">
        <MeterCard
          subject={liveEntry?.subject || subject}
          score={liveEntry?.score || score}
          note={liveEntry?.note || note}
          maker={liveEntry?.maker}
          createdAt={liveEntry?.createdAt}
        />

        <div className="meter-lower">
          <section className="lookup-meter">
            <div>
              <Search />
              <h2>Load entry</h2>
            </div>
            <label>
              <span>Entry ID</span>
              <input value={entryIdInput} onChange={(event) => setEntryIdInput(event.target.value.replace(/\D/g, ""))} />
            </label>
          </section>

          <section className="about-meter">
            <p>What it does</p>
            <strong>
              Meter Note lets a wallet save a public 1-10 score with a short note, wallet, and timestamp on Base.
            </strong>
            <div>
              <span><Gauge /> Quick score</span>
              <span><Star /> Public feedback</span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
