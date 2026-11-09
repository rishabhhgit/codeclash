import { NextResponse } from 'next/server';
import { getQuestionBySlug } from '../../../../lib/questions/data';
import { runCode, ExecutionSummary } from '../../../../lib/execution/runner';
import { runCppNative, runPythonNative } from '../../../../lib/execution/nativeRunner';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, code, language, isSubmit, customTestCases } = body;

    const question = getQuestionBySlug(slug);
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    const casesToRun = isSubmit
      ? [...question.testCases, ...(question.hiddenTestCases || [])]
      : (customTestCases && customTestCases.length > 0 ? customTestCases : question.testCases);

    const lang = (language || 'cpp').toLowerCase();
    let summary: ExecutionSummary;

    try {
      if (lang === 'cpp') {
        summary = await runCppNative(code, question, casesToRun);
      } else if (lang === 'python') {
        summary = await runPythonNative(code, question, casesToRun);
      } else {
        summary = await runCode(code, lang, question, casesToRun);
      }
    } catch (execErr: any) {
      console.warn('Native runner failed, falling back to runner:', execErr);
      summary = await runCode(code, lang, question, casesToRun);
    }

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Execution failed' },
      { status: 500 }
    );
  }
}


