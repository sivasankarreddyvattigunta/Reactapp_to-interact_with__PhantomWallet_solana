import './App.css';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    const provider = window.solana;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

export default function App() {
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );
  const [receiverPublicKey, setReceiverPublicKey] = useState<PublicKey | undefined>(
    undefined
  );
  const [senderKeypair, setSenderKeypair] = useState<Keypair | undefined>(
    undefined
  );
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");

  useEffect(() => {
    const provider = getProvider();
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  const createSender = async () => {
    const newKeypair = Keypair.generate(); // Create a new Keypair
    console.log('Sender account: ', newKeypair.publicKey.toString());
    console.log('Airdropping 2 SOL to Sender Wallet');

    await connection.requestAirdrop(newKeypair.publicKey, 2*LAMPORTS_PER_SOL); // Request airdrop into the new account

    const latestBlockHash = await connection.getLatestBlockhash();
    setSenderKeypair(newKeypair); // Save the new KeyPair into the state variable
  
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      try {
        const connected = await solana.connect(); // Connect to the Phantom wallet
        if (connected) {
          setReceiverPublicKey(solana.publicKey); // Save the public key of the Phantom wallet
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  const disconnectWallet = async () => {
    const { solana } = window;
    if (solana) {
      try {
        solana.disconnect();
        setReceiverPublicKey(undefined);
        console.log("Wallet disconnected");
      } catch (err) {
        console.log(err);
      }
    }
  };

  const transferSol = async () => {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair!.publicKey,
        toPubkey: receiverPublicKey!,
        lamports: 1 * LAMPORTS_PER_SOL,
      })
    );
    await sendAndConfirmTransaction(connection, transaction, [senderKeypair!]);
    console.log("Transaction sent and confirmed");
    console.log("Sender Balance: " + (await connection.getBalance(senderKeypair!.publicKey)) / LAMPORTS_PER_SOL);
    console.log("Receiver Balance: " + (await connection.getBalance(receiverPublicKey!)) / LAMPORTS_PER_SOL);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>Module 2 Assessment</h2>
        <span className ="buttons">
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={createSender}
          >
            Create a New Solana Account
          </button>
          {provider && !receiverPublicKey && (
            <button
              style={{
                fontSize: "16px",
                padding: "15px",
                fontWeight: "bold",
                borderRadius: "5px",
              }}
              onClick={connectWallet}
            >
              Connect to Phantom Wallet
            </button>
          )}
          {provider && receiverPublicKey && (
            <div>
              <button
                style={{
                  fontSize: "16px",
                  padding: "15px",
                  fontWeight: "bold",
                  borderRadius: "5px",
                  position: "absolute",
                  top: "28px",
                  right: "28px"
                }}
                onClick={disconnectWallet}
              >
                Disconnect from Wallet
              </button>
            </div>
          )}
          {provider && receiverPublicKey && senderKeypair && (
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={transferSol}
          >
            Transfer SOL to Phantom Wallet
          </button>
          )}
        </span>
        {!provider && (
          <p>
            No provider found. Install{" "}
            <a href="https://phantom.app/">Phantom Browser extension</a>
          </p>
        )}
      </header>
    </div>
  );
}
