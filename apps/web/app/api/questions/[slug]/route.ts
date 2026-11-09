import { NextResponse } from 'next/server';
import { getQuestionBySlug } from '../../../../lib/questions/data';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const question = getQuestionBySlug(slug);

  if (!question) {
    return NextResponse.json(
      { success: false, error: `Question '${slug}' not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: question,
  });
}

