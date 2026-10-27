# Current State — School Expense Ecosystem

This file tracks the **current implementation status** by business capability. It is separate from `ARCHITECTURE.md`, which describes the intended/target architecture.

## English Version

### Overall completion

- **Overall project completion: ~55%**
- Core authentication, project/event management, and expense request submission are partially implemented.
- Budget reconciliation, multi-level approval hardening, disbursement, and reliable CI are incomplete.

### Completion by business capability

| Business capability | Completion | Notes |
| :--- | :---: | :--- |
| Authentication and authorization | 70% | Login and JWT issuance work; pending/onboarding status gating and token refresh need hardening. |
| User management and onboarding | 65% | User CRUD and onboarding exist; self-registration role/faculty restrictions are incomplete. |
| Project and event management | 60% | CRUD and join-code flows exist; fund restoration on rejection and pagination are incomplete. |
| Faculty budget management | 40% | Fund deduction on creation exists; full reserve/commit/release lifecycle is not implemented. |
| Expense request lifecycle | 50% | Request creation, listing, review, and audit logs exist; linkage to project/event budgets is missing. |
| Multi-level approval | 55% | Teacher, dean, and disbursement transitions exist; policy enforcement and atomic transitions need improvement. |
| Disbursement and settlement | 20% | Status values exist; payout batches, bank reconciliation, and receipt handling are not implemented. |
| Dashboard and reporting | 30% | Charts and analytics queries exist; many views are placeholders or rely on full collection scans. |
| Testing and CI | 35% | Tests exist, but stale suites and missing CI quality gates reduce reliability. |

### Status legend

- **0–25%**: scaffold or placeholder
- **26–50%**: partial implementation
- **51–75%**: usable but incomplete
- **76–100%**: production-ready within current scope

---

## 繁體中文版本（台灣）

### 整體完成度

- **專案整體完成度：約 55%**
- 核心認證、專案/活動管理、費用申請提交已部分實作。
- 預算對帳、多層級審核強化、撥款結算與可靠 CI 尚未完成。

### 依業務能力劃分的完成度

| 業務能力 | 完成度 | 說明 |
| :--- | :---: | :--- |
| 認證與授權 | 70% | 登入與 JWT 簽發可用；待審核/引導狀態攔截與 Token 更新需要強化。 |
| 使用者管理與引導註冊 | 65% | 使用者 CRUD 與引導註冊存在；自助註冊角色/院系限制不完整。 |
| 專案與活動管理 | 60% | CRUD 與加入碼流程存在；拒絕時的資金回復與分頁不完整。 |
| 院系預算管理 | 40% | 建立時扣減資金存在；完整的預留/提交/釋放生命週期尚未實作。 |
| 費用申請生命週期 | 50% | 申請建立、列表、審核與稽核紀錄存在；與專案/活動預算的關聯缺失。 |
| 多層級審核 | 55% | 教師、院長、撥款狀態轉換存在；策略校驗與原子化轉換需要改進。 |
| 撥款與結算 | 20% | 狀態值存在；批次撥款、銀行對帳與憑證處理未實作。 |
| 儀表板與報表 | 30% | 圖表與分析查詢存在；許多視圖仍為占位或依賴全集合掃描。 |
| 測試與 CI | 35% | 測試存在，但有過時用例且 CI 未執行品質門檻。 |

### 狀態說明

- **0–25%**：腳手架或占位實作
- **26–50%**：部分實作
- **51–75%**：可用但不完整
- **76–100%**：在目前範圍內可投入生產

---

`ARCHITECTURE.md` remains the intended/target architecture document. This file is the business-capability implementation-status counterpart and should be updated as capabilities move from partial to complete.
