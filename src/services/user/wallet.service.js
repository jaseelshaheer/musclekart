import Wallet from "../../models/wallet.model.js";

export const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user_id: userId });

  if (!wallet) {
    wallet = await Wallet.create({
      user_id: userId,
      balance: 0,
      transactions: []
    });
  }

  return wallet;
};

export const getWalletService = async (userId) => {
  const wallet = await getOrCreateWallet(userId);

  return {
    balance: wallet.balance,
    transactions: [...wallet.transactions].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
  };
};

export const creditWalletService = async ({
  userId,
  amount,
  description,
  source,
  orderId = null
}) => {
  const creditAmount = Number(amount);

  if (!creditAmount || creditAmount <= 0) {
    throw new Error("Invalid wallet credit amount");
  }

  const wallet = await getOrCreateWallet(userId);

  wallet.balance += creditAmount;
  wallet.transactions.push({
    amount: creditAmount,
    type: "credit",
    description,
    source,
    order_id: orderId
  });

  await wallet.save();
  return wallet;
};

export const debitWalletService = async ({
  userId,
  amount,
  description,
  source,
  orderId = null
}) => {
  const debitAmount = Number(amount);

  if (!debitAmount || debitAmount <= 0) {
    throw new Error("Invalid wallet debit amount");
  }

  const wallet = await getOrCreateWallet(userId);

  if (wallet.balance < debitAmount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= debitAmount;
  wallet.transactions.push({
    amount: debitAmount,
    type: "debit",
    description,
    source,
    order_id: orderId
  });

  await wallet.save();
  return wallet;
};
