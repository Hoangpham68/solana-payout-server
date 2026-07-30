const express = require('express');
const cors = require('cors');
const { Connection, Keypair, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');
const bs58 = require('bs58');

const app = express();
app.use(express.json());
app.use(cors());

// Kết nối mạng thử nghiệm (Devnet)
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// 1. Đọc Private Key an toàn
const rawPrivateKey = (process.env.PRIVATE_KEY || '').trim();
let fromWallet = null;

if (rawPrivateKey) {
  try {
    if (rawPrivateKey.startsWith('[')) {
      const secretKeyArray = Uint8Array.from(JSON.parse(rawPrivateKey));
      fromWallet = Keypair.fromSecretKey(secretKeyArray);
    } else {
      const secretKeyArray = bs58.decode(rawPrivateKey);
      fromWallet = Keypair.fromSecretKey(secretKeyArray);
    }
    console.log("✅ Load VÍ THÀNH CÔNG! Địa chỉ:", fromWallet.publicKey.toBase58());
  } catch (err) {
    console.error("❌ LỖI VÍ: Mã PRIVATE_KEY bị sai định dạng!", err.message);
  }
} else {
  console.warn("⚠️ CẢNH BÁO: Bạn chưa nhập PRIVATE_KEY ở mục Environment trên Render!");
}

// 2. Đọc Token Mint Address an toàn (Không bao giờ gây sập server)
const TOKEN_MINT_STR = (process.env.TOKEN_MINT_ADDRESS || '').trim();
let TOKEN_MINT_ADDRESS = null;

if (TOKEN_MINT_STR) {
  try {
    TOKEN_MINT_ADDRESS = new PublicKey(TOKEN_MINT_STR);
    console.log("✅ Load TOKEN MINT THÀNH CÔNG!");
  } catch (err) {
    console.error("❌ LỖI TOKEN: Mã TOKEN_MINT_ADDRESS bị sai định dạng!");
  }
} else {
  console.warn("⚠️ CẢNH BÁO: Bạn chưa nhập TOKEN_MINT_ADDRESS ở mục Environment trên Render!");
}

app.post('/api/payout', async (req, res) => {
  try {
    const { userWalletAddress, amount } = req.body;
    
    if (!userWalletAddress || !amount) {
      return res.status(400).json({ success: false, error: 'Thiếu userWalletAddress hoặc amount' });
    }

    if (!fromWallet) {
      return res.status(500).json({ success: false, error: 'Server chưa nhận được PRIVATE_KEY hợp lệ!' });
    }

    if (!TOKEN_MINT_ADDRESS) {
      return res.status(500).json({ success: false, error: 'Server chưa nhận được TOKEN_MINT_ADDRESS hợp lệ!' });
    }

    const toWalletPublicKey = new PublicKey(userWalletAddress);

    return res.json({ success: true, message: 'Yêu cầu payout đã nhận thành công!' });

  } catch (error) {
    console.error("Lỗi khi xử lý payout:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy thành công trên port ${PORT}`);
});
