const express = require('express');
const cors = require('cors');
const { Connection, Keypair, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');
const bs58 = require('bs58');

const app = express();
app.use(express.json());
app.use(cors());

// Kết nối mạng thử nghiệm (Devnet) hoặc Mainnet tùy cấu hình
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// 💡 Đọc Private Key từ biến môi trường (Render Environment Variable)
// Nếu không có biến môi trường thì lấy chuỗi mặc định
const rawPrivateKey = (process.env.PRIVATE_KEY || '').trim();

let fromWallet;

if (rawPrivateKey) {
  try {
    if (rawPrivateKey.startsWith('[')) {
      // Dành cho dạng mảng số: [12, 34, 56, ...]
      const secretKeyArray = Uint8Array.from(JSON.parse(rawPrivateKey));
      fromWallet = Keypair.fromSecretKey(secretKeyArray);
    } else {
      // Dành cho dạng chuỗi Base58
      const secretKeyArray = bs58.decode(rawPrivateKey);
      fromWallet = Keypair.fromSecretKey(secretKeyArray);
    }
    console.log("✅ Load ví thành công! Địa chỉ ví:", fromWallet.publicKey.toBase58());
  } catch (err) {
    console.error("❌ Lỗi decode Private Key:", err.message);
  }
} else {
  console.warn("⚠️ CẢNH BÁO: Chưa tìm thấy biến môi trường PRIVATE_KEY!");
}

// Mã Mint của Token (Lấy từ biến môi trường TOKEN_MINT hoặc điền trực tiếp nếu muốn)
const TOKEN_MINT_STR = (process.env.TOKEN_MINT_ADDRESS || '').trim();
let TOKEN_MINT_ADDRESS = null;
if (TOKEN_MINT_STR) {
  TOKEN_MINT_ADDRESS = new PublicKey(TOKEN_MINT_STR);
}

app.post('/api/payout', async (req, res) => {
  try {
    const { userWalletAddress, amount } = req.body;
    if (!userWalletAddress || !amount) {
      return res.status(400).json({ success: false, error: 'Thiếu userWalletAddress hoặc amount' });
    }

    if (!fromWallet) {
      return res.status(500).json({ success: false, error: 'Server chưa cấu hình PRIVATE_KEY hợp lệ!' });
    }

    const toWalletPublicKey = new PublicKey(userWalletAddress);

    // Code xử lý Payout tiếp theo của bạn...
    return res.json({ success: true, message: 'Yêu cầu payout đã nhận' });

  } catch (error) {
    console.error("Lỗi khi xử lý payout:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
