const express = require('express');
const cors = require('cors');
const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferInstruction } = require('@solana/spl-token');
const bs58 = require('bs58');

const app = express();
app.use(cors());
app.use(express.json());
// === MỞ TRANG CHỦ KHÔNG CẦN ĐĂNG NHẬP ===
const trangMo = ['/', '/index.html'];

app.use((req, res, next) => {
  if (trangMo.includes(req.path)) {
    return next();
  }
  if (!req.session || !req.session.user) {
    return res.redirect('/login.html');
  }
  next();
});
// 1. KẾT NỐI MẠNG LƯỚI SOLANA MAINNET
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// 2. KHỞI TẠO VÍ NGUỒN PHÁT TOKEN
let fromWallet;
const rawSecret = process.env.PRIVATE_KEY || process.env.SOLANA_SECRET_KEY || process.env.SOLANA_PRIVATE_KEY || '';
const tokenMintAddress = process.env.MINT_ADDRESS || process.env.TOKEN_MINT_ADDRESS || 'HHb2PrZYNwqJLCJKGMvwtsRdc3hZvMBNdoqYSKDoFEdO';

if (!rawSecret) {
  console.error("❌ LỖI: Chưa cài đặt biến môi trường PRIVATE_KEY trên Render!");
  process.exit(1);
}

try {
  if (rawSecret.trim().startsWith('[')) {
    fromWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(rawSecret.trim())));
  } else {
    fromWallet = Keypair.fromSecretKey(bs58.decode(rawSecret.trim()));
  }
  console.log("✅ KẾT NỐI VÍ NGUỒN PHÁT THÀNH CÔNG:", fromWallet.publicKey.toBase58());
} catch (error) {
  console.error("❌ LỖI: Định dạng mật mã ví (Private Key) không hợp lệ:", error.message);
  process.exit(1);
}

// 3. API XỬ LÝ DUYỆT LỆNH CHUYỂN TOKEN TỰ ĐỘNG
app.post('/api/payout', async (req, res) => {
  try {
    const { wallet, amount } = req.body;

    if (!wallet || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "Thiếu địa chỉ ví nhận (wallet) hoặc số lượng token (amount)" 
      });
    }

    console.log(`🚀 Hệ thống đang tự động duyệt lệnh: Chuyển ${amount} Token tới ví ${wallet}...`);

    const toPublicKey = new PublicKey(wallet);
    const mintPublicKey = new PublicKey(tokenMintAddress);

    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection, 
      fromWallet, 
      mintPublicKey, 
      fromWallet.publicKey
    );
    
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection, 
      fromWallet, 
      mintPublicKey, 
      toPublicKey
    );

    const decimals = parseInt(process.env.TOKEN_DECIMALS || '9', 10);
    const amountInLamports = BigInt(Math.round(amount * Math.pow(10, decimals)));

    const transferInstruction = createTransferInstruction(
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      amountInLamports
    );

    const transaction = new Transaction().add(transferInstruction);

    const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet]);
    console.log(`✅ CHUYỂN TOKEN TỰ ĐỘNG THÀNH CÔNG! Mã Tx: ${signature}`);
    return res.json({
      success: true,
      status: "approved",
      message: "Duyệt lệnh chuyển Token tự động thành công!",
      signature: signature
    });

  } catch (error) {
    console.error("❌ LỖI KHÔNG CHUYỂN ĐƯỢC TOKEN TỰ ĐỘNG:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi giao dịch on-chain: " + error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server payout tự động đang chạy tại cổng ${PORT}`);
});
