const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair, clusterApiUrl } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');

const app = express();

// Bật CORS để cho phép kết nối từ WordPress
app.use(cors());
app.use(express.json());

// Kết nối với mạng Solana (Mainnet)
const connection = new Connection(clusterApiUrl('mainnet-beta'));

const secretKeyString = process.env.PRIVATE_KEY;
const SECRET_KEY_ARRAY = JSON.parse(secretKeyString || '[]');

const MINT_ADDRESS = new PublicKey("HHb2... "); // Thay bằng Mint Address Token của bạn nếu cần

app.post('/payout-cdbm', async (req, res) => {
    const { user_wallet, token_amount } = req.body;

    try {
        if (!SECRET_KEY_ARRAY.length) {
            throw new Error('Chưa cấu hình PRIVATE_KEY trong biến môi trường Render!');
        }

        const payer = Keypair.fromSecretKey(Uint8Array.from(SECRET_KEY_ARRAY));
        const toPublicKey = new PublicKey(user_wallet);

        // Code xử lý chuyển token sẽ tiếp tục thực thi ở đây...
        
        res.json({ success: true, message: 'Gửi yêu cầu thành công!' });
    } catch (error) {
        console.error('Lỗi Payout:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
