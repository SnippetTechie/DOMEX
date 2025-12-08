# DOMEX — Data Exchange Decentralized Trading on Flare

![alt text](image.png)
**Live App:** [domex-dex.vercel.app](https://domex-dex.vercel.app/)  

## 🧭 Overview

DOMEX is a next-generation decentralized trading platform on the **Flare Network** that prioritizes safety and data-driven execution. By leveraging Flare's native technologies—**FTSO**, **FDC**, **FAssets**, and **Smart Accounts**—DOMEX eliminates common DEX issues like sandwich attacks, MEV exploitation, and price manipulation.

It is the first DEX to offer truly oracle-enforced fair execution.

## 🔥 Key Features

### 🔐 1. Guarded Swaps (MEV-Resistant)
- **Real-time verification:** Compares AMM pool price with FTSO oracle price.
- **Protection:** automatically blocks trades if deviation exceeds a safe threshold.
- Prevents slippage fraud and low-liquidity manipulation.

### 📈 2. Real-Time Market Data
- Powered by **FTSO Live Feeds** (not centralized APIs).
- TradingView-style charts with block-latency updates for BTC, FLR, XRP, and more.
- Native multi-timeframe visualization.

### ⏰ 3. On-Chain Price Alerts
- First fully trustless alerting system in DeFi.
- Set alerts like *"BTC < $40k"* or *"Price deviation > 2%"*.
- Alerts are stored on-chain and triggered by live FTSO data.

### 🔗 4. Cross-Chain Intelligence (FDC)
- Reads attested external events (e.g., Bitcoin payments, CEX signals).
- Evolves DOMEX into a risk-aware, multi-chain intelligence system.

### 🪙 5. FAssets Integration
- Trustless DeFi trading for non-smart-contract assets: **F-BTC**, **F-XRP**, **F-LTC**, **F-DOGE**.
- Unlocks immense liquidity from Bitcoin and XRP ledgers.

### 🤖 6. Flare Smart Accounts
- Enables pre-trade validation and automatic approvals.
- Combines smart wallets with oracle gating for safer execution flows.

## 🛠️ Infrastructure

- **Network:** Flare Network
- **Data:** FTSO Price Provider & FDC
- **Execution:** Guarded Swap Validation Module & Smart Account Hooks

## 🚀 Roadmap

- **Phase 3:** Full FDC integration, on-chain liquidation alerts, AI-based oracle anomaly detection, and a mobile app.

---

<p align="center">
  This project is licensed under the MIT License.<br/>
  ⭐ <strong>Star the repo if you like DOMEX!</strong>
</p>
