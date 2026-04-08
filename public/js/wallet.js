const walletContent = document.getElementById("walletContent");
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login";
}

function renderWallet(data) {
  if (!walletContent) return;

  const { balance, transactions } = data;

  walletContent.innerHTML = `
    <section class="wallet-balance-card">
      <h2>Available Wallet Balance</h2>
      <strong>Rs. ${Number(balance || 0).toFixed(2)}</strong>
    </section>

    <section class="wallet-transactions-card">
      <div class="wallet-transactions-head">
        <h3>Transactions</h3>
      </div>

      ${
        transactions.length
          ? `
            <div class="wallet-transactions-table-wrap">
              <table class="wallet-transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions
                    .map(
                      (txn) => `
                        <tr>
                          <td>${new Date(txn.created_at).toLocaleDateString("en-IN")}</td>
                          <td>Rs. ${Number(txn.amount || 0).toFixed(2)}</td>
                          <td>${txn.description}</td>
                          <td class="${txn.type === "credit" ? "wallet-credit" : "wallet-debit"}">
                            ${txn.type === "credit" ? "Credited" : "Debited"}
                          </td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
          : `
            <div class="shop-empty">
              <h3>No wallet transactions yet</h3>
              <p>Refunds, referral rewards, and wallet payments will appear here.</p>
            </div>
          `
      }
    </section>
  `;
}

async function loadWallet() {
  const res = await fetch("/wallet/data", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    if (walletContent) {
      walletContent.innerHTML = `
        <div class="shop-empty">
          <h3>Unable to load wallet</h3>
          <p>${data.message || "Something went wrong."}</p>
        </div>
      `;
    }
    return;
  }

  renderWallet(data.data);
}

loadWallet();
