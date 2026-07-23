export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Phương thức không được phép (Method Not Allowed)' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
    });
  }

  try {
    const username = env.GITHUB_USERNAME;
    const repo = env.GITHUB_REPO || 'youtube-to-r2';
    const token = env.GITHUB_PAT;

    if (!username || !token) {
      return new Response(JSON.stringify({ error: 'Lỗi cấu hình máy chủ: Thiếu thông tin xác thực GitHub.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Dữ liệu gửi lên không đúng định dạng JSON.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { youtube_url, custom_filename, audio_format } = body;

    if (!youtube_url || typeof youtube_url !== 'string') {
      return new Response(JSON.stringify({ error: 'Thiếu hoặc sai định dạng đường dẫn YouTube!' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validFormats = ['mp3', 'm4a', 'wav'];
    const format = validFormats.includes(audio_format) ? audio_format : 'mp3';
    const sanitizedFilename = custom_filename ? String(custom_filename).trim().slice(0, 100) : '';

    const ghResponse = await fetch(`https://api.github.com/repos/${username}/${repo}/actions/workflows/download.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
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

    if (!ghResponse.ok) {
      const errText = await ghResponse.text();
      let errorMessage = errText;
      try {
        const errJson = JSON.parse(errText);
        errorMessage = errJson.message || errText;
      } catch (_) {}

      return new Response(JSON.stringify({ error: `Lỗi GitHub API (${ghResponse.status}): ${errorMessage}` }), {
        status: ghResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Đã kích hoạt kịch bản ngầm thành công!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: `Lỗi hệ thống nội bộ: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
