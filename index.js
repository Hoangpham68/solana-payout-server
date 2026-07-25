const express = require('express');
const { Connection, PublicKey, Keypair, clusterApiUrl } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');

const app = express();
app.use(express.json());

// Kết nối Solana Mainnet
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

// Khởi tạo Ví Nóng
const SECRET_KEY_ARRAY = [/* DÁN MẢNG PRIVATE KEY CỦA VÍ NÓNG VÀO ĐÂY */];
const payer = Keypair.fromSecretKey(Uint8Array.from(SECRET_KEY_ARRAY));
const MINT_ADDRESS = new PublicKey("HHb2PrZYNwqJLCJGKMvwtsRdc3hZvMBNdpqY5KDofEDo");

app.post('/payout-cdbm', async (req, res) => {
    const { user_wallet, token_amount, secret_pass } = req.body;

    // Bảo mật: Mật khẩu xác thực từ WordPress
    if (secret_pass !== 'MAT_KHAU_BAO_MAT_CUA_BAN') {
        return res.status(403).json({ success: false, message: 'Khóa bảo mật không đúng' });
    }

    try {
        const recipientPubKey = new PublicKey(user_wallet);

        // Lấy tài khoản Token của Ví Nóng & Người nhận
        const sourceAccount = await getOrCreateAssociatedTokenAccount(connection, payer, MINT_ADDRESS, payer.publicKey);
        const destinationAccount = await getOrCreateAssociatedTokenAccount(connection, payer, MINT_ADDRESS, recipientPubKey);

        // Bắn Token (Giả định Token có 9 chữ số thập phân - Decimals)
        const amountInLamports = BigInt(Math.floor(token_amount * (10 ** 9)));
        const signature = await transfer(
            connection,
            payer,
            sourceAccount.address,
            destinationAccount.address,
            payer.publicKey,
            amountInLamports
        );

        res.json({ success: true, txHash: signature });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server payout đang chạy ở port ${PORT}...`));
