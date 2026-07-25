const express = require('express');
const { Connection, PublicKey, Keypair, clusterApiUrl } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');

const app = express();
app.use(express.json());

const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

// Đọc mảng Secret Key & Mật khẩu từ biến môi trường của Render
const secretKeyString = process.env.PRIVATE_KEY || '[]';
const SECRET_KEY_ARRAY = JSON.parse(secretKeyString);
const SECRET_PASS = process.env.SECRET_PASS || 'default_pass';

const MINT_ADDRESS = new PublicKey("HHb2PrZYNwqJLCJGKMvwtsRdc3hZvMBNdpqY5KDofEDo");

app.post('/payout-cdbm', async (req, res) => {
    const { user_wallet, token_amount, secret_pass } = req.body;

    if (secret_pass !== SECRET_PASS) {
        return res.status(403).json({ success: false, message: 'Khóa bảo mật không đúng' });
    }

    try {
        if (!SECRET_KEY_ARRAY.length) {
            throw new Error('Chưa cấu hình Private Key trên Render');
        }

        const payer = Keypair.fromSecretKey(Uint8Array.from(SECRET_KEY_ARRAY));
        const recipientPubKey = new PublicKey(user_wallet);

        const sourceAccount = await getOrCreateAssociatedTokenAccount(connection, payer, MINT_ADDRESS, payer.publicKey);
        const destinationAccount = await getOrCreateAssociatedTokenAccount(connection, payer, MINT_ADDRESS, recipientPubKey);

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
