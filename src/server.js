const http = require('http');
const { randomBytes } = require('crypto');
const { URL } = require('url');

const PORT = 9000;
const books = [];

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, jsonHeaders);
  res.end(JSON.stringify(payload));
}

function createId() {
  return randomBytes(8).toString('hex');
}

function now() {
  return new Date().toISOString();
}

function parseBoolean(value) {
  return value === true || value === 'true';
}

function buildBook(payload, existing = null) {
  const timestamp = now();
  const pageCount = Number(payload.pageCount);
  const readPage = Number(payload.readPage);

  return {
    id: existing ? existing.id : createId(),
    name: payload.name,
    year: Number(payload.year),
    author: payload.author,
    summary: payload.summary,
    publisher: payload.publisher,
    pageCount,
    readPage,
    finished: pageCount === readPage,
    reading: parseBoolean(payload.reading),
    insertedAt: existing ? existing.insertedAt : timestamp,
    updatedAt: timestamp,
  };
}

function validateBook(payload, action) {
  const prefix = action === 'add' ? 'Gagal menambahkan buku.' : 'Gagal memperbarui buku.';

  if (!payload.name) {
    return {
      status: 400,
      body: {
        status: 'fail',
        message: `${prefix} Mohon isi nama buku`,
      },
    };
  }

  if (Number(payload.readPage) > Number(payload.pageCount)) {
    return {
      status: 400,
      body: {
        status: 'fail',
        message: `${prefix} readPage tidak boleh lebih besar dari pageCount`,
      },
    };
  }

  return null;
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload terlalu besar'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON tidak valid'));
      }
    });
    req.on('error', reject);
  });
}

async function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (req.method === 'GET' && pathname === '/') {
    return sendJson(res, 200, { status: 'success', message: 'Bookshelf API is running' });
  }

  // POST /books
  if (req.method === 'POST' && pathname === '/books') {
    let body;
    try {
      body = await getRequestBody(req);
    } catch {
      return sendJson(res, 400, { status: 'fail', message: 'Request body tidak valid' });
    }

    const validation = validateBook(body, 'add');
    if (validation) return sendJson(res, validation.status, validation.body);

    const book = buildBook(body);
    books.push(book);

    return sendJson(res, 201, {
      status: 'success',
      message: 'Buku berhasil ditambahkan',
      data: { bookId: book.id },
    });
  }

  // GET /books
  if (req.method === 'GET' && pathname === '/books') {
    let result = [...books];

    if (url.searchParams.has('name')) {
      const keyword = url.searchParams.get('name').toLowerCase();
      result = result.filter((book) => book.name.toLowerCase().includes(keyword));
    }

    if (url.searchParams.has('reading')) {
      const reading = url.searchParams.get('reading') === '1';
      result = result.filter((book) => book.reading === reading);
    }

    if (url.searchParams.has('finished')) {
      const finished = url.searchParams.get('finished') === '1';
      result = result.filter((book) => book.finished === finished);
    }

    const compactBooks = result.map(({ id, name, publisher }) => ({ id, name, publisher }));

    return sendJson(res, 200, {
      status: 'success',
      data: { books: compactBooks },
    });
  }

  const match = pathname.match(/^\/books\/([^/]+)$/);
  if (match) {
    const bookId = decodeURIComponent(match[1]);
    const index = books.findIndex((book) => book.id === bookId);

    // GET /books/{bookId}
    if (req.method === 'GET') {
      if (index === -1) {
        return sendJson(res, 404, { status: 'fail', message: 'Buku tidak ditemukan' });
      }

      return sendJson(res, 200, {
        status: 'success',
        data: { book: books[index] },
      });
    }

    // PUT /books/{bookId}
    if (req.method === 'PUT') {
      if (index === -1) {
        return sendJson(res, 404, {
          status: 'fail',
          message: 'Gagal memperbarui buku. Id tidak ditemukan',
        });
      }

      let body;
      try {
        body = await getRequestBody(req);
      } catch {
        return sendJson(res, 400, { status: 'fail', message: 'Request body tidak valid' });
      }

      const validation = validateBook(body, 'update');
      if (validation) return sendJson(res, validation.status, validation.body);

      const updatedBook = buildBook(body, books[index]);
      books[index] = updatedBook;

      return sendJson(res, 200, {
        status: 'success',
        message: 'Buku berhasil diperbarui',
        data: { book: updatedBook },
      });
    }

    // DELETE /books/{bookId}
    if (req.method === 'DELETE') {
      if (index === -1) {
        return sendJson(res, 404, {
          status: 'fail',
          message: 'Buku gagal dihapus. Id tidak ditemukan',
        });
      }

      books.splice(index, 1);
      return sendJson(res, 200, {
        status: 'success',
        message: 'Buku berhasil dihapus',
      });
    }
  }

  return sendJson(res, 404, { status: 'fail', message: 'Route tidak ditemukan' });
}

const server = http.createServer((req, res) => {
  requestHandler(req, res).catch(() => {
    if (!res.headersSent) {
      sendJson(res, 500, { status: 'fail', message: 'Terjadi kesalahan pada server' });
    } else {
      res.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Bookshelf API berjalan pada http://localhost:${PORT}`);
});
