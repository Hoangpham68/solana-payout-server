// === TỰ DUYỆT + TỰ GỬI TOKEN CDBM - BỘ MÃ HOÀN CHỈNH ===
const express = require('express');
const { Connection, Keypair, PublicKey, Transaction, clusterApiUrl } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createTransferInstruction } = require('@solana/spl-token');
const app = express();
app.use(express.json());

// === KẾT NỐI MẠNG SOLANA ===
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

// === HÀM KIỂM TRA ĐỦ ĐIỀU KIỆN RÚT TOKEN ===
function kiemTraTuDuyet(yeuCau) {
  return yeuCau.tongDiem >= 500 && yeuCau.emailDaXacMinh === true && yeuCau.viSolanaHopLe === true;
}

// === API XỬ LÝ YÊU CẦU ĐỔI ĐIỂM NHẬN TOKEN ===
app.post('/rut-token', async (req, res) => {
  try {
    const { amount, userWalletAddress } = req.body;

    // Kiểm tra dữ liệu cơ bản
    if (!amount || !userWalletAddress) return res.json({thanhCong: false, thongBao: "Thiếu thông tin!"});
    if (amount < 500) return res.json({thanhCong: false, thongBao: "Cần ít nhất 500 điểm để đổi!"});

    // === Kiểm tra & TỰ ĐỘNG DUYỆT ===
    const yeuCau = {
      tongDiem: amount,
      emailDaXacMinh: true,
      viSolanaHopLe: true
    };
    let trangThai = "cho_duyet";
    if (kiemTraTuDuyet(yeuCau)) {
      trangThai = "da_duyet";
      console.log("✅ Đủ điều kiện → TỰ ĐỘNG DUYỆT");
      console.log("🚀 Đang xử lý gửi CDBM đến ví:", userWalletAddress);

      try {
        // === LẤY DỮ LIỆU AN TOÀN CHỈ TỪ RENDER - KHÔNG LỖ MÃ ===
        const privateKeyEnv = process.env.PRIVATE_KEY;
        const tokenMintAddr = process.env.TOKEN_MINT_ADDRESS;
        if(!privateKeyEnv || !tokenMintAddr) throw new Error("Chưa cấu hình thông tin ví/token!");

        const fromKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKeyEnv)));
        const tokenMint = new PublicKey(tokenMintAddr);
        const denNhan = new PublicKey(userWalletAddress);

        // === TÍNH ĐÚNG SỐ TOKEN CDBM: 9 chữ số thập phân ===
        const soTokenChuyen = BigInt(Math.floor(amount * 10 ** 9));

        // === LẤY ĐỊA CHỈ TÀI KHOẢN TOKEN LIÊN KẾT ===
        const taiKhoanGui = await getAssociatedTokenAddress(tokenMint, fromKeypair.publicKey);
        const taiKhoanNhan = await getAssociatedTokenAddress(tokenMint, denNhan);

        // === TẠO + KÝ + GỬI GIAO DỊCH CHUYỂN TOKEN ===
        const giaoDich = new Transaction().add(
          createTransferInstruction(
            taiKhoanGui,
            taiKhoanNhan,
            fromKeypair.publicKey,
            soTokenChuyen
          )
        );
        const maGiaoDich = await connection.sendTransaction(giaoDich, [fromKeypair]);
        console.log("✅ GỬI THÀNH CÔNG! Mã giao dịch:", maGiaoDich);

      } catch (loiGui) {
        console.error("❌ Lỗi gửi token:", loiGui.message);
        return res.json({thanhCong: false, thongBao: "Đã duyệt nhưng lỗi gửi token: "+loiGui.message});
      }
    }

    return res.json({thanhCong: true, trangThai: trangThai, thongBao: "Xử lý thành công!"});

  } catch (loi) {
    console.error("❌ Lỗi hệ thống:", loi.message);
    return res.json({thanhCong: false, thongBao: "Lỗi hệ thống: "+loi.message});
  }
});

// === KHỞI ĐỘNG MÁY CHỦ ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy cổng ${PORT} - Tự duyệt + tự gửi CDBM sẵn sàng!`);
});
