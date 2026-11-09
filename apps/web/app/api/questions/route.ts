import { NextResponse } from 'next/server';
import { getAllQuestions } from '../../../lib/questions/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get('difficulty');
  const topic = searchParams.get('topic');
  const search = searchParams.get('search');

  let questions = getAllQuestions();

  if (difficulty) {
    questions = questions.filter(
      (q) => q.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }

  if (topic) {
    questions = questions.filter((q) =>
      q.topics.some((t) => t.toLowerCase() === topic.toLowerCase())
    );
  }

  if (search) {
    const q = search.toLowerCase();
    questions = questions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        String(item.number).includes(q)
    );
  }

  return NextResponse.json({
    success: true,
    total: questions.length,
    data: questions,
  });
}

