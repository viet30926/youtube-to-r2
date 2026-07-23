export async function onRequest(context) {
  const { request, env } = context;

  // 1. Cấu hình Headers bảo mật & Chuẩn hóa JSON
  const headers = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Methods': 'POST'
  };

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Phương thức không được phép (Method Not Allowed)' }), {
      status: 405,
      headers
    });
  }

  try {
    // 2. Kiểm tra biến môi trường hệ thống
    const username = env.GITHUB_USERNAME;
    const repo = env.GITHUB_REPO || 'youtube-to-r2';
    const token = env.GITHUB_PAT;

    if (!username || !token) {
      return new Response(JSON.stringify({ error: 'Lỗi cấu hình máy chủ: Thiếu thông tin xác thực GitHub.' }), {
        status: 500,
        headers
      });
    }

    // 3. Phân tích dữ liệu đầu vào an toàn
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Dữ liệu gửi lên không đúng định dạng JSON.' }), {
        status: 400,
        headers
      });
    }

    const { youtube_url, custom_filename, audio_format } = body;

    // 4. Server-Side Validation: Chặn đứng URL rác
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtube_url || typeof youtube_url !== 'string' || !ytRegex.test(youtube_url.trim())) {
      return new Response(JSON.stringify({ error: 'Thiếu hoặc sai định dạng đường dẫn YouTube!' }), {
        status: 400,
        headers
      });
    }

    // 5. Data Sanitization: Chống Command Injection
    const validFormats = ['mp3', 'm4a', 'wav'];
    const format = validFormats.includes(audio_format) ? audio_format : 'mp3';
    
    // Chỉ cho phép chữ cái, số, gạch ngang, gạch dưới. Các ký tự khác chuyển thành '_'
    const sanitizedFilename = custom_filename 
      ? String(custom_filename).trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100) 
      : '';

    // 6. Kích hoạt GitHub Actions với chuẩn API mới nhất
    const ghResponse = await fetch(`https://api.github.com/repos/${username}/${repo}/actions/workflows/download.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28', // Header chuẩn mới của GitHub
        'User-Agent': 'Cloudflare-Pages-Production-Engine'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          youtube_url: youtube_url.trim(),
          custom_filename: sanitizedFilename,
          audio_format: format
        }
      })
    });

    // 7. Xử lý lỗi trả về từ GitHub chi tiết
    if (!ghResponse.ok) {
      const errText = await ghResponse.text();
      let errorMessage = errText;
      try {
        const errJson = JSON.parse(errText);
        errorMessage = errJson.message || errText;
      } catch (_) {
        // Fallback về text thô nếu không phải JSON
      }

      return new Response(JSON.stringify({ error: `Lỗi GitHub API (${ghResponse.status}): ${errorMessage}` }), {
        status: ghResponse.status,
        headers
      });
    }

    // 8. Trả kết quả thành công
    return new Response(JSON.stringify({ success: true, message: 'Đã kích hoạt kịch bản ngầm thành công!' }), {
      status: 200,
      headers
    });

  } catch (err) {
    // Bắt các lỗi exception chưa lường trước (VD: Lỗi mạng khi gọi fetch)
    return new Response(JSON.stringify({ error: `Lỗi hệ thống nội bộ: ${err.message}` }), {
      status: 500,
      headers
    });
  }
}
