// === BỘ MÃ NGUỒN ĐÃ VÁ LỖI RPC VÀ ĐỒNG BỘ BIẾN MÔI TRƯỜNG CHUẨN XÁC ===
const express = require('express');
const cors = require('cors');
const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferInstruction } = require('@solana/spl-token');
const bs58 = require('bs58');

const app = express();
app.use(express.json());
app.use(cors());

// ✅ ĐÃ SỬA: Kết nối đúng cổng RPC API của mạng lưới Solana chính thức
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

let fromWallet;
// ✅ ĐÃ SỬA: Đồng bộ gọi cả 3 tên biến môi trường phổ biến nhất để không bao giờ bị thiếu Ví nguồn
const rawSecret = process.env.PRIVATE_KEY || process.env.SOLANA_SECRET_KEY || process.env.SOLANA_PRIVATE_KEY;
const tokenMintAddress = process.env.TOKEN_MINT_ADDRESS || "HHb2PrZYNwqJLCJGKMvwtsRdc3hZvMBNdpqY5KDofEDo";

if (!rawSecret) {
    console.error("✕ LỖI: Chú chưa cài đặt biến môi trường PRIVATE_KEY trên Render!");
    process.exit(1);
}

try {
    if (rawSecret.trim().startsWith('[')) {
        fromWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(rawSecret)));
    } else {
        fromWallet = Keypair.fromSecretKey(bs58.decode(rawSecret.trim()));
    }
    console.log("✅ KẾT NỐI VÍ NGUỒN PHÁT THƯỞNG THÀNH CÔNG!");
} catch (error) {
    console.error("✕ LỖI: Định dạng mật mã ví bị sai!", error.message);
    process.exit(1);
}

// MẠCH API XỬ LÝ DUYỆT LỆNH TỰ ĐỘNG KHỚP VỚI WEB APP
app.post('/api/payout', async (req, res) => {
    try {
        const { wallet, amount } = req.body;
        
        if (!wallet || !amount) {
            return res.status(400).json({ success: false, message: "Thiếu địa chỉ ví nhận hoặc số lượng token!" });
        }

        console.log(`🚀 Hệ thống đang tự động duyệt lệnh: Chuyển ${amount} CDBM tới ví ${wallet}...`);

        const toPublicKey = new PublicKey(wallet);
        const mintPublicKey = new PublicKey(tokenMintAddress);

        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mintPublicKey, fromWallet.publicKey);
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mintPublicKey, toPublicKey);

        const transaction = new Transaction().add(
            createTransferInstruction(
                fromTokenAccount.address,
                toTokenAccount.address,
                fromWallet.publicKey,
                BigInt(Math.round(amount * 1000000000)) // Đơn vị Token units
            )
        );

        const signature = await connection.sendTransaction(transaction, [fromWallet]);
        console.log(`✅ CHUYỂN TOKEN TỰ ĐỘNG THÀNH CÔNG! Mã Tx: ${signature}`);

        res.json({ success: true, status: "approved", message: "Duyệt lệnh chuyển Token tự động thành công!", signature: signature });

    } catch (error) {
        console.error("✕ LỖI KHÔNG CHUYỂN ĐƯỢC TOKEN TỰ ĐỘNG:", error.message);
        res.json({ success: false, message: "Lỗi xử lý Blockchain tự động: " + error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`==> Máy chủ RewardSol đang chạy tự động duyệt tại cổng ${PORT}`);
});
