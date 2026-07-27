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

// ⚠️ ĐIỀN THÔNG TIN VÍ VÀ TOKEN CỦA CÔ CHÚ VÀO GIỮA CÁC DẤU NHÁY KÉP ""
const PRIVATE_KEY_BASE58 = "THAY_PRIVATE_KEY_CỦA_CÔ_CHÚ_VÀO_ĐÂY"; 
const TOKEN_MINT_ADDRESS_STR = "THAY_MÃ_MINT_TOKEN_VÀO_ĐÂY";

const fromWallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_BASE58));
const TOKEN_MINT_ADDRESS = new PublicKey(TOKEN_MINT_ADDRESS_STR);

app.post('/api/payout', async (req, res) => {
    try {
        const { userWalletAddress, amount } = req.body;
        if (!userWalletAddress || !amount) {
            return res.status(400).json({ success: false, error: "Thiếu địa chỉ ví hoặc số lượng" });
        }
        const toWalletPublicKey = new PublicKey(userWalletAddress);
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection, fromWallet, TOKEN_MINT_ADDRESS, fromWallet.publicKey
        );
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection, fromWallet, TOKEN_MINT_ADDRESS, toWalletPublicKey
        );
        const txHash = await transfer(
            connection,
            fromWallet,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            parseInt(amount) 
        );
        return res.json({ success: true, txHash: txHash });
    } catch (error) {
        console.error("Lỗi xử lý:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy mượt mà tại port ${PORT}`));
