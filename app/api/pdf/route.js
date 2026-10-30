import puppeteer from 'puppeteer-core';
import { findChrome } from '@/lib/chrome';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/pdf?id=<noteId>
 *
 * Renders the print view with headless Chrome and returns the file.
 *
 * The browser's own print dialog is not reliable for this document: its Scale
 * and Margins settings silently rescale the page, which changes the 0.5pt rules
 * into something thicker and shifts every measurement. Driving Chrome directly
 * with preferCSSPageSize pins the sheet to the 1684 x 1190 pt the CSS declares,
 * whatever the user's printer defaults happen to be.
 */
export async function GET(request) {
  const exe = findChrome();
  if (!exe) {
    return Response.json(
      { ok: false, error: 'chrome_not_found', message: 'Set CHROME_PATH in .env.local to your Chrome or Edge executable.' },
      { status: 500 }
    );
  }

  const { searchParams, origin } = new URL(request.url);
  const id = searchParams.get('id');
  const target = `${origin}/print${id ? `?id=${encodeURIComponent(id)}` : ''}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: exe,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'],
    });
    const page = await browser.newPage();
    await page.goto(target, { waitUntil: 'networkidle0', timeout: 45000 });
    await page.waitForSelector('.page', { timeout: 20000 });
    const pdf = await page.pdf({
      preferCSSPageSize: true,   // honour @page { size: 1684pt 1190pt }
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      scale: 1,
    });
    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="contract-note.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: 'render_failed', message: String((err && err.message) || err) },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
