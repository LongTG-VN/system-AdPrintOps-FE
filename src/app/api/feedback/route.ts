import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reasonDetails, recipientEmail, fileName, imageDataBase64 } = body;

    if (!reasonDetails || typeof reasonDetails !== 'string' || !reasonDetails.trim()) {
      return NextResponse.json(
        { success: false, message: 'Nội dung góp ý không được để trống' },
        { status: 400 }
      );
    }

    const targetEmail = recipientEmail || 'longtg.ce191181@gmail.com';
    const resendApiKey = process.env.RESEND_API_KEY || 're_dyGQYe1F_MBS3o6D7sjFnAWiZBQ6Y33Q8';

    // Prepare Resend payload
    let htmlContent = `
      <h2>HỆ THỐNG PHẢN HỒI ADPRINTOPS (VERCEL SERVERLESS)</h2>
      <p><strong>Thời gian gửi:</strong> ${new Date().toISOString()}</p>
      <hr/>
      <h3>THÔNG TIN CHI TIẾT (INPUT / OUTPUT / LÝ DO):</h3>
      <pre style="background:#f4f4f4; padding:12px; border-radius:6px; font-family:monospace;">${reasonDetails}</pre>
    `;

    if (fileName) {
      htmlContent += `<p><strong>File đính kèm:</strong> ${fileName}</p>`;
    }

    const resendPayload: Record<string, unknown> = {
      from: 'AdPrintOps <onboarding@resend.dev>',
      to: [targetEmail],
      subject: '[BÁO CÁO GÓP Ý & BÁO LỖI] Bảng Báo Giá AdPrintOps',
      html: htmlContent,
    };

    if (imageDataBase64 && typeof imageDataBase64 === 'string' && imageDataBase64.contains && imageDataBase64.includes(',')) {
      const base64Data = imageDataBase64.split(',')[1];
      resendPayload.attachments = [
        {
          filename: fileName || 'dinh_kem.png',
          content: base64Data,
        },
      ];
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend API Error on Vercel:', resendData);
      return NextResponse.json(
        { success: false, message: resendData.message || 'Gửi mail qua Vercel Serverless thất bại' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã gửi góp ý trực tiếp tới email ${targetEmail} qua Vercel!`,
      data: resendData,
    });
  } catch (error) {
    console.error('Vercel Feedback API Route Error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi hệ thống khi gửi góp ý' },
      { status: 500 }
    );
  }
}
