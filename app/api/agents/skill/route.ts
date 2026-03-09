import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const skillPath = path.join(process.cwd(), 'public', 'skill.md');
  const content = fs.readFileSync(skillPath, 'utf-8');

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
