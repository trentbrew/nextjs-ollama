export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// This route runs on Node.js to allow filesystem access

export async function POST(req: NextRequest) {
  try {
    const { dir } = await req.json();
    // Resolve and normalize path under workspace root
    const baseDir = process.cwd();
    const targetDir = path.resolve(baseDir, dir);
    if (!targetDir.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Invalid directory path' },
        { status: 400 },
      );
    }
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const result = entries.map((e) => ({
      name: e.name,
      isFile: e.isFile(),
      isDirectory: e.isDirectory(),
    }));
    return NextResponse.json({ entries: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
